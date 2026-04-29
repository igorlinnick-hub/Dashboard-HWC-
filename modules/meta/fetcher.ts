import type { MetaData } from './types';

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

interface MetaError {
  error?: { message?: string; type?: string; code?: number; error_subcode?: number };
}

interface InsightsAction {
  action_type: string;
  value: string;
}

interface InsightsRow {
  date_start?: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  actions?: InsightsAction[];
  campaign_id?: string;
  campaign_name?: string;
}

interface InsightsResponse {
  data: InsightsRow[];
  paging?: { cursors?: { before: string; after: string }; next?: string };
}

const CONVERSION_ACTION_TYPES = new Set([
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
  'lead',
  'offsite_conversion.fb_pixel_lead',
  'complete_registration',
  'offsite_conversion.fb_pixel_complete_registration',
]);

function normalizeAccountId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith('act_') ? trimmed : `act_${trimmed}`;
}

function sumConversions(actions: InsightsAction[] | undefined): number {
  if (!actions) return 0;
  let total = 0;
  for (const a of actions) {
    if (CONVERSION_ACTION_TYPES.has(a.action_type)) {
      total += Number(a.value || 0);
    }
  }
  return total;
}

async function graphFetch<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();
  if (!response.ok || (json as MetaError).error) {
    const err = (json as MetaError).error;
    const msg = err?.message ?? `HTTP ${response.status}`;
    const code = err?.code;
    // Surface 401/auth errors so the data route maps them to INVALID_KEY
    if (response.status === 401 || code === 190 || code === 102) {
      throw new Error(`401 unauthorized: ${msg}`);
    }
    if (response.status === 429 || code === 17 || code === 4 || code === 32) {
      throw new Error(`429 rate limit: ${msg}`);
    }
    throw new Error(`Meta Graph API error: ${msg}`);
  }
  return json as T;
}

async function fetchAllPages(initialUrl: string): Promise<InsightsRow[]> {
  const rows: InsightsRow[] = [];
  let nextUrl: string | undefined = initialUrl;
  // Hard cap on pages to avoid runaway pagination on misconfigured accounts
  for (let i = 0; i < 20 && nextUrl; i++) {
    const page: InsightsResponse = await graphFetch<InsightsResponse>(nextUrl);
    rows.push(...page.data);
    nextUrl = page.paging?.next;
  }
  return rows;
}

export async function testConnection(accessToken: string, accountId: string): Promise<void> {
  const acct = normalizeAccountId(accountId);
  const url = new URL(`${GRAPH_API_BASE}/${acct}`);
  url.searchParams.set('fields', 'id,name,account_status');
  url.searchParams.set('access_token', accessToken);
  await graphFetch(url.toString());
}

/**
 * Fetch Meta Ads insights via Graph API.
 * Two queries: account-level daily (for totals + timeseries) and campaign-level (for breakdown).
 */
export async function fetchData(
  accessToken: string,
  accountId: string,
  from: string,
  to: string
): Promise<MetaData> {
  const acct = normalizeAccountId(accountId);
  const timeRange = JSON.stringify({ since: from, until: to });

  // --- Q1: account-level daily breakdown ---
  const dailyUrl = new URL(`${GRAPH_API_BASE}/${acct}/insights`);
  dailyUrl.searchParams.set('level', 'account');
  dailyUrl.searchParams.set('time_increment', '1');
  dailyUrl.searchParams.set('fields', 'spend,impressions,clicks,actions');
  dailyUrl.searchParams.set('time_range', timeRange);
  dailyUrl.searchParams.set('limit', '500');
  dailyUrl.searchParams.set('access_token', accessToken);

  const dailyRows = await fetchAllPages(dailyUrl.toString());

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  const dailySpend: { date: string; spend: number }[] = [];

  for (const row of dailyRows) {
    const spend = Number(row.spend || 0);
    const impressions = Number(row.impressions || 0);
    const clicks = Number(row.clicks || 0);
    const conversions = sumConversions(row.actions);

    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;

    if (row.date_start) {
      dailySpend.push({ date: row.date_start, spend });
    }
  }

  dailySpend.sort((a, b) => a.date.localeCompare(b.date));

  // --- Q2: campaign-level breakdown (no time_increment so we get one row per campaign) ---
  const campaignsUrl = new URL(`${GRAPH_API_BASE}/${acct}/insights`);
  campaignsUrl.searchParams.set('level', 'campaign');
  campaignsUrl.searchParams.set('fields', 'campaign_id,campaign_name,spend,impressions,clicks');
  campaignsUrl.searchParams.set('time_range', timeRange);
  campaignsUrl.searchParams.set('limit', '500');
  campaignsUrl.searchParams.set('access_token', accessToken);

  const campaignRows = await fetchAllPages(campaignsUrl.toString());

  const campaigns = campaignRows
    .filter((r) => r.campaign_id)
    .map((r) => ({
      id: r.campaign_id as string,
      name: r.campaign_name || 'Unnamed',
      spend: Number(r.spend || 0),
      impressions: Number(r.impressions || 0),
      clicks: Number(r.clicks || 0),
      status: 'ACTIVE',
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
