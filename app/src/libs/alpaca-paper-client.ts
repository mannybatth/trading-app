import Alpaca from '@alpacahq/alpaca-trade-api';
import { BehaviorSubject } from 'rxjs';
import { alpacaApiKey, alpacaApiSecret } from '../constants';
import type { OrderUpdateMessage } from '../models/alpaca-models';
import { colors } from '../models/colors';

export const alpacaPaper = new Alpaca({
  keyId: alpacaApiKey,
  secretKey: alpacaApiSecret,
  paper: true,
  usePolygon: false,
});

class AlpacaPaperSocket {
  public onOrderUpdate = new BehaviorSubject<OrderUpdateMessage>(null);

  constructor(public websocket: any) {
    websocket.onConnect(function () {
      console.log('Connected to alpaca socket');
      const trade_keys = ['trade_updates'];
      websocket.subscribe(trade_keys);
    });
    websocket.onDisconnect(() => {
      console.log(colors.fg.Red, 'Disconnected from websocket');
    });
    websocket.onStateChange((newState: string) => {
      console.log(`State changed to ${newState}`);
    });
    websocket.onOrderUpdate(async (message: OrderUpdateMessage) => {
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
      this.onOrderUpdate.next(message);
    });
    websocket.connect();
  }
}

export const alpacaPaperSocket = new AlpacaPaperSocket(alpacaPaper.trade_ws);
