import { extendedHours } from '../constants';
import { db, firebaseAdmin } from '../firebase-admin';
import { alpacaPaper } from '../libs/alpaca-paper-client';
import { getQuote } from '../libs/quote';
import { isInRange, sleep } from '../libs/utils';
import type { Clock, CreateOrderResponse, Order, StockPosition } from '../models/alpaca-models';
import { colors } from '../models/colors';
import type { Alert } from '../models/models';

const maxPositionSize = 2000;

const calcQuantity = (price: number) => {
  const max = maxPositionSize;
  if (price >= max) {
    return 1;
  }

  return Math.floor(max / price);
};

export class SimpleTradingStrategy {
  private alpacaClient = alpacaPaper;

  async sendOrder(alert: Alert, discriminator: string): Promise<CreateOrderResponse> {
    const result =
      alert.action === 'STC' || alert.action === 'STO'
        ? await this.sellOrder(alert, discriminator)
        : await this.buyOrder(alert);

    return result;
  }

  async buyOrder(alert: Alert): Promise<CreateOrderResponse> {
    let quote: { bid: number; ask: number; mark?: number };
    let clock: Clock;
    try {
      [quote, clock] = await Promise.all([
        getQuote(alert.symbol, this.alpacaClient),
        this.alpacaClient.getClock(),
      ]);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting quote for symbol:', alert.symbol, error);
    }

    const quantity = calcQuantity(quote.mark || quote.ask);

    try {
      console.log('Creating buy order', alert.symbol);

      if (clock.is_open) {
        await this.alpacaClient.createOrder({
          symbol: alert.symbol,
          qty: quantity,
          side: 'buy',
          type: 'market',
          time_in_force: 'day',
        });
      } else {
        await this.alpacaClient.createOrder({
          symbol: alert.symbol,
          qty: quantity,
          side: 'buy',
          type: 'limit',
          limit_price: quote.mark || quote.ask,
          time_in_force: 'day',
          extended_hours: true,
        });
      }

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
    this.cancelOrders(alert.symbol);

    let stockPosition: StockPosition;
    try {
      stockPosition = await this.findStockPosition(alert.symbol);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting data for sell order', error);
      return {
        ok: false,
        reason: 'Error getting data for sell order',
      };
    }

    if (!stockPosition) {
      console.log('Did not find stock position', alert);
      return {
        ok: false,
        reason: 'Did not find stock position to sell',
      };
    }

    let qty = parseFloat(stockPosition.qty);
    qty = alert.partial ? Math.floor(qty / 2) : qty;

    const date = new Date();
    const isExtendedHours = isInRange(date, extendedHours[0]) || isInRange(date, extendedHours[1]);

    let quote: { bid: number; ask: number; mark?: number };
    let clock: Clock;
    try {
      [quote, clock] = await Promise.all([
        getQuote(alert.symbol, this.alpacaClient),
        this.alpacaClient.getClock(),
      ]);
    } catch (err) {
      const error = err?.error?.message || err?.message || err;
      console.log(colors.fg.Red, 'ERROR getting quote for symbol:', alert.symbol, error);

      // queue up this sell order
      this.addToQueue(alert, discriminator, qty);
      return {
        ok: true,
        addedToQueue: true,
      };
    }

    console.log('isExtendedHours', isExtendedHours);
    console.log('isMarketOpen', clock.is_open);
    console.log('stockPosition', stockPosition);
    console.log('quote', quote);

    if (!clock.is_open && !isExtendedHours) {
      // queue up this sell order
      this.addToQueue(alert, discriminator, qty);
      return {
        ok: true,
        addedToQueue: true,
      };
    }

    await this.removeFromQueue(alert, discriminator);

    const executeSellOrder = async () => {
      if (clock.is_open) {
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
          extended_hours: true,
        });
      }

      this.removeFromQueue(alert, discriminator);
      console.log('Created order to close position', alert);
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
        console.log('Trying sell order again now after 3s', alert);
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

  async cancelOrders(symbol: string) {
    const orders: Order[] = await this.alpacaClient.getOrders({ limit: 500 });
    await Promise.all(
      orders.map((order) => {
        if (order.symbol === symbol) {
          console.log('cancelling order', order.id);
          return this.alpacaClient.cancelOrder(order.id);
        }
      })
    );
  }

  async findStockPosition(symbol: string): Promise<StockPosition> {
    try {
      return await this.alpacaClient.getPosition(symbol);
    } catch (err) {
      return Promise.resolve(null);
    }
  }

  addToQueue(alert: Alert, discriminator: string, quantity: number) {
    console.log(colors.fg.Magenta, 'Queuing up order', alert, discriminator);
    db.doc(`queue/${alert.action}-${discriminator}-${alert.symbol}`).set({
      ...alert,
      discriminator,
      quantity,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      strategy: '0',
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

export const simpleTradingStrategy = new SimpleTradingStrategy();
