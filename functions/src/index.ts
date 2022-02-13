/* eslint-disable camelcase */
import * as path from 'path';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { TwitterApi } from 'twitter-api-v2';
import { OAuthCollection, TweetsCollection } from './db';
import { getConfig } from './utils';

const serviceAccountPath = path.resolve(
  __dirname,
  '../service-account-file.json'
);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const oauthCollection = new OAuthCollection(db);
const tweetsCollection = new TweetsCollection(db);

export const twitterAuthRedirect = functions.https.onRequest(
  async (_, response): Promise<void> => {
    // トークンの更新処理を本番でも行ってしまうと、
    // 知らない誰かにトークン情報を上書きされてしまう可能性があるため、
    // 「twitterAuthRedirect」は開発時しか利用できないようにする
    if (process.env.NODE_ENV === 'production') {
      response.status(404).send('Not Found');
      return;
    }

    const { twitter } = getConfig();
    const { client_id, client_secret, callback_url, scope } = twitter;

    const client = new TwitterApi({
      clientId: client_id,
      clientSecret: client_secret,
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      callback_url,
      { scope }
    );

    // ここで保存した値は、twitterAuthCallback関数内で、
    // refreshTokenを取得するのに利用する
    await oauthCollection.setCodeVerifierAndState({
      codeVerifier,
      state,
    });

    response.redirect(url);
  }
);

export const twitterAuthCallback = functions.https.onRequest(
  async (request, response): Promise<void> => {
    // トークンの更新処理を本番でも行ってしまうと、
    // 知らない誰かにトークン情報を上書きされてしまう可能性があるため、
    // 「twitterAuthRedirect」は開発時しか利用できないようにする
    if (process.env.NODE_ENV === 'production') {
      response.status(404).send('Not Found');
      return;
    }

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

    const { twitter } = getConfig();
    const { client_id, client_secret, callback_url } = twitter;
    const client = new TwitterApi({
      clientId: client_id,
      clientSecret: client_secret,
    });

    try {
      const { refreshToken } = await client.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callback_url,
      });

      await oauthCollection.setRefreshToken({
        refreshToken,
      });

      response.send('OK');
    } catch (error) {
      response.status(403).send('Invalid verifier or access tokens!');
    }
  }
);

export const tweet = functions
  .region('asia-northeast1')
  .pubsub.schedule('* * * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    functions.logger.log('Calld tweet!');
    const { twitter } = getConfig();
    const { client_id, client_secret } = twitter;
    const client = new TwitterApi({
      clientId: client_id,
      clientSecret: client_secret,
    });

    try {
      const { refreshToken } = await oauthCollection.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refreshToken found.');
      }

      const { client: refreshedClient, refreshToken: newRefreshToken } =
        await client.refreshOAuth2Token(refreshToken);
      await oauthCollection.setRefreshToken({
        refreshToken: newRefreshToken,
      });
      const tweetText = await tweetsCollection.getRandomText();

      // 短い期間で同じツイートをするとエラーになるため、Date.now() で必ず異なるテキストになるようにしている
      const { data: createdTweet } = await refreshedClient.v2.tweet(
        tweetText + ' ' + Date.now()
      );
      functions.logger.log(createdTweet);
    } catch (error) {
      functions.logger.error(error);
    }
  });
