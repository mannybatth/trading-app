import send from '@polka/send-type';
import { db } from '../../firebase-admin';

export async function get(req, res, next) {
  db.doc('app-config/tokens').delete();
  send(res, 200, {});
}
