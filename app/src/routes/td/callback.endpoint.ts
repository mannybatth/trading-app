import send from '@polka/send-type';
import { clientOAuth } from './client-oauth2';

export async function get(req, res, next) {
  const code = req.query?.code;
  const response = await clientOAuth.getTokens(code);
  send(res, 200, { response, code });
}
