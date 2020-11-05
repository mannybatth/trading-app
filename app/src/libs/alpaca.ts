import Alpaca from '@alpacahq/alpaca-trade-api';
import { alpacaApiKey, alpacaApiSecret, extendedHours, maxPositionSize, profitPercent, stopLossPercent } from '../constants';
import { db, firebaseAdmin } from '../firebase-admin';
import type { Clock, Order, OrderUpdateMessage, StockPosition } from '../models/alpaca-models';
import { colors } from '../models/colors';
import type { Alert, EntryPositionDoc } from '../models/models';
import { getQuote, isValidPrice } from './quote';

const round = (value: number, decimals: number) => {
  return Number(Math.round((value + 'e' + decimals) as any) + 'e-' + decimals);
};

const calcProfitLoss = (price: number) => {
  return {
    profit: round(price * (1 + profitPercent), 3),
    loss: round(price * (1 - stopLossPercent), 3),
  };
};

const calcQuantity = (price: number) => {
  if (price >= maxPositionSize) {
    return 1;
  }

  return Math.floor(maxPositionSize / price);
};

const isInRange = (value: string, range: string[]) => {
  return value >= range[0] && value <= range[1];
};

export class AlpacaClient {
  public client: Alpaca;
  public pendingAlerts = new Map<string, { alert: Alert; discriminator: string }>();

  init() {
    this.client = new Alpaca({
      keyId: alpacaApiKey,
      secretKey: alpacaApiSecret,
      paper: true,
      usePolygon: false,
    });

    const socket = this.client.trade_ws;
    socket.onConnect(function () {
      console.log('Connected to socket');
      const trade_keys = ['trade_updates'];
      socket.subscribe(trade_keys);
    });
    socket.onDisconnect(() => {
      console.log('Disconnected from socket');
    });
    socket.onStateChange((newState: string) => {
      console.log(`State changed to ${newState}`);
    });
    socket.onOrderUpdate(async (message: OrderUpdateMessage) => {
      console.log(
        colors.fg.Cyan,
        `Order update: ${JSON.stringify({
          event: message.event,
          side: message.order.side,
          symbol: message.order.symbol,
          filled_qty: message.order.filled_qty,
          order_qty: message.order.qty,
          order_type: message.order.order_type,
          filled_avg_price: message.order.filled_avg_price,
          limit_price: message.order.limit_price,
          client_order_id: message.order.client_order_id,
        })}`
      );
      if (message?.event === 'fill') {
        const qty = parseFloat(message?.order?.filled_qty);

        if (qty > 0 && message.order.side === 'buy') {
          const clientId: string = message?.order?.client_order_id;
          const [discriminator, symbol] = clientId.split('-');

          const { doc: entryPosition, fromDiscriminator } = await this.findEntryPosition(symbol, discriminator);
          if (fromDiscriminator && entryPosition) {
            entryPosition.ref.update({
              discriminator,
              symbol,
              quantity: qty + entryPosition.data().quantity,
              price: parseFloat(message.price),
              created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            db.collection('positions').add({
              discriminator,
              symbol,
              quantity: qty,
              price: parseFloat(message.price),
              created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
          }
          db.doc(`alerts/${discriminator}-${symbol}`).delete();
        }
      }
    });
    socket.connect();
  }

  async sendOrder(alert: Alert, discriminator: string) {
    if (this.isAlertPending(alert, discriminator)) {
      console.log(colors.fg.Yellow, 'Skipping alert, pending alert already exists');
      return;
    }

    this.addAlertToPending(alert, discriminator);
    const result =
      alert.action === 'STC' || alert.action === 'STO'
        ? await this.sellOrder(alert, discriminator)
        : await this.buyOrder(alert, discriminator);
    this.removePendingAlert(alert, discriminator);

    return result;
  }

  async buyOrder(alert: Alert, discriminator: string) {
    if (alert.risky) {
      return;
    }

    const clock: Clock = await this.client.getClock();
    if (!clock.is_open) {
      console.log(colors.fg.Yellow, 'Market is not open');
      return;
    }

    const [validInfo, alertDoc] = await Promise.all([
      isValidPrice(alert.symbol, alert.price, this.client),
      db.doc(`alerts/${discriminator}-${alert.symbol}`).get(),
    ]);

    if (!validInfo.valid) {
      console.log(colors.fg.Red, 'Price is not valid', alert.price, alert.symbol, 'bid:', validInfo.bid, 'ask:', validInfo.ask);
      return;
    }

    const timeNow = new Date().getTime();
    if (alertDoc.exists) {
      const created: number = alertDoc.data().created.seconds;
      const secondsNow = timeNow / 1000;

      // 30 min wait
      if (secondsNow - created < 1800) {
        console.log(colors.fg.Yellow, 'Alert already exists for this symbol from user, ignoring alert');
        return;
      }
    }

    const calc = calcProfitLoss(alert.price);
    const quantity = calcQuantity(alert.price);

    let limitPrice = validInfo.mark || alert.price;

    // add some cushion
    if (alert.price > 1) {
      limitPrice = limitPrice + 0.004;
    } else if (alert.price > 2) {
      limitPrice = limitPrice + 0.01;
    } else if (alert.price > 5) {
      limitPrice = limitPrice + 0.03;
    } else if (alert.price > 10) {
      limitPrice = limitPrice + 0.04;
    }

    try {
      console.log(
        'Creating buy order',
        alert.symbol,
        'limit:',
        limitPrice,
        'profit:',
        calc.profit,
        'stop limit:',
        calc.loss - validInfo.spread
      );
      const clientId = `${discriminator}-${alert.symbol}-${timeNow}`;
      await this.client.createOrder({
        symbol: alert.symbol,
        qty: quantity,
        side: 'buy',
        type: 'limit',
        limit_price: limitPrice,
        time_in_force: 'gtc',
        order_class: 'bracket',
        take_profit: {
          limit_price: calc.profit,
        },
        stop_loss: {
          stop_price: calc.loss,
          limit_price: calc.loss - validInfo.spread,
        },
        client_order_id: clientId,
      });

      db.doc(`alerts/${discriminator}-${alert.symbol}`).set({
        ...alert,
        discriminator,
        quantity,
        created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR creating order:', error);
    }
  }

  async sellOrder(alert: Alert, discriminator: string) {
    let entryPosition: FirebaseFirestore.QueryDocumentSnapshot<EntryPositionDoc>,
      entryPositionSnapshot: FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
      stockPosition: StockPosition,
      quote: { bid: number; ask: number },
      orders: Order[];
    try {
      [{ doc: entryPosition, snapshot: entryPositionSnapshot }, stockPosition, quote, orders] = await Promise.all([
        this.findEntryPosition(alert.symbol, discriminator),
        this.findStockPosition(alert.symbol),
        getQuote(alert.symbol, this.client),
        this.client.getOrders(),
      ]);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting data for sell order', error);
      return;
    }

    if (!stockPosition) {
      console.log('Did not find stock position, cancelling any open orders', alert, discriminator);
      this.cancelOrders(orders, alert.symbol, discriminator);
      entryPositionSnapshot.docs.forEach((doc) => doc.ref.delete());
      return;
    }

    console.log('entryPosition', entryPosition?.data());
    console.log('stockPosition', stockPosition);
    console.log('quote', quote);

    if (!entryPosition) {
      console.log('Could not find entry position in db', alert, discriminator);
    }

    const clock: Clock = await this.client.getClock();
    const time = new Date(clock.timestamp);
    const timeStr = `${time.getHours()}:${time.getMinutes()}`;

    const stockPositionQty = parseFloat(stockPosition.qty);
    const qty = entryPosition ? Math.min(stockPositionQty, entryPosition.data().quantity) : stockPositionQty;
    const isFullPosition = qty === stockPositionQty;
    const isExtendedHours = isInRange(timeStr, extendedHours[0]) || isInRange(timeStr, extendedHours[1]);
    console.log('isExtendedHours', isExtendedHours);

    if (!clock.is_open && !isExtendedHours) {
      // queue up this sell order
      this.addToQueue(alert, discriminator, qty);
      return;
    }

    // Cancel existing orders
    await this.cancelOrders(orders, alert.symbol, discriminator, !isFullPosition && qty);

    const executeSellOrder = async () => {
      if (clock.is_open) {
        await this.client.createOrder({
          symbol: alert.symbol,
          qty: qty,
          side: 'sell',
          type: 'market',
          time_in_force: 'day',
        });
      } else {
        await this.client.createOrder({
          symbol: alert.symbol,
          qty: qty,
          side: 'sell',
          type: 'limit',
          limit_price: quote.bid,
          time_in_force: 'day',
          extended_hours: isExtendedHours,
        });
      }

      entryPosition && entryPosition.ref.delete();
      console.log('Created order to close position', alert, discriminator);
    };

    // Create sell order
    try {
      await executeSellOrder();
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR creating order to close position', error);

      if (error && error.includes('insufficient qty available for order')) {
        setTimeout(async () => {
          console.log('Trying sell order again now after 3s', alert, discriminator);
          try {
            await executeSellOrder();
          } catch (err) {
            const error2 = err?.error?.message || err?.message || err;
            console.log(colors.fg.Red, 'ERROR! creating order to close position on 2nd try', error2);
            this.addToQueue(alert, discriminator, qty);
          }
        }, 3000);
      } else {
        this.addToQueue(alert, discriminator, qty);
      }
    }
  }

  async findEntryPosition(symbol: string, discriminator: string) {
    type ReturnType = FirebaseFirestore.QueryDocumentSnapshot<EntryPositionDoc>;
    const snapshot = await db.collection('positions').where('symbol', '==', symbol).get();
    for (const doc of snapshot.docs) {
      if (doc.data().discriminator === discriminator) {
        return {
          doc: doc as ReturnType,
          snapshot: snapshot as FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
          fromDiscriminator: true,
        };
      }
    }
    return {
      doc: snapshot.size > 0 ? (snapshot.docs[0] as ReturnType) : null,
      snapshot: snapshot as FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
      fromDiscriminator: false,
    };
  }

  async findStockPosition(symbol: string): Promise<StockPosition> {
    try {
      return await this.client.getPosition(symbol);
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  /*
    Could we return the id here so we can replace the order instead?
  */
  async cancelOrders(orders: Order[], symbol: string, discriminator: string, qty?: number) {
    db.doc(`alerts/${discriminator}-${symbol}`).delete();
    if (qty) {
      const foundOrder = orders.find((order) => order.symbol === symbol && parseFloat(order.qty) === qty);
      if (foundOrder) {
        console.log('cancelling order', foundOrder.id);
        await this.client.cancelOrder(foundOrder.id);
      }
    } else {
      await Promise.all(
        orders.map((order) => {
          if (order.symbol === symbol) {
            console.log('cancelling order', order.id);
            return this.client.cancelOrder(order.id);
          }
        })
      );
    }
  }

  isAlertPending(alert: Alert, discriminator: string) {
    return this.pendingAlerts.has(`${alert.action}-${discriminator}-${alert.symbol}`);
  }

  addAlertToPending(alert: Alert, discriminator: string) {
    this.pendingAlerts.set(`${alert.action}-${discriminator}-${alert.symbol}`, {
      alert,
      discriminator,
    });
  }

  removePendingAlert(alert: Alert, discriminator: string) {
    this.pendingAlerts.delete(`${alert.action}-${discriminator}-${alert.symbol}`);
  }

  addToQueue(alert: Alert, discriminator: string, quantity: number) {
    console.log(colors.fg.Magenta, 'Queuing up order', alert, discriminator);
    db.doc(`queue/${alert.action}-${discriminator}-${alert.symbol}`).set({
      ...alert,
      discriminator,
      quantity,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

export const alpaca = new AlpacaClient();
