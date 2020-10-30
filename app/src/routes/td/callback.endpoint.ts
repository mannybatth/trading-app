import redirect from '@polka/redirect';
import { db, firebaseAdmin } from '../../firebase-admin';
import { clientOAuth } from './client-oauth2';

export async function get(req, res, next) {
  const code = req.query?.code;
  const response = await clientOAuth.getTokens(code);

  await db
    .collection('app-config')
    .doc('tokens')
    .set({
      ...response,
      created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      token_created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });

  redirect(res, '/td');
}
