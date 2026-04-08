import { NextResponse } from 'next/server';
import { getConnector } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';
import { mockConnectorData } from '@/lib/connectors/mock-data';
import { getCache, setCache, invalidateCache } from '@/lib/cache';
import { fetchData as fetchStripeData } from '@/modules/stripe/fetcher';
import { transformData as transformStripe } from '@/modules/stripe/transformer';
import { fetchData as fetchSquareData } from '@/modules/square/fetcher';
import { fetchData as fetchYelpData } from '@/modules/yelp/fetcher';
import { fetchData as fetchMetaData } from '@/modules/meta/fetcher';
import { fetchData as fetchTikTokData } from '@/modules/tiktok/fetcher';
import { fetchData as fetchBankData } from '@/modules/bank/fetcher';
import { transformData as transformBank } from '@/modules/bank/transformer';
import { transformData as transformSquare } from '@/modules/square/transformer';
import { transformData as transformMeta } from '@/modules/meta/transformer';
import { transformData as transformYelp } from '@/modules/yelp/transformer';
import { transformData as transformTikTok } from '@/modules/tiktok/transformer';
import { fetchData as fetchGAData } from '@/modules/google-analytics/fetcher';
import { transformData as transformGA } from '@/modules/google-analytics/transformer';
import type { ConnectorResponse } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string; slug: string };
}

const transformers: Record<string, (raw: unknown) => ConnectorResponse> = {
  bank: (raw: unknown) => transformBank(raw as Parameters<typeof transformBank>[0]),
  square: transformSquare as any,
  meta: transformMeta as any,
  yelp: transformYelp as any,
  tiktok: transformTikTok as any,
  'google-analytics': transformGA as any,
};

/** Default period: last 30 days */
function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export async function GET(request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;
  const url = new URL(request.url);

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json(
      { status: 'error', error: `Unknown connector: ${slug}`, code: 'UNKNOWN', data: null },
      { status: 404 }
    );
  }

  // Read period from query params, default to last 30 days
  const defaults = defaultPeriod();
  const from = url.searchParams.get('from') ?? defaults.from;
  const to = url.searchParams.get('to') ?? defaults.to;
  const refresh = url.searchParams.get('refresh') === 'true';

  // Read credentials from Supabase
  const supabase = createServerClient();
  const { data: creds } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .eq('is_connected', true)
    .single();

  // --- Not connected: return transformed mock data ---
  if (!creds) {
    const mockRaw = mockConnectorData[slug] ?? {};
    const transform = slug === 'stripe' ? (r: unknown) => transformStripe(r as Parameters<typeof transformStripe>[0]) : transformers[slug];
    const transformed: ConnectorResponse = transform
      ? transform(mockRaw)
      : { metrics: [], timeseries: [], breakdowns: [] };

    return NextResponse.json({
      status: 'ok',
      data: transformed,
      lastUpdated: new Date().toISOString(),
      meta: { clientId, connector: slug, mock: true, notConnected: true, period: { from, to } },
    });
  }

  // --- Connected: check cache first (unless refresh forced) ---
  if (!refresh) {
    const cached = await getCache(slug, clientId, from, to);
    if (cached) {
      return NextResponse.json({
        status: 'ok',
        data: cached.data,
        lastUpdated: cached.fetchedAt,
        meta: { clientId, connector: slug, cached: true, period: { from, to } },
      });
    }
  } else {
    // Invalidate on forced refresh
    await invalidateCache(slug, clientId, from, to);
  }

  // --- STRIPE: real implementation when key exists ---
  if (slug === 'stripe' && creds?.api_key) {
    try {
      const rawData = await fetchStripeData(creds.api_key, from, to);
      const transformed = transformStripe(rawData);
      const now = new Date().toISOString();

      // Update cache
      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe API error';

      let code: string = 'UNKNOWN';
      if (message.includes('Invalid API Key') || message.includes('authentication')) {
        code = 'INVALID_KEY';
      } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        code = 'CONNECTION_TIMEOUT';
      } else if (message.includes('rate') || message.includes('Too many')) {
        code = 'RATE_LIMIT';
      }

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- SQUARE: real implementation when access_token exists ---
  if (slug === 'square' && creds?.access_token && creds?.location_id) {
    try {
      const rawData = await fetchSquareData(creds.access_token, creds.location_id, from, to);
      const transformed = transformSquare(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Square API error';
      let code: string = 'UNKNOWN';
      if (message.includes('401') || message.includes('unauthorized') || message.includes('UNAUTHORIZED')) {
        code = 'INVALID_KEY';
      } else if (message.includes('timeout')) {
        code = 'CONNECTION_TIMEOUT';
      } else if (message.includes('rate') || message.includes('429')) {
        code = 'RATE_LIMIT';
      }

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- YELP: real implementation when key exists ---
  const businessId = creds?.extra_config?.business_id;
  if (slug === 'yelp' && creds?.api_key && businessId) {
    try {
      const rawData = await fetchYelpData(creds.api_key, businessId);
      const transformed = transformYelp(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Yelp API error';
      let code: string = 'UNKNOWN';
      if (message.includes('401') || message.includes('unauthorized')) code = 'INVALID_KEY';
      if (message.includes('timeout')) code = 'CONNECTION_TIMEOUT';
      if (message.includes('429')) code = 'RATE_LIMIT';

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- META: real implementation when key exists ---
  const metaAccountId = creds?.extra_config?.account_id;
  if (slug === 'meta' && creds?.api_key && metaAccountId) {
    try {
      const rawData = await fetchMetaData(creds.api_key, metaAccountId, from, to);
      const transformed = transformMeta(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Meta API error';
      let code: string = 'UNKNOWN';
      if (message.includes('401') || message.includes('unauthorized')) code = 'INVALID_KEY';
      if (message.includes('timeout')) code = 'CONNECTION_TIMEOUT';
      if (message.includes('429')) code = 'RATE_LIMIT';

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }
  
  // --- TIKTOK: real implementation when key exists ---
  const tiktokAdvertiserId = creds?.extra_config?.advertiser_id;
  if (slug === 'tiktok' && creds?.api_key && tiktokAdvertiserId) {
    try {
      const rawData = await fetchTikTokData(creds.api_key, tiktokAdvertiserId, from, to, clientId);
      const transformed = transformTikTok(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TikTok API error';
      let code: string = 'UNKNOWN';
      if (message.includes('401') || message.includes('unauthorized')) code = 'INVALID_KEY';
      if (message.includes('timeout')) code = 'CONNECTION_TIMEOUT';
      if (message.includes('429')) code = 'RATE_LIMIT';

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- GOOGLE ANALYTICS: real implementation when refresh_token exists ---
  if (slug === 'google-analytics' && creds?.api_key) {
    const propertyId = creds.extra_config?.property_id;
    if (!propertyId) {
      return NextResponse.json(
        { status: 'error', error: 'Missing GA4 property_id in credentials', code: 'INVALID_KEY', data: null },
        { status: 400 }
      );
    }

    try {
      const rawData = await fetchGAData(creds.api_key, propertyId, from, to);
      const transformed = transformGA(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google Analytics API error';

      let code: string = 'UNKNOWN';
      if (message.includes('401') || message.includes('403') || message.includes('token refresh failed')) {
        code = 'INVALID_KEY';
      } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        code = 'CONNECTION_TIMEOUT';
      } else if (message.includes('429') || message.includes('rate') || message.includes('quota')) {
        code = 'RATE_LIMIT';
      }

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- BANK (Plaid): real implementation when access_token exists ---
  if (slug === 'bank' && creds?.api_key) {
    try {
      const rawData = await fetchBankData(creds.api_key, from, to);
      const transformed = transformBank(rawData);
      const now = new Date().toISOString();

      await setCache(slug, clientId, from, to, transformed);

      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: now,
        meta: { clientId, connector: slug, period: { from, to } },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Plaid API error';
      let code: string = 'UNKNOWN';
      if (message.includes('INVALID_ACCESS_TOKEN') || message.includes('ITEM_LOGIN_REQUIRED')) {
        code = 'INVALID_KEY';
      } else if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
        code = 'CONNECTION_TIMEOUT';
      } else if (message.includes('RATE_LIMIT')) {
        code = 'RATE_LIMIT';
      }

      return NextResponse.json(
        { status: 'error', error: message, code, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- Connected but no real API yet: transformed mock data, cached ---
  const mockRaw = mockConnectorData[slug] ?? {};
  const transform = slug === 'stripe' ? (r: unknown) => transformStripe(r as Parameters<typeof transformStripe>[0]) : transformers[slug];
  const transformed: ConnectorResponse = transform
    ? transform(mockRaw)
    : { metrics: [], timeseries: [], breakdowns: [] };

  const now = new Date().toISOString();
  await setCache(slug, clientId, from, to, transformed);

  return NextResponse.json({
    status: 'ok',
    data: transformed,
    lastUpdated: now,
    meta: { clientId, connector: slug, mock: true, period: { from, to } },
  });
}
