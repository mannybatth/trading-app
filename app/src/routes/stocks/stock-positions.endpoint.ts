import send from '@polka/send-type';
import { alpacaPaper } from '../../libs/alpaca-paper-client';
import type { StockPosition } from '../../models/alpaca-models';

export async function get(req, res, next) {
  try {
    const positions: StockPosition[] = await alpacaPaper.getPositions();
    send(res, 200, positions);
  } catch (err) {
    send(res, 400, err);
  }
}
