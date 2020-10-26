import Alpaca from '@alpacahq/alpaca-trade-api';
import { db, firebaseAdmin } from '../firebase-admin';
import type {
  Clock,
  Order,
  Quote,
  StockPosition,
  TradeUpdateMessage,
} from '../models/alpaca-models';
import type { Alert, EntryPositionDoc } from '../models/models';

const calcProfitLoss = (price: number) => {
  return {
    profit: price * (1 + 0.15),
    loss: price * (1 - 0.1),
  };
};

const calcQuantity = (price: number) => {
  if (price >= 500) {
    return 1;
  }

  return Math.floor(500 / price);
};

export class AlpacaClient {
  public client: Alpaca;

  init() {
    this.client = new Alpaca({
      keyId: 'PKL7QOHWIBC4LISNDKKQ',
      secretKey: 'N013k8VuH1ZthxjraYwchFNnOsQdz5EWbdgNltx2',
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
    socket.onStateChange((newState) => {
      console.log(`State changed to ${newState}`);
    });
    socket.onOrderUpdate((message: TradeUpdateMessage) => {
      console.log(`Order updates: ${JSON.stringify(message)}`);
      const qty = parseFloat(message.order.qty);

      if (message.event === 'fill' && qty > 0) {
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
    });
    socket.connect();
  }

  sendOrder(alert: Alert, discriminator: string) {
    return alert.action === 'STC' || alert.action === 'STO'
      ? this.sellOrder(alert, discriminator)
      : this.buyOrder(alert, discriminator);
  }

  async buyOrder(alert: Alert, discriminator: string) {
    if (alert.risky) {
      return;
    }

    const clock: Clock = await this.client.getClock();
    if (!clock.is_open) {
      console.log('Market is not open');
      return;
    }

    let quote: Quote;
    try {
      quote = await this.client.lastQuote(alert.symbol);
    } catch (err) {
      console.log('Failed to get quote', alert.symbol);
      return;
    }

    const bid = quote.last.bidprice;
    const ask = quote.last.askprice;
    const spread = ask - bid;
    const validPrice =
      alert.price < ask + spread * 2 && alert.price > bid - spread * 2;

    if (!validPrice) {
      console.log(
        'Price is not valid',
        alert.price,
        alert.symbol,
        'bid:',
        bid,
        'ask:',
        ask
      );
      return false;
    }
    console.log('quote', quote);

    const calc = calcProfitLoss(alert.price);
    const quantity = calcQuantity(alert.price);
    try {
      console.log(
        'Creating buy order',
        alert.symbol,
        'limit price:',
        calc.profit,
        'stop limit',
        calc.loss - spread
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
          limit_price: calc.loss - spread,
        },
        client_order_id: `${discriminator}-${
          alert.symbol
        }-${new Date().getTime()}`,
      });
    } catch (err) {
      console.log('ERROR creating order:', (err && err.error) || err);
    }
  }

  async sellOrder(alert: Alert, discriminator: string) {
    let entryPosition: FirebaseFirestore.QueryDocumentSnapshot<EntryPositionDoc>,
      stockPositions: StockPosition[],
      quote: Quote,
      orders: Order[];
    try {
      [entryPosition, stockPositions, quote, orders] = await Promise.all([
        this.findEntryPosition(alert.symbol, discriminator),
        this.client.getPositions(),
        this.client.lastQuote(alert.symbol),
        this.client.getOrders(),
      ]);
    } catch (err) {
      console.log('ERROR getting data for sell order', err);
      return;
    }

    const stockPosition = stockPositions.find((pos) => {
      return pos.symbol === alert.symbol;
    });

    console.log('stockPosition', stockPosition);
    console.log('quote', quote);
    // console.log('orders', orders);

    if (!entryPosition) {
      console.log('Could not find entry position in db', alert, discriminator);
      return;
    }

    if (!stockPosition) {
      console.log(
        'Did not find stock position, deleting position from firebase, ',
        alert,
        discriminator
      );
      entryPosition.ref.delete();
      return;
    }

    const clock = await this.client.getClock();
    const stockPositionQty = parseFloat(stockPosition.qty);
    const qty = entryPosition
      ? entryPosition.data().quantity
      : stockPositionQty;
    const isFullPosition = qty === stockPositionQty;

    // Cancel existing orders
    isFullPosition
      ? await this.cancelOrders(orders, alert.symbol)
      : await this.cancelOrders(orders, alert.symbol, qty);

    // Create sell order
    try {
      if (clock.is_open) {
        await this.client.createOrder({
          symbol: alert.symbol,
          qty: qty,
          side: 'sell',
          type: 'market',
          time_in_force: 'day',
          extended_hours: true,
        });
      } else {
        await this.client.createOrder({
          symbol: alert.symbol,
          qty: qty,
          side: 'sell',
          type: 'limit',
          limit_price: quote.last.bidprice,
          time_in_force: 'day',
          extended_hours: true,
        });
      }

      entryPosition.ref.delete();
      console.log('Created order to close position', alert, discriminator);
    } catch (err) {
      console.log(
        'ERROR creating order to close position',
        (err && err.error) || err
      );
    }
  }

  async findEntryPosition(symbol: string, discriminator: string) {
    // console.log('findDbPosition', symbol, discriminator);
    const snapshot = await db
      .collection('positions')
      .where('symbol', '==', symbol)
      .where('discriminator', '==', discriminator)
      .get();
    return snapshot.size > 0
      ? (snapshot.docs[0] as FirebaseFirestore.QueryDocumentSnapshot<
          EntryPositionDoc
        >)
      : null;
  }

  /*
    Could we return the id here so we can replace the order instead?
  */
  async cancelOrders(orders: Order[], symbol: string, qty?: number) {
    if (qty) {
      const foundOrder = orders.find(
        (order) => order.symbol === symbol && parseFloat(order.qty) === qty
      );
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
