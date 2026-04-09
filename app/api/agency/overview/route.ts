import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getConnector } from '@/lib/connectors/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createServerClient();

  // 1. Fetch all active clients
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (clientsError) {
    return NextResponse.json(
      { error: clientsError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  // 2. Fetch all credentials to count connections
  const { data: allCreds, error: credsError } = await supabase
    .from('connector_credentials')
    .select('client_id, connector_slug, is_connected')
    .eq('is_connected', true);

  if (credsError) {
    return NextResponse.json(
      { error: credsError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  // 3. Fetch latest cached data for all clients
  // We'll just get the most recent fetched_at for each client/connector
  const { data: cachedData, error: cacheError } = await supabase
    .from('cached_data')
    .select('client_id, connector_slug, data, fetched_at')
    .order('fetched_at', { ascending: false });

  if (cacheError) {
    return NextResponse.json(
      { error: cacheError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  // Process data into a map for easy lookup: client_id -> connector_slug -> newest_data
  const cacheMap: Record<string, Record<string, any>> = {};
  cachedData?.forEach(item => {
    if (!cacheMap[item.client_id]) cacheMap[item.client_id] = {};
    if (!cacheMap[item.client_id][item.connector_slug]) {
      cacheMap[item.client_id][item.connector_slug] = item.data;
    }
  });

  // Map clients to their stats
  const result = clients.map(client => {
    const clientCreds = allCreds.filter(c => c.client_id === client.id);
    const clientCache = cacheMap[client.id] || {};

    // Extract specific metrics
    const stripeData = clientCache['stripe'];
    const squareData = clientCache['square'];
    const metaData = clientCache['meta'];
    const tiktokData = clientCache['tiktok'];
    const yelpData = clientCache['yelp'];
    const gaData = clientCache['google-analytics'];

    // Revenue: Stripe (netRevenue) + Square (totalSales)
    const stripeRevenue = stripeData?.metrics?.find((m: any) => m.key === 'netRevenue')?.value || 0;
    const squareRevenue = squareData?.metrics?.find((m: any) => m.key === 'totalSales' || m.key === 'grossSales')?.value || 0;
    const revenue = stripeRevenue + squareRevenue;

    // Ad Spend: Meta (adSpend) + TikTok (adSpend)
    const metaSpend = metaData?.metrics?.find((m: any) => m.key === 'adSpend')?.value || 0;
    const tiktokSpend = tiktokData?.metrics?.find((m: any) => m.key === 'adSpend')?.value || 0;
    const adSpend = metaSpend + tiktokSpend;

    // Yelp Rating
    const yelpRating = yelpData?.metrics?.find((m: any) => m.key === 'rating')?.value || 0;

    // GA Sessions
    const gaSessions = gaData?.metrics?.find((m: any) => m.key === 'sessions')?.value || 0;

    return {
      id: client.id,
      name: client.name,
      slug: client.slug,
      isActive: client.is_active,
      revenue,
      adSpend,
      yelpRating,
      sessions: gaSessions,
      connectedCount: clientCreds.length,
      totalConnectors: 7 // Constants or fetch from registry
    };
  });

  return NextResponse.json({
    status: 'ok',
    data: result,
    lastUpdated: new Date().toISOString()
  });
}
