import send from '@polka/send-type';
import { etradeApiUrl } from '../../constants';
import { db } from '../../firebase-admin';
import { sendRequest } from '../../libs/etrade-request';
import type { ETradeOAuthToken } from '../../models/etrade-models';

export const doRefreshToken = async (oauthToken?: string, oauthTokenSecret?: string) => {
  if (!oauthToken || !oauthTokenSecret) {
    const tokenDoc = await db.doc('app-config/etrade-tokens').get();
    const tokenData = tokenDoc.data();
    oauthToken = tokenData.oauth_token;
    oauthTokenSecret = tokenData.oauth_token_secret;
  }

  const url = `${etradeApiUrl}/oauth/renew_access_token`;
  const response: ETradeOAuthToken = await sendRequest(
    url,
    {
      method: 'GET',
    },
    { oauthToken, oauthTokenSecret, useJSON: false }
  );

  console.log('refresh token', response);
  // db.doc('app-config/etrade-tokens').update({
  //   ...response,
  //   token_created: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  //   token_last_used: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  // });

  return response;
};

export async function get(req, res, next) {
  try {
    const response = await doRefreshToken();
    send(res, 200, { response });
  } catch (err) {
    send(res, err.status, err);
  }
}
