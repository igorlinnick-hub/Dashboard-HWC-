// ==========================================
// Supabase-backed cache with per-connector TTL
// ==========================================
// Table: cached_data (connector_slug, client_id, period_from, period_to, data, fetched_at)
// Primary key: (connector_slug, client_id, period_from, period_to)

import { createServerClient } from '@/lib/supabase';
import type { ConnectorResponse } from '@/types';

/** TTL in seconds per connector slug */
const TTL: Record<string, number> = {
  stripe: 15 * 60,    // 15 min
  square: 15 * 60,
  bank: 15 * 60,
  meta: 60 * 60,      // 60 min
  tiktok: 60 * 60,
  yelp: 180 * 60,     // 180 min
  'google-analytics': 180 * 60,
};

function getTTL(slug: string): number {
  return TTL[slug] ?? 15 * 60;
}

interface CachedRow {
  data: ConnectorResponse;
  fetched_at: string;
}

/** Check cache — returns data + fetchedAt if fresh, null otherwise */
export async function getCache(
  slug: string,
  clientId: string,
  from: string,
  to: string
): Promise<{ data: ConnectorResponse; fetchedAt: string } | null> {
  const supabase = createServerClient();

  const { data: row } = await supabase
    .from('cached_data')
    .select('data, fetched_at')
    .eq('connector_slug', slug)
    .eq('client_id', clientId)
    .eq('period_from', from)
    .eq('period_to', to)
    .single<CachedRow>();

  if (!row) return null;

  const age = Date.now() - new Date(row.fetched_at).getTime();
  if (age > getTTL(slug) * 1000) return null;

  return { data: row.data as ConnectorResponse, fetchedAt: row.fetched_at };
}

/** Upsert cache entry */
export async function setCache(
  slug: string,
  clientId: string,
  from: string,
  to: string,
  data: ConnectorResponse
): Promise<void> {
  const supabase = createServerClient();

  await supabase.from('cached_data').upsert(
    {
      connector_slug: slug,
      client_id: clientId,
      period_from: from,
      period_to: to,
      data,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'connector_slug,client_id,period_from,period_to' }
  );
}

/** Invalidate cache for a specific connector+client+period */
export async function invalidateCache(
  slug: string,
  clientId: string,
  from: string,
  to: string
): Promise<void> {
  const supabase = createServerClient();

  await supabase
    .from('cached_data')
    .delete()
    .eq('connector_slug', slug)
    .eq('client_id', clientId)
    .eq('period_from', from)
    .eq('period_to', to);
}
