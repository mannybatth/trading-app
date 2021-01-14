import send from '@polka/send-type';
import { alpacaPaper } from '../../libs/alpaca-paper-client';

export async function get(req, res, next) {
  try {
    const account = await alpacaPaper.getAccount();
    send(res, 200, account);
  } catch (err) {
    send(res, 400, err);
  }
}
