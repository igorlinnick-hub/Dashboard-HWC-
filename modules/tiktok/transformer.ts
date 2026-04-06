import type { TikTokData } from './types';

/** Normalize raw TikTok API response into our TikTokData shape */
export function transformData(raw: unknown): TikTokData {
  // TODO: parse and normalize raw TikTok API response
  return raw as TikTokData;
}
