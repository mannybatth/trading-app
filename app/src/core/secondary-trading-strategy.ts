import {
  expertMaxPositionSize,
  expertTraders,
  extendedHours,
  marketOpenHours,
  maxPositionSize,
  profitPercent,
  stopLossPercent,
} from '../constants';
import { db, firebaseAdmin } from '../firebase-admin';
import { alpacaPaper, alpacaPaperSocket } from '../libs/alpaca-paper-client';
import { getQuote, isValidPrice } from '../libs/quote';
import { isInRange, round, sleep } from '../libs/utils';
import type {
  CreateOrderResponse,
  Order,
  OrderUpdateMessage,
  StockPosition,
} from '../models/alpaca-models';
import { colors } from '../models/colors';
import type { Alert, EntryPositionDoc } from '../models/models';

const calcProfitLoss = (price: number) => {
  return {
    profit: round(price * (1 + profitPercent), 3),
    loss: round(price * (1 - stopLossPercent), 3),
  };
};

const calcQuantity = (price: number, discriminator: string) => {
  const isExpert = expertTraders.includes(discriminator);
  const max = isExpert ? expertMaxPositionSize : maxPositionSize;
  if (price >= max) {
    return 1;
  }

  return Math.floor(max / price);
};

export class SecondaryTradingStrategy {
  private alpacaClient = alpacaPaper;
  private alpacaSocket = alpacaPaperSocket;
  private pendingAlerts = new Map<string, { alert: Alert; discriminator: string }>();

  constructor() {
    this.alpacaSocket.onOrderUpdate.subscribe(async (message: OrderUpdateMessage) => {
      if (message?.event === 'fill') {
        const qty = parseFloat(message?.order?.filled_qty);

        if (qty > 0 && message.order.side === 'buy') {
          const clientId: string = message?.order?.client_order_id;
          const [discriminator, symbol] = clientId.split('-');

          const { doc: entryPosition, fromDiscriminator } = await this.findEntryPosition(
            symbol,
            discriminator
          );
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
  }

  async sendOrder(alert: Alert, discriminator: string): Promise<CreateOrderResponse> {
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

  async buyOrder(alert: Alert, discriminator: string): Promise<CreateOrderResponse> {
    // if (alert.risky) {
    //   return;
    // }

    const date = new Date();
    const isMarketOpen = isInRange(date, marketOpenHours);

    if (!isMarketOpen) {
      console.log(colors.fg.Yellow, 'Market is not open');
      return {
        ok: false,
        reason: 'Market is not open',
      };
    }

    const [validInfo, alertDoc] = await Promise.all([
      isValidPrice(alert.symbol, alert.price, this.alpacaClient),
      db.doc(`alerts/${discriminator}-${alert.symbol}`).get(),
    ]);

    if (!validInfo.valid) {
      console.log(
        colors.fg.Red,
        'Price is not valid',
        alert.price,
        alert.symbol,
        'bid:',
        validInfo.bid,
        'ask:',
        validInfo.ask
      );
      return {
        ok: false,
        reason: 'Price is not valid',
      };
    }

    const timeNow = date.getTime();
    if (alertDoc.exists) {
      const created: number = alertDoc.data().created.seconds;
      const secondsNow = timeNow / 1000;

      // 30 min wait
      if (secondsNow - created < 1800) {
        console.log(
          colors.fg.Yellow,
          'Alert already exists for this symbol from user, ignoring alert'
        );
        return {
          ok: false,
          reason: 'Alert already exists for this symbol from user',
        };
      }
    }

    const calc = calcProfitLoss(alert.price);
    const quantity = calcQuantity(alert.price, discriminator);

    let limitPrice = validInfo.mark || alert.price;

    // add some cushion
    if (alert.price > 10) {
      limitPrice = limitPrice + 0.04;
    } else if (alert.price > 5) {
      limitPrice = limitPrice + 0.03;
    } else if (alert.price > 4) {
      limitPrice = limitPrice + 0.01;
    } else if (alert.price > 1) {
      limitPrice = limitPrice + 0.004;
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
      const order = await this.alpacaClient.createOrder({
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
        order_id: order.id,
      });

      return {
        ok: true,
      };
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR creating order:', error);

      return {
        ok: false,
        reason: 'error creating order',
      };
    }
  }

  async sellOrder(alert: Alert, discriminator: string): Promise<CreateOrderResponse> {
    let entryPosition: FirebaseFirestore.QueryDocumentSnapshot<EntryPositionDoc>,
      entryPositionSnapshot: FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
      fromDiscriminator: boolean,
      singleAlert: boolean,
      stockPosition: StockPosition,
      orders: Order[];
    try {
      [
        { doc: entryPosition, snapshot: entryPositionSnapshot, fromDiscriminator, singleAlert },
        stockPosition,
        orders,
      ] = await Promise.all([
        this.findEntryPosition(alert.symbol, discriminator),
        this.findStockPosition(alert.symbol),
        this.alpacaClient.getOrders({ limit: 500 }),
      ]);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting data for sell order', error);
      return {
        ok: false,
        reason: 'Error getting data for sell order',
      };
    }

    if (!stockPosition) {
      console.log('Did not find stock position, cancelling any open orders', alert, discriminator);
      this.cancelOrders(orders, alert.symbol, discriminator);
      this.removeFromQueue(alert, discriminator);
      entryPositionSnapshot.docs.forEach((doc) => doc.ref.delete());
      return {
        ok: false,
        reason: 'Did not find stock position to sell',
      };
    }

    const date = new Date();
    const isExtendedHours = isInRange(date, extendedHours[0]) || isInRange(date, extendedHours[1]);
    const isMarketOpen = isInRange(date, marketOpenHours);
    console.log('isExtendedHours', isExtendedHours);
    console.log('isMarketOpen', isMarketOpen);

    const stockPositionQty = parseFloat(stockPosition.qty);
    const qty =
      entryPosition && !singleAlert
        ? Math.min(stockPositionQty, entryPosition.data().quantity)
        : stockPositionQty;

    let quote: { bid: number; ask: number };
    try {
      quote = await getQuote(alert.symbol, this.alpacaClient);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting quote for symbol:', alert.symbol, error);

      if (!isMarketOpen) {
        // queue up this sell order
        this.addToQueue(alert, discriminator, qty);
        return {
          ok: true,
          addedToQueue: true,
        };
      }
    }

    console.log('entryPosition', entryPosition?.data());
    console.log('fromDiscriminator', fromDiscriminator);
    console.log('singleAlert', singleAlert);
    console.log('stockPosition', stockPosition);
    console.log('quote', quote);

    if (!fromDiscriminator) {
      console.log(
        'Could not find entry position from this discriminator, still continuing',
        alert,
        discriminator
      );

      if (entryPosition) {
        console.log(colors.fg.Yellow, 'A alert from another user exists, not selling');
        return {
          ok: false,
          addedToQueue: false,
          reason: 'A alert from another user exists, not selling',
        };
      }

      if (parseFloat(stockPosition.unrealized_pl) < 0) {
        console.log(colors.fg.Yellow, 'Position is not green, not selling');
        return {
          ok: false,
          addedToQueue: false,
          reason: 'User does not own entry and position is not green',
        };
      }
    }

    if (!isMarketOpen && !isExtendedHours) {
      // queue up this sell order
      this.addToQueue(alert, discriminator, qty);
      return {
        ok: true,
        addedToQueue: true,
      };
    }

    await this.removeFromQueue(alert, discriminator);

    discriminator = (entryPosition && entryPosition.data().discriminator) || discriminator;
    const isFullPosition = qty === stockPositionQty;

    // Cancel existing orders
    try {
      await Promise.all([
        this.cancelOrders(orders, alert.symbol, discriminator, !isFullPosition && qty),
      ]);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR cancelling orders', error);
      // queue up this sell order
      this.addToQueue(alert, discriminator, qty);
      return {
        ok: false,
        addedToQueue: true,
        reason: 'Error cancelling orders',
      };
    }

    const executeSellOrder = async () => {
      if (isMarketOpen) {
        await this.alpacaClient.createOrder({
          symbol: alert.symbol,
          qty: qty,
          side: 'sell',
          type: 'market',
          time_in_force: 'day',
        });
      } else {
        await this.alpacaClient.createOrder({
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
      this.removeFromQueue(alert, discriminator);
      console.log('Created order to close position', alert, discriminator);
    };

    // Create sell order
    try {
      await executeSellOrder();
      return {
        ok: true,
      };
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR creating order to close position', error);

      if (error && error.includes('insufficient qty available for order')) {
        await sleep(3000);
        console.log('Trying sell order again now after 3s', alert, discriminator);
        try {
          await executeSellOrder();
          return {
            ok: true,
          };
        } catch (err) {
          const error2 = err?.error?.message || err?.message || err;
          console.log(colors.fg.Red, 'ERROR! creating order to close position on 2nd try', error2);
          this.addToQueue(alert, discriminator, qty);
          return {
            ok: false,
            addedToQueue: true,
            reason: 'Error creating order to close position on 2nd try',
          };
        }
      } else {
        this.addToQueue(alert, discriminator, qty);
        return {
          ok: false,
          addedToQueue: true,
          reason: 'Error creating order to close position',
        };
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
          singleAlert: snapshot.size === 1,
        };
      }
    }
    return {
      doc: snapshot.size > 0 ? (snapshot.docs[0] as ReturnType) : null,
      snapshot: snapshot as FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
      fromDiscriminator: false,
      singleAlert: snapshot.size === 1,
    };
  }

  async findStockPosition(symbol: string): Promise<StockPosition> {
    try {
      return await this.alpacaClient.getPosition(symbol);
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
      const foundOrder = orders.find(
        (order) => order.symbol === symbol && parseFloat(order.qty) === qty
      );
      if (foundOrder) {
        console.log('cancelling order', foundOrder.id);
        await this.alpacaClient.cancelOrder(foundOrder.id);
      }
    } else {
      await Promise.all(
        orders.map((order) => {
          if (order.symbol === symbol) {
            console.log('cancelling order', order.id);
            return this.alpacaClient.cancelOrder(order.id);
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
      strategy: '1',
    });
  }

  async removeFromQueue(alert: Alert, discriminator: string) {
    const doc = db.doc(`queue/${alert.action}-${discriminator}-${alert.symbol}`);
    const data = await doc.get();
    if (data.exists) {
      console.log(colors.fg.Magenta, 'Removing order from queue', alert, discriminator);
      doc.delete();
    }
  }
}

export const secondaryTradingStrategy = new SecondaryTradingStrategy();
