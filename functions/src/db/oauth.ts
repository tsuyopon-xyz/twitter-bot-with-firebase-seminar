import { Firestore, WriteResult } from 'firebase-admin/firestore';
import {
  DocTypeForCodeVerifierAndState,
  DocTypeForRefreshToken,
} from '../types/index';

export class OAuthCollection {
  private readonly collectionName = 'oauth';
  private readonly docIdMap = {
    codeVerifierAndState: 'codeVerifierAndState',
    refreshToken: 'refreshToken',
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
    data: DocTypeForRefreshToken
  ): Promise<WriteResult> {
    const path = `${this.collectionName}/${this.docIdMap.refreshToken}`;
    const result = await this.db.doc(path).set(data);

    return result;
  }

  async getAccessTokenAndRefreshToken(): Promise<DocTypeForRefreshToken> {
    const path = `${this.collectionName}/${this.docIdMap.refreshToken}`;
    const snapshot = await this.db.doc(path).get();
    const data = snapshot.data() as DocTypeForRefreshToken;

    return data;
  }
}
