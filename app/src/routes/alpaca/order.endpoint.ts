import send from '@polka/send-type';
import { alpacaPaper } from '../../libs/alpaca-paper-client';

export async function del(req, res, next) {
  try {
    const orderId = req.query.orderId;
    const response = await alpacaPaper.cancelOrder(orderId);
    send(res, 200, response);
  } catch (err) {
    send(res, 400, err);
  }
}
