import type { MetaData, SupermetricsRow } from './types';

/**
 * Fetch Meta Ads data via Supermetrics JSON API.
 */
export async function fetchData(
  supermetricsApiKey: string,
  adAccountId: string,
  from: string,
  to: string
): Promise<MetaData> {
  const url = new URL('https://api.supermetrics.com/enterprise/v2/query/data/json');
  
  // Supermetrics Query Parameters
  url.searchParams.set('ds_id', 'FA');
  url.searchParams.set('ds_accounts', adAccountId);
  url.searchParams.set('metrics', 'spend,impressions,clicks,conversions');
  url.searchParams.set('dimensions', 'date,campaign_name,campaign_id');
  url.searchParams.set('date_range_type', 'fixed');
  url.searchParams.set('start_date', from);
  url.searchParams.set('end_date', to);
  url.searchParams.set('api_key', supermetricsApiKey);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supermetrics API Error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Supermetrics returns data in a 'data' array of rows
  const rows: SupermetricsRow[] = result.data || [];

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  
  const dailyMap = new Map<string, number>();
  const campaignMap = new Map<string, { name: string; spend: number; impressions: number; clicks: number }>();

  for (const row of rows) {
    const spend = Number(row.spend || 0);
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const conversions = Number(row.conversions || 0);

    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;

    // Daily trend
    const date = row.date;
    if (date) {
      dailyMap.set(date, (dailyMap.get(date) || 0) + spend);
    }

    // Campaign breakdown
    if (row.campaign_id) {
      const c = campaignMap.get(row.campaign_id) || { name: row.campaign_name || 'Unnamed', spend: 0, impressions: 0, clicks: 0 };
      campaignMap.set(row.campaign_id, {
        name: c.name,
        spend: c.spend + spend,
        impressions: c.impressions + impressions,
        clicks: c.clicks + clicks,
      });
    }
  }

  const dailySpend = Array.from(dailyMap.entries())
    .map(([date, spend]) => ({ date, spend }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const campaigns = Array.from(campaignMap.entries()).map(([id, c]) => ({
    id,
    name: c.name,
    spend: c.spend,
    impressions: c.impressions,
    clicks: c.clicks,
    status: 'ACTIVE', // Supermetrics doesn't always return status in a date-range query
  }));

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    dailySpend,
    campaigns,
  };
}
