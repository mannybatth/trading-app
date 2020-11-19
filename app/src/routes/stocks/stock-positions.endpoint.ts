import send from '@polka/send-type';
import { alpaca } from '../../libs/alpaca';
import type { StockPosition } from '../../models/alpaca-models';

export async function get(req, res, next) {
  try {
    const positions: StockPosition[] = await alpaca.client.getPositions();
    send(res, 200, positions);
  } catch (err) {
    send(res, 400, err);
  }
}
