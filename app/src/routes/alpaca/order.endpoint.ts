import send from '@polka/send-type';
import { alpaca } from '../../libs/alpaca';

export async function del(req, res, next) {
  try {
    const orderId = req.query.orderId;
    const response = await alpaca.client.cancelOrder(orderId);
    send(res, 200, response);
  } catch (err) {
    send(res, 400, err);
  }
}
