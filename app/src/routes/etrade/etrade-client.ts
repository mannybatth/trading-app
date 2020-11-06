import 'isomorphic-fetch';
import { API_URL, etradeApiUrl } from '../../constants';
import type { ETradeOAuthToken, ETradeRequestOptions } from '../../models/etrade-models';

export class ETradeClient {
  public async getOAuthToken() {
    const url = `${etradeApiUrl}/oauth/request_token`;
    const response = await this._send(
      url,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      { oauthCallback: true, useJSON: false }
    );
    return response as ETradeOAuthToken;
  }

  public async getAccessToken(oauthToken: string, oauthTokenSecret: string, verifyCode: string) {
    const url = `${etradeApiUrl}/oauth/access_token`;
    const response = await this._send(
      url,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      },
      { oauthToken, oauthTokenSecret, verifyCode, useJSON: false }
    );
    return response as ETradeOAuthToken;
  }

  private async _send(url: string, request: RequestInit, options: ETradeRequestOptions) {
    const proxyUrl = `${API_URL}/etrade/proxy.endpoint`;
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        url,
        request,
        options,
      }),
    });
    return await response.json();
  }
}

export const eTradeClient = new ETradeClient();
