import * as functions from 'firebase-functions';
import { Config } from '../types/index';

export const getConfig = (): Config => {
  return functions.config() as Config;
};
