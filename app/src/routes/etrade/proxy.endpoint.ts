import send from '@polka/send-type';
import { db, firebaseAdmin } from '../../firebase-admin';
import { sendRequest } from '../../libs/etrade-request';
import { doRefreshToken } from './refresh-token.endpoint';

export async function post(req, res, next) {
  const tokenDoc = await db.doc('app-config/etrade-tokens').get();
  const tokenData = tokenDoc.data();

  if (
    !req.body?.options?.oauthCallback &&
    (!req.body?.options?.oauthToken || !req.body?.options?.oauthTokenSecret)
  ) {
    req.body.options.oauthToken = tokenData.oauth_token;
    req.body.options.oauthTokenSecret = tokenData.oauth_token_secret;
  }

  if (req.body?.options?.useJSON) {
    const lastUsed: number = tokenData.token_last_used.seconds;
    const secondsNow = new Date().getTime() / 1000;
    const diff = secondsNow - lastUsed;

    // 2hr - 100 secs
    if (diff > 7100) {
      await doRefreshToken(tokenData.oauth_token, tokenData.oauth_token_secret);
    }
  }

  try {
    const response = await sendRequest(req.body?.url, req.body?.request, req.body?.options);

    if (req.body.url.includes('oauth/access_token')) {
      db.doc('app-config/etrade-tokens').set({
        ...response,
        token_created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        token_last_used: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    }

    if (req.body?.options?.useJSON) {
      db.doc('app-config/etrade-tokens').update({
        token_last_used: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });
    }
    send(res, 200, response);
  } catch (err) {
    send(res, err.status, err);
  }
}
