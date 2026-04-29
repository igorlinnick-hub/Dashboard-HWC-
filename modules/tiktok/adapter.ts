import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyTikTokError } from './errors';

export const tiktokAdapter: ConnectorAdapter = async ({ creds, period }) => {
  const advertiserId = creds.extra_config?.advertiser_id as string | undefined;

  if (!creds.api_key || !advertiserId) {
    return {
      status: 'error',
      code: 'NOT_CONNECTED',
      error: 'TikTok credentials missing api_key or advertiser_id',
    };
  }
  try {
    // TikTok fetcher signature includes clientId for per-tenant scoping —
    // reuse creds.client_id (already authoritative on the row).
    const raw = await fetchData(creds.api_key, advertiserId, period.from, period.to, creds.client_id);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyTikTokError(err);
  }
};
