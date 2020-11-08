export interface ETradeRequestOptions {
  oauthCallback?: boolean;
  oauthToken?: string;
  oauthTokenSecret?: string;
  verifyCode?: string;
  useJSON?: boolean;
}

export interface ETradeOAuthToken {
  oauth_token: string;
  oauth_token_secret: string;
}

export interface ETradeAccessToken {
  oauth_token: string;
  oauth_token_secret: string;
}

export interface ETradeAccount {
  accountId: string;
  accountIdKey: string;
  accountMode: string;
  accountDesc: string;
  accountName: string;
  accountType: string;
  institutionType: string;
  accountStatus: string;
}
