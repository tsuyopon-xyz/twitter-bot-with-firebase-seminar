import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { TwitterApi } from 'twitter-api-v2';
import { OAuthCollection } from './db/oauth';
import { getConfig } from './utils';

initializeApp();
const db = getFirestore();
const oauthCollection = new OAuthCollection(db);

export const twitterAuthRedirect = functions.https.onRequest(
  async (_, response): Promise<void> => {
    const { twitter } = getConfig();
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
    await oauthCollection.setCodeVerifierAndState({
      codeVerifier,
      state,
    });

    response.redirect(url);
  }
);

export const twitterAuthCallback = functions.https.onRequest(
  async (request, response): Promise<void> => {
    const { state, code } = request.query as { state: string; code: string };
    const { codeVerifier, state: stateInFirestore } =
      await oauthCollection.getCodeVerifierAndState();

    if (!codeVerifier || !state || !stateInFirestore || !code) {
      response.status(400).send('You denied the app.');
      return;
    }
    if (state !== stateInFirestore) {
      response.status(400).send('Stored tokens didnt match!');
      return;
    }

    // Obtain access token
    const { twitter } = getConfig();
    const { clientId, clientSecret, callbackUrl } = twitter;
    const client = new TwitterApi({ clientId, clientSecret });

    try {
      const { accessToken, refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackUrl,
      });

      await oauthCollection.setAccessTokenAndRefreshToken({
        accessToken,
        refreshToken: refreshToken as string,
      });

      response.send('OK');
    } catch (error) {
      response.status(403).send('Invalid verifier or access tokens!');
    }
  }
);
