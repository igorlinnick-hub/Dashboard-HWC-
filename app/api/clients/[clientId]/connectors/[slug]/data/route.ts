import { NextResponse } from 'next/server';
import { getConnector } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';
import { fetchData as fetchStripeData } from '@/modules/stripe/fetcher';
import { transformData as transformStripeData } from '@/modules/stripe/transformer';

interface RouteParams {
  params: { clientId: string; slug: string };
}

// Mock data for connectors that aren't implemented yet
const mockData: Record<string, Record<string, unknown>> = {
  bank: { balance: 24500, deposits: 12300, cashFlow: 8200 },
  square: { totalSales: 9400, transactions: 87, avgTicket: 108 },
  meta: { adSpend: 3200, impressions: 45000, ctr: 2.4 },
  yelp: { rating: 4.7, reviewCount: 234, newReviews: 12 },
  tiktok: { adSpend: 1800, videoViews: 120000, conversions: 45 },
  'google-analytics': { sessions: 8500, users: 6200, bounceRate: 42.3 },
};

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
  const { data: creds, error: dbError } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .eq('is_connected', true)
    .single();

  // --- STRIPE: real implementation ---
  if (slug === 'stripe') {
    const apiKey = creds?.api_key as string | undefined;

    if (!apiKey) {
      // No credentials saved — return mock data
      return NextResponse.json({
        status: 'ok',
        data: { totalRevenue: 0, transactionCount: 0, mrr: 0, revenueChart: [] },
        lastUpdated: new Date().toISOString(),
        meta: { clientId, connector: slug, mock: true },
      });
    }

    try {
      const rawData = await fetchStripeData(apiKey);
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

  // --- All other connectors: mock data for now ---
  return NextResponse.json({
    status: 'ok',
    data: mockData[slug] ?? {},
    lastUpdated: new Date().toISOString(),
    meta: { clientId, connector: slug, mock: true },
  });
}
