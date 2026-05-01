// ==========================================
// Connector orchestrator (Layer 0+1)
// ==========================================
// Single entry point for all connector data requests. One reason to change:
// orchestration policy (cache TTL, mock fallback, error normalization).
//
// Pipeline:
//   validate → load-creds → mock-or-cache → adapter → persist → respond
//
// Each step is a small private function so the top-level runConnector reads
// like a pipeline and stays well under the kill-criterion line budget.

import 'server-only';
import { getCache, setCache, invalidateCache } from '@/lib/cache';
import { getConnector } from '@/lib/connectors/registry';
import { getConnectorAdapter } from '@/lib/connectors/adapters';
import { mockConnectorData } from '@/lib/connectors/mock-data';
import { getTransformer } from '@/lib/connectors/transformers';
import type {
  ConnectorCredentialsRow,
  ConnectorErrorCode,
  OrchestratorInput,
  OrchestratorOutput,
} from '@/types';

const nowIso = () => new Date().toISOString();

function errorOut(
  slug: string,
  clientId: string,
  period: { from: string; to: string },
  code: ConnectorErrorCode,
  error: string,
): OrchestratorOutput {
  return {
    status: 'error',
    code,
    error,
    data: null,
    lastUpdated: nowIso(),
    meta: { clientId, connector: slug, period },
  };
}

async function loadCreds(clientId: string, slug: string): Promise<ConnectorCredentialsRow | null> {
  // Direct PostgREST call instead of @supabase/supabase-js so we can guarantee
  // cache: 'no-store'. The Supabase JS client does NOT honour the
  // global.fetch override for its internal fetches reliably under Next.js 14
  // (observed live: PATCH-then-select returned the pre-PATCH row body for
  // the lifetime of the warm function instance, even with fetchCache
  // 'force-no-store' on the route and global fetch override on the client).
  // Direct fetch sidesteps both layers of caching.
  const url =
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/connector_credentials` +
    `?client_id=eq.${encodeURIComponent(clientId)}` +
    `&connector_slug=eq.${encodeURIComponent(slug)}` +
    `&is_connected=eq.true` +
    `&select=*`;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as ConnectorCredentialsRow[];
  return rows[0] ?? null;
}

type MockReason = 'not_connected' | 'demo_mode';

function mockResponse(
  slug: string,
  clientId: string,
  period: { from: string; to: string },
  reason: MockReason,
): OrchestratorOutput {
  const transform = getTransformer(slug);
  const data = transform
    ? transform(mockConnectorData[slug] ?? {})
    : { metrics: [], timeseries: [], breakdowns: [] };
  return {
    status: 'ok',
    data,
    lastUpdated: nowIso(),
    meta: {
      clientId,
      connector: slug,
      period,
      mock: true,
      notConnected: reason === 'not_connected',
      demoMode: reason === 'demo_mode',
    },
  };
}

async function readCache(slug: string, clientId: string, period: { from: string; to: string }, refresh: boolean) {
  if (refresh) {
    await invalidateCache(slug, clientId, period.from, period.to);
    return null;
  }
  return getCache(slug, clientId, period.from, period.to);
}

export async function runConnector({
  clientId,
  slug,
  period,
  refresh,
}: OrchestratorInput): Promise<OrchestratorOutput> {
  if (!getConnector(slug)) {
    return errorOut(slug, clientId, period, 'UNKNOWN', `Unknown connector: ${slug}`);
  }

  const creds = await loadCreds(clientId, slug);
  if (!creds) return mockResponse(slug, clientId, period, 'not_connected');

  // Demo Mode: connected creds exist but the user toggled the row to mock.
  // Skip cache + adapter so the response always reflects the toggle without a
  // refresh, and so we never round-trip the real credential through any
  // network path.
  if (creds.use_mock === true) return mockResponse(slug, clientId, period, 'demo_mode');

  const cached = await readCache(slug, clientId, period, refresh ?? false);
  if (cached) {
    return {
      status: 'ok',
      data: cached.data,
      lastUpdated: cached.fetchedAt,
      meta: { clientId, connector: slug, cached: true, period },
    };
  }

  const adapter = getConnectorAdapter(slug);
  if (!adapter) {
    return errorOut(slug, clientId, period, 'UNKNOWN', `No adapter registered for connector: ${slug}`);
  }

  let result;
  try {
    result = await adapter({ creds, period });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Adapter threw an unhandled error';
    console.error(`[connector:${slug}] adapter threw`, err);
    return errorOut(slug, clientId, period, 'UNKNOWN', message);
  }

  if (result.status === 'ok') {
    await setCache(slug, clientId, period.from, period.to, result.data);
    return { status: 'ok', data: result.data, lastUpdated: nowIso(), meta: { clientId, connector: slug, period } };
  }

  console.error(`[connector:${slug}]`, result.code, result.error);
  return errorOut(slug, clientId, period, result.code, result.error);
}
