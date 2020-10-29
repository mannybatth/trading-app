import 'isomorphic-fetch';
import { ameritradeAuthUrl, ameritradeClientId, ameritradeTokenUrl, API_URL } from '../../constants';

export interface OAuthConfig {
  callbackUrl: string;
}

export interface TokenResponse {
  access_token: string;
  scope: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
}

const searchParams = (params) => {
  return Object.keys(params)
    .map((key) => {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
};

export class ClientOAuth {
  public config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  public startOAuth() {
    const url = this.buildAuthUrl();
    window.location.replace(url);
  }

  public buildAuthUrl() {
    return `${ameritradeAuthUrl}?response_type=code&redirect_uri=${encodeURIComponent(
      this.config.callbackUrl
    )}&client_id=${encodeURIComponent(ameritradeClientId)}%40AMER.OAUTHAP`;
  }

  public async getTokens(code: string): Promise<TokenResponse> {
    const response = await fetch(ameritradeTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
      body: searchParams({
        grant_type: 'authorization_code',
        access_type: 'offline',
        code,
        client_id: ameritradeClientId,
        redirect_uri: this.config.callbackUrl,
      }),
    });
    return await response.json();
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(ameritradeTokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
      body: searchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: ameritradeClientId,
      }),
    });
    return await response.json();
  }
}

export const clientOAuth = new ClientOAuth({
  callbackUrl: `${API_URL}/td/callback.endpoint`,
});
