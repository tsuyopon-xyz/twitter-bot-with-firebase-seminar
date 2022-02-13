import { Firestore } from 'firebase-admin/firestore';
import { DocTypeForTweetsData } from '../types/index';

export class TweetsCollection {
  private readonly collectionName = 'tweets';
  private readonly docId = 'data';

  constructor(private readonly db: Firestore) {}

  async getTexts(): Promise<string[]> {
    const path = `${this.collectionName}/${this.docId}`;
    const snapshot = await this.db.doc(path).get();
    const data = snapshot.data() as DocTypeForTweetsData;

    return data.texts.map((text) => text.replace(/\\n/g, '\n'));
  }

  async getRandomText(): Promise<string> {
    const texts = await this.getTexts();
    const randomIndex = Math.floor(Math.random() * texts.length);

    return texts[randomIndex];
  }
}
