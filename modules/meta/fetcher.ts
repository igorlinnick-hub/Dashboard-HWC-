import type { MetaData } from './types';

/** Fetch ad insights from Meta Marketing API */
export async function fetchData(): Promise<MetaData> {
  // TODO: read META_ACCESS_TOKEN and META_APP_ID from process.env
  // TODO: call Meta Marketing API /act_{ad_account_id}/insights
  // Returns mock data for now
  return {
    adSpend: 3200,
    impressions: 45000,
    clicks: 1080,
    ctr: 2.4,
    cpc: 2.96,
    conversions: 32,
    costPerConversion: 100,
    campaigns: [],
  };
}
