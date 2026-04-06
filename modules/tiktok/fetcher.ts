import type { TikTokData } from './types';

/** Fetch ad reports from TikTok Marketing API */
export async function fetchData(): Promise<TikTokData> {
  // TODO: read TIKTOK_APP_ID and TIKTOK_APP_SECRET from process.env
  // TODO: call TikTok Marketing API /report/integrated/get
  // Returns mock data for now
  return {
    adSpend: 1800,
    videoViews: 120000,
    impressions: 95000,
    clicks: 2400,
    ctr: 2.5,
    conversions: 45,
    costPerConversion: 40,
    campaigns: [],
  };
}
