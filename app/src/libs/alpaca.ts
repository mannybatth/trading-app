import Alpaca from '@alpacahq/alpaca-trade-api';
import { alpacaApiKey, alpacaApiSecret, maxPositionSize, profitPercent, stopLossPercent } from '../constants';
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

export class AlpacaClient {
  public client: Alpaca;

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
    socket.onOrderUpdate((message: OrderUpdateMessage) => {
      console.log(
        colors.fg.Cyan,
        `Order updates: ${JSON.stringify({
          event: message.event,
          side: message.order.side,
          symbol: message.order.symbol,
          filled_qty: message.order.filled_qty,
          order_qty: message.order.qty,
          order_type: message.order.order_type,
          limit_price: message.order.limit_price,
          client_order_id: message.order.client_order_id,
        })}`
      );
      if (message.event === 'fill') {
        const qty = parseFloat(message.order.filled_qty);

        if (qty > 0 && message.order.side === 'buy') {
          const clientId: string = message.order.client_order_id;
          const [discriminator, symbol] = clientId.split('-');

          db.collection('positions').add({
            discriminator,
            symbol,
            quantity: qty,
            price: parseFloat(message.price),
            created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
    });
    socket.connect();
  }

  sendOrder(alert: Alert, discriminator: string) {
    return alert.action === 'STC' || alert.action === 'STO' ? this.sellOrder(alert, discriminator) : this.buyOrder(alert, discriminator);
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

    const validInfo = await isValidPrice(alert.symbol, alert.price, this.client);
    if (!validInfo.valid) {
      console.log(colors.fg.Red, 'Price is not valid', alert.price, alert.symbol, 'bid:', validInfo.bid, 'ask:', validInfo.ask);
      return;
    }

    const calc = calcProfitLoss(alert.price);
    const quantity = calcQuantity(alert.price);
    try {
      console.log(
        'Creating buy order',
        alert.symbol,
        'limit:',
        alert.price,
        'profit:',
        calc.profit,
        'stop limit:',
        calc.loss - validInfo.spread
      );
      await this.client.createOrder({
        symbol: alert.symbol,
        qty: quantity,
        side: 'buy',
        type: 'limit',
        limit_price: alert.price,
        time_in_force: 'gtc',
        order_class: 'bracket',
        take_profit: {
          limit_price: calc.profit,
        },
        stop_loss: {
          stop_price: calc.loss,
          limit_price: calc.loss - validInfo.spread,
        },
        client_order_id: `${discriminator}-${alert.symbol}-${new Date().getTime()}`,
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
      this.cancelOrders(orders, alert.symbol);
      entryPositionSnapshot.docs.forEach((doc) => doc.ref.delete());
      return;
    }

    console.log('entryPosition', entryPosition.data());
    console.log('stockPosition', stockPosition);
    console.log('quote', quote);

    if (!entryPosition) {
      console.log('Could not find entry position in db', alert, discriminator);
    }

    const clock = await this.client.getClock();
    const stockPositionQty = parseFloat(stockPosition.qty);
    const qty = entryPosition ? entryPosition.data().quantity : stockPositionQty;
    const isFullPosition = qty === stockPositionQty;

    // Cancel existing orders
    await this.cancelOrders(orders, alert.symbol, !isFullPosition && qty);

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
          extended_hours: true,
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

      if (error && error.message && error.message.includes('insufficient qty available for order')) {
        setTimeout(async () => {
          console.log('Trying sell order again now after 3s', alert, discriminator);
          try {
            await executeSellOrder();
          } catch (err) {
            const error2 = err?.error?.message || err?.message || err;
            console.log(colors.fg.Red, 'ERROR! creating order to close position on 2nd try', error2);
          }
        }, 3000);
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
        };
      }
    }
    return {
      doc: snapshot.size > 0 ? (snapshot.docs[0] as ReturnType) : null,
      snapshot: snapshot as FirebaseFirestore.QuerySnapshot<EntryPositionDoc>,
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
  async cancelOrders(orders: Order[], symbol: string, qty?: number) {
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
}

export const alpaca = new AlpacaClient();
