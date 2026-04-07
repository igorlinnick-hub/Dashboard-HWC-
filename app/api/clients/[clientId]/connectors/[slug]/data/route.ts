import { NextResponse } from 'next/server';
import { getConnector } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';
import { mockConnectorData } from '@/lib/connectors/mock-data';
import { fetchData as fetchStripeData } from '@/modules/stripe/fetcher';
import { transformData as transformStripeData } from '@/modules/stripe/transformer';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string; slug: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json(
      { status: 'error', error: `Unknown connector: ${slug}` },
      { status: 404 }
    );
  }

  // Read credentials from Supabase
  const supabase = createServerClient();
  const { data: creds } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .eq('is_connected', true)
    .single();

  // --- STRIPE: real implementation when key exists ---
  if (slug === 'stripe' && creds?.api_key) {
    try {
      const rawData = await fetchStripeData(creds.api_key);
      const transformed = transformStripeData(rawData);
      return NextResponse.json({
        status: 'ok',
        data: transformed,
        lastUpdated: new Date().toISOString(),
        meta: { clientId, connector: slug },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe API error';
      return NextResponse.json(
        { status: 'error', error: message, data: null, lastUpdated: new Date().toISOString() },
        { status: 502 }
      );
    }
  }

  // --- All connectors: rich mock data with charts ---
  return NextResponse.json({
    status: 'ok',
    data: mockConnectorData[slug] ?? {},
    lastUpdated: new Date().toISOString(),
    meta: { clientId, connector: slug, mock: true },
  });
}
