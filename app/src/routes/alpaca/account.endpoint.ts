import send from '@polka/send-type';
import { alpaca } from '../../libs/alpaca';

export async function get(req, res, next) {
  try {
    const account = await alpaca.client.getAccount();
    send(res, 200, account);
  } catch (err) {
    send(res, 400, err);
  }
}
