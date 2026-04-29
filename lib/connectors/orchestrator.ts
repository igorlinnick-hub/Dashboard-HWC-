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
import { createServerClient } from '@/lib/supabase';
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
  return { status: 'error', code, error, data: null, lastUpdated: nowIso(), meta: { clientId, connector: slug, period } };
}

async function loadCreds(clientId: string, slug: string): Promise<ConnectorCredentialsRow | null> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .eq('is_connected', true)
    .single();
  return (data as ConnectorCredentialsRow | null) ?? null;
}

function mockResponse(slug: string, clientId: string, period: { from: string; to: string }): OrchestratorOutput {
  const transform = getTransformer(slug);
  const data = transform
    ? transform(mockConnectorData[slug] ?? {})
    : { metrics: [], timeseries: [], breakdowns: [] };
  return {
    status: 'ok',
    data,
    lastUpdated: nowIso(),
    meta: { clientId, connector: slug, mock: true, notConnected: true, period },
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
  if (!creds) return mockResponse(slug, clientId, period);

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
