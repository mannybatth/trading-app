import send from '@polka/send-type';
import { db, firebaseAdmin } from '../../firebase-admin';
import { sendRequest } from './etrade-request';

export async function post(req, res, next) {
  if (!req.body?.options?.oauthCallback && (!req.body?.options?.oauthToken || !req.body?.options?.oauthTokenSecret)) {
    const tokenDoc = await db.doc('app-config/etrade-tokens').get();
    const tokenData = tokenDoc.data();
    req.body.options.oauthToken = tokenData.oauth_token;
    req.body.options.oauthTokenSecret = tokenData.oauth_token_secret;
  }

  const response = await sendRequest(req.body?.url, req.body?.request, req.body?.options);

  if (req.body.url.includes('oauth/access_token')) {
    db.doc('app-config/etrade-tokens').set({
      ...response,
      token_created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    });
  }
  send(res, 200, response);
}
