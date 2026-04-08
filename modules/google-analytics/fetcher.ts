import { refreshAccessToken } from '@/lib/google-auth';
import type { GAData, GADailyRow, GAChannelRow, GA4RunReportResponse } from './types';

/**
 * Fetch real GA4 data via the Google Analytics Data API v1beta.
 * @param refreshToken — stored in connector_credentials.api_key
 * @param propertyId — GA4 property ID (e.g. "123456789")
 * @param from — YYYY-MM-DD
 * @param to — YYYY-MM-DD
 */
export async function fetchData(
  refreshToken: string,
  propertyId: string,
  from: string,
  to: string
): Promise<GAData> {
  const accessToken = await refreshAccessToken(refreshToken);

  const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  // --- Report 1: Totals (sessions, activeUsers, newUsers, bounceRate, avgSessionDuration) ---
  const totalsBody = {
    dateRanges: [{ startDate: from, endDate: to }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
  };

  // --- Report 2: Daily sessions (dimension: date) ---
  const dailyBody = {
    dateRanges: [{ startDate: from, endDate: to }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  };

  // --- Report 3: Channel breakdown (dimension: sessionDefaultChannelGroup) ---
  const channelBody = {
    dateRanges: [{ startDate: from, endDate: to }],
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
  };

  // Run all three reports in parallel
  const [totalsRes, dailyRes, channelRes] = await Promise.all([
    runReport(apiUrl, accessToken, totalsBody),
    runReport(apiUrl, accessToken, dailyBody),
    runReport(apiUrl, accessToken, channelBody),
  ]);

  // Parse totals
  const totalsRow = totalsRes.rows?.[0];
  const mv = totalsRow?.metricValues ?? [];
  const sessions = parseInt(mv[0]?.value ?? '0', 10);
  const activeUsers = parseInt(mv[1]?.value ?? '0', 10);
  const newUsers = parseInt(mv[2]?.value ?? '0', 10);
  const bounceRate = parseFloat(mv[3]?.value ?? '0');
  const avgSessionDuration = parseFloat(mv[4]?.value ?? '0');

  // Parse daily timeseries
  const dailySessions: GADailyRow[] = (dailyRes.rows ?? []).map((row) => {
    const dateRaw = row.dimensionValues?.[0]?.value ?? '';
    // GA4 returns date as YYYYMMDD — convert to YYYY-MM-DD
    const date = dateRaw.length === 8
      ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
      : dateRaw;
    return {
      date,
      sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
    };
  });

  // Parse channel breakdown
  const channels: GAChannelRow[] = (channelRes.rows ?? []).map((row) => ({
    channel: row.dimensionValues?.[0]?.value ?? 'Unknown',
    sessions: parseInt(row.metricValues?.[0]?.value ?? '0', 10),
  }));

  return {
    sessions,
    activeUsers,
    newUsers,
    bounceRate,
    avgSessionDuration,
    dailySessions,
    channels,
  };
}

/** Helper: POST a GA4 runReport request */
async function runReport(
  url: string,
  accessToken: string,
  body: Record<string, unknown>
): Promise<GA4RunReportResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GA4 API error (${res.status}): ${text}`);
  }

  return res.json();
}
