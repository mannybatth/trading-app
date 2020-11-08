import 'isomorphic-fetch';
import { API_URL, etradeApiUrl, etradeSandboxUrl } from '../../constants';
import type { ETradeOAuthToken, ETradeRequestOptions } from '../../models/etrade-models';

export class ETradeClient {
  public async getOAuthToken() {
    const url = `${etradeApiUrl}/oauth/request_token`;
    const response = await this._send(
      url,
      {
        method: 'GET',
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
      },
      { oauthToken, oauthTokenSecret, verifyCode, useJSON: false }
    );
    return response as ETradeOAuthToken;
  }

  public async getAccounts() {
    const url = `${etradeSandboxUrl}/v1/accounts/list.json`;
    const response = await this._send(
      url,
      {
        method: 'GET',
      },
      { useJSON: true }
    );
    console.log('getAccounts', response);
    return response;
  }

  public async refreshToken() {
    const response = await fetch(`${API_URL}/etrade/refresh-token.endpoint`, {
      method: 'GET',
    });
    if (response.status !== 200) {
      throw response;
    }
    return response;
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
    if (response.status !== 200) {
      throw response;
    }
    return await response.json();
  }
}

export const eTradeClient = new ETradeClient();
