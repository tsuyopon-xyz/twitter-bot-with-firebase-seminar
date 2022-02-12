import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { TwitterApi } from 'twitter-api-v2';

initializeApp();
const db = getFirestore();

type Config = {
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

type DocTypeForCodeVerifierAndState = {
  codeVerifier: string;
  state: string;
};

export const twitterAuthRedirect = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const { twitter } = functions.config() as Config;
    const { clientId, clientSecret, callbackUrl, scope } = twitter;

    const client = new TwitterApi({
      clientId,
      clientSecret,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callbackUrl,
      { scope }
    );

    // ここで保存した値は、twitterAuthCallback関数内で、
    // accessToken, refreshTokenを取得するのに利用する
    await db.doc('oauth/codeVerifierAndState').set({
      codeVerifier,
      state,
    });

    response.redirect(url);
  }
);

export const twitterAuthCallback = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const { state, code } = request.query as { state: string; code: string };
    const snapshotOfCodeVerifierAndState = await db
      .doc('oauth/codeVerifierAndState')
      .get();
    const { codeVerifier, state: stateInFirestore } =
      snapshotOfCodeVerifierAndState.data() as DocTypeForCodeVerifierAndState;

    if (!codeVerifier || !state || !stateInFirestore || !code) {
      response.status(400).send('You denied the app.');
      return;
    }
    if (state !== stateInFirestore) {
      response.status(400).send('Stored tokens didnt match!');
      return;
    }

    // Obtain access token
    const { twitter } = functions.config() as Config;
    const { clientId, clientSecret, callbackUrl } = twitter;
    const client = new TwitterApi({ clientId, clientSecret });

    try {
      const { accessToken, refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackUrl,
      });

      db.doc('oauth/accessTokenAndRefreshToken').set({
        accessToken,
        refreshToken,
      });

      response.send('OK');
    } catch (error) {
      response.status(403).send('Invalid verifier or access tokens!');
    }
  }
);
