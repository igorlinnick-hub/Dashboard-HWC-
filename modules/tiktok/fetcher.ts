import type { TikTokData, SupermetricsRow } from './types';
import fs from 'fs';
import path from 'path';

export async function testConnection(apiKey: string, advertiserId: string, _clientId: string): Promise<void> {
  const url = new URL('https://api.supermetrics.com/enterprise/v2/query/data/json');
  url.searchParams.set('ds_id', 'TIA');
  url.searchParams.set('ds_accounts', advertiserId);
  url.searchParams.set('metrics', 'spend');
  url.searchParams.set('date_range_type', 'last_7_days');
  url.searchParams.set('api_key', apiKey);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TikTok/Supermetrics auth failed: ${response.status}`);
}

/**
 * Fetch TikTok Ads data via Supermetrics JSON API.
 * Includes a simple CSV fallback if specified or if API fails.
 */
export async function fetchData(
  supermetricsApiKey: string,
  advertiserId: string,
  from: string,
  to: string,
  clientId?: string
): Promise<TikTokData> {
  try {
    // 1. Attempt Supermetrics API
    const url = new URL('https://api.supermetrics.com/enterprise/v2/query/data/json');
    url.searchParams.set('ds_id', 'TIA');
    url.searchParams.set('ds_accounts', advertiserId);
    url.searchParams.set('metrics', 'spend,impressions,clicks,conversions,video_views');
    url.searchParams.set('dimensions', 'date,campaign_name,campaign_id');
    url.searchParams.set('date_range_type', 'fixed');
    url.searchParams.set('start_date', from);
    url.searchParams.set('end_date', to);
    url.searchParams.set('api_key', supermetricsApiKey);

    const response = await fetch(url.toString());

    if (response.ok) {
      const result = await response.json();
      return processSupermetricsData(result.data || []);
    }
  } catch (err) {
    console.error('Supermetrics failed, checking for CSV fallback...', err);
  }

  // 2. CSV Fallback
  // Look for a file in public/data/tiktok/[clientId].csv
  if (clientId) {
    const csvPath = path.join(process.cwd(), 'public', 'data', 'tiktok', `${clientId}.csv`);
    if (fs.existsSync(csvPath)) {
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      return parseTikTokCSV(csvContent, from, to);
    }
  }

  throw new Error('TikTok data unavailable (API failed and no CSV fallback found)');
}

function processSupermetricsData(rows: SupermetricsRow[]): TikTokData {
  let totalSpend = 0;
  let totalViews = 0;
  let totalConversions = 0;
  let totalClicks = 0;
  let totalImpressions = 0;

  const dailyMap = new Map<string, number>();
  const campaignMap = new Map<string, { name: string; spend: number; views: number }>();

  for (const row of rows) {
    const spend = Number(row.spend || 0);
    const views = Number(row.video_views || 0);
    const conversions = Number(row.conversions || 0);
    const clicks = Number(row.clicks || 0);
    const impressions = Number(row.impressions || 0);

    totalSpend += spend;
    totalViews += views;
    totalConversions += conversions;
    totalClicks += clicks;
    totalImpressions += impressions;

    if (row.date) {
      dailyMap.set(row.date, (dailyMap.get(row.date) || 0) + spend);
    }

    if (row.campaign_id) {
      const c = campaignMap.get(row.campaign_id) || { name: row.campaign_name || 'Unnamed', spend: 0, views: 0 };
      campaignMap.set(row.campaign_id, {
        name: c.name,
        spend: c.spend + spend,
        views: c.views + views,
      });
    }
  }

  return {
    totalSpend,
    totalViews,
    totalConversions,
    totalClicks,
    totalImpressions,
    dailySpend: Array.from(dailyMap.entries()).map(([date, spend]) => ({ date, spend })),
    campaigns: Array.from(campaignMap.entries()).map(([id, c]) => ({
      id,
      name: c.name,
      spend: c.spend,
      views: c.views,
      status: 'ACTIVE',
    })),
  };
}

/** Simple CSV parser for TikTok data fallback */
function parseTikTokCSV(content: string, from: string, to: string): TikTokData {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) throw new Error('Invalid CSV: No data rows');

  // Expecting Header: date,campaign_name,spend,views,conversions
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows = lines.slice(1);

  const parsedRows: SupermetricsRow[] = [];
  
  for (const row of rows) {
    const values = row.split(',');
    const item: any = {};
    headers.forEach((h, i) => {
      item[h] = values[i]?.trim();
    });

    // Filter by date range
    if (item.date >= from && item.date <= to) {
      parsedRows.push({
        date: item.date,
        campaign_name: item.campaign_name,
        campaign_id: item.campaign_id || item.campaign_name,
        spend: Number(item.spend || 0),
        video_views: Number(item.views || 0),
        conversions: Number(item.conversions || 0),
      });
    }
  }

  return processSupermetricsData(parsedRows);
}
