import { NextResponse } from 'next/server';
import { CONNECTORS } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';
import type { ClientConnector } from '@/types';

interface RouteParams {
  params: { clientId: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { clientId } = params;

  // Fetch real credentials from Supabase
  const supabase = createServerClient();
  const { data: creds } = await supabase
    .from('connector_credentials')
    .select('connector_slug, is_connected, connected_at')
    .eq('client_id', clientId);

  const credsMap = new Map(
    (creds ?? []).map((c: { connector_slug: string; is_connected: boolean; connected_at: string | null }) => [
      c.connector_slug,
      { isConnected: c.is_connected, connectedAt: c.connected_at },
    ])
  );

  const connectors: ClientConnector[] = CONNECTORS.map((def) => {
    const saved = credsMap.get(def.slug);
    return {
      definition: def,
      isConnected: saved?.isConnected ?? false,
      connectedAt: saved?.connectedAt ?? null,
    };
  });

  return NextResponse.json({
    status: 'ok',
    data: connectors,
    lastUpdated: new Date().toISOString(),
  });
}
