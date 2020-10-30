import send from '@polka/send-type';
import { db, firebaseAdmin } from '../../firebase-admin';
import { clientOAuth } from './client-oauth2';

export const doRefreshToken = async (refreshToken?: string) => {
  if (!refreshToken) {
    const tokenData = await db.doc('app-config/tokens').get();
    refreshToken = tokenData.data().refresh_token;
  }

  const response = await clientOAuth.refreshToken(refreshToken);

  db.doc('app-config/tokens').update({
    ...response,
    token_created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  });

  return response;
};

export async function get(req, res, next) {
  try {
    const response = await doRefreshToken();
    send(res, 200, { response });
  } catch (err) {
    send(res, 400, { error: err?.error?.message || err?.message || err });
  }
}
