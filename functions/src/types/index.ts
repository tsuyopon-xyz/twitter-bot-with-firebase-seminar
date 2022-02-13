export type Config = {
  twitter: {
    apiKey: string;
    apiKeySecret: string;
    bearerToken: string;
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
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
