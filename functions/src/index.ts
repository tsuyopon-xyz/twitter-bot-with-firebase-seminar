import * as functions from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { TwitterApi } from 'twitter-api-v2';
import { OAuthCollection, TweetsCollection } from './db';
import { getConfig } from './utils';

initializeApp();
const db = getFirestore();
const oauthCollection = new OAuthCollection(db);
const tweetsCollection = new TweetsCollection(db);

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
      const { refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackUrl,
      });

      await oauthCollection.setAccessTokenAndRefreshToken({
        refreshToken,
      });

      response.send('OK');
    } catch (error) {
      response.status(403).send('Invalid verifier or access tokens!');
    }
  }
);

export const tweet = functions.https.onRequest(
  async (_, response): Promise<void> => {
    const { twitter } = getConfig();
    const { clientId, clientSecret } = twitter;
    const client = new TwitterApi({ clientId, clientSecret });

    try {
      const { refreshToken } =
        await oauthCollection.getAccessTokenAndRefreshToken();
      if (!refreshToken) {
        throw new Error('No refreshToken found.');
      }

      const { client: refreshedClient, refreshToken: newRefreshToken } =
        await client.refreshOAuth2Token(refreshToken);
      await oauthCollection.setAccessTokenAndRefreshToken({
        refreshToken: newRefreshToken,
      });
      const tweetText = await tweetsCollection.getRandomText();

      const { data: createdTweet } = await refreshedClient.v2.tweet(tweetText);
      response.json(createdTweet);
    } catch (error) {
      console.log('error', error);
      response.status(403).send(JSON.stringify(error));
    }
  }
);
