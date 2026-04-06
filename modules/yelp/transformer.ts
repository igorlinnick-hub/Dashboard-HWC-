import type { YelpData } from './types';

/** Normalize raw Yelp API response into our YelpData shape */
export function transformData(raw: unknown): YelpData {
  // TODO: parse and normalize raw Yelp API response
  return raw as YelpData;
}
