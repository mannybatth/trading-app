import crypto from 'crypto';
import 'isomorphic-fetch';
import oauth_sign from 'oauth-sign';
import querystring from 'querystring';
import { etradeApiKey, etradeApiSecret } from '../../constants';
import type { ETradeRequestOptions } from '../../models/etrade-models';

const searchParams = (params: any, separator: string) => {
  return Object.keys(params)
    .map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join(separator);
};

export const sendRequest = async (url: string, request: RequestInit, options: ETradeRequestOptions) => {
  const ts = new Date();
  const qs: any = {
    oauth_nonce: generateNonceFor(ts),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_consumer_key: etradeApiKey,
    oauth_timestamp: Math.floor(ts.getTime() / 1000),
  };
  if (options.oauthCallback) {
    qs.oauth_callback = 'oob';
  }
  if (options.oauthToken) {
    qs.oauth_token = options.oauthToken;
  }
  if (options.verifyCode) {
    qs.oauth_verifier = options.verifyCode;
  }
  if (options.oauthTokenSecret) {
    qs.oauth_signature = oauth_sign.hmacsign(request.method, url, qs, etradeApiSecret, options.oauthTokenSecret);
  } else {
    qs.oauth_signature = oauth_sign.hmacsign(request.method, url, qs, etradeApiSecret);
  }
  request.headers = request.headers || {};
  request.headers['Authorization'] = `OAuth realm="",${searchParams(qs, ',')}`;
  if (options.useJSON) {
    request.headers['Accept'] = 'application/json';
  }
  const response = await fetch(url, request);
  let json: any;
  if (options.useJSON) {
    json = await response.json();
  } else {
    const body = await response.text();
    json = querystring.parse(body);
  }
  return json;
};

const generateNonceFor = (timeStamp: Date) => {
  var msSinceEpoch = timeStamp.getTime();

  var secondsSinceEpoch = Math.floor(msSinceEpoch / 1000.0);
  var msSinceSecond = (msSinceEpoch - secondsSinceEpoch * 1000) / 1000.0;

  var maxRand = 2147483647.0; // This constant comes from PHP, IIRC
  var rand = Math.round(Math.random() * maxRand);

  var microtimeString = '' + msSinceSecond + '00000 ' + secondsSinceEpoch;
  var nonce = microtimeString + rand;

  var md5Hash = crypto.createHash('md5');
  md5Hash.update(nonce);
  return md5Hash.digest('hex');
};
