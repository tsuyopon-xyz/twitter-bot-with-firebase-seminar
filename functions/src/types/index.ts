/* eslint-disable camelcase */
export type Config = {
  twitter: {
    client_id: string;
    client_secret: string;
    callback_url: string;
    scope: string[];
  };
};

export type DocTypeForCodeVerifierAndState = {
  codeVerifier: string;
  state: string;
};

export type DocTypeForRefreshToken = {
  refreshToken?: string;
};

export type DocTypeForTweetsData = {
  texts: string[];
};
