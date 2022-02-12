import { Firestore, WriteResult } from 'firebase-admin/firestore';
import {
  DocTypeForCodeVerifierAndState,
  DocTypeForAccessTokenAndRefreshToken,
} from '../types/index';

export class OAuthCollection {
  private readonly collectionName = 'oauth';
  private readonly docIdMap = {
    codeVerifierAndState: 'codeVerifierAndState',
    accessTokenAndRefreshToken: 'accessTokenAndRefreshToken',
  };

  constructor(private readonly db: Firestore) {}

  async setCodeVerifierAndState(
    data: DocTypeForCodeVerifierAndState
  ): Promise<WriteResult> {
    const path = `${this.collectionName}/${this.docIdMap.codeVerifierAndState}`;
    const result = await this.db.doc(path).set(data);

    return result;
  }

  async getCodeVerifierAndState(): Promise<DocTypeForCodeVerifierAndState> {
    const path = `${this.collectionName}/${this.docIdMap.codeVerifierAndState}`;
    const snapshot = await this.db.doc(path).get();
    const data = snapshot.data() as DocTypeForCodeVerifierAndState;

    return data;
  }

  async setAccessTokenAndRefreshToken(
    data: DocTypeForAccessTokenAndRefreshToken
  ): Promise<WriteResult> {
    const path = `${this.collectionName}/${this.docIdMap.accessTokenAndRefreshToken}`;
    const result = await this.db.doc(path).set(data);

    return result;
  }

  async getAccessTokenAndRefreshToken(): Promise<DocTypeForAccessTokenAndRefreshToken> {
    const path = `${this.collectionName}/${this.docIdMap.accessTokenAndRefreshToken}`;
    const snapshot = await this.db.doc(path).get();
    const data = snapshot.data() as DocTypeForAccessTokenAndRefreshToken;

    return data;
  }
}
