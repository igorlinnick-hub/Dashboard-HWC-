import { NextResponse } from 'next/server';
import { getConnector } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';
import { testConnection as testStripe } from '@/modules/stripe/fetcher';
import { testConnection as testSquare } from '@/modules/square/fetcher';
import { testConnection as testYelp } from '@/modules/yelp/fetcher';
import { testConnection as testMeta } from '@/modules/meta/fetcher';
import { testConnection as testTikTok } from '@/modules/tiktok/fetcher';
import { testConnection as testGA } from '@/modules/google-analytics/fetcher';
import { testConnection as testBank } from '@/modules/bank/fetcher';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string; slug: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json({ status: 'error', error: 'Unknown connector' }, { status: 404 });
  }

  // Fetch the credentials we just saved
  const supabase = createServerClient();
  const { data: creds, error: dbError } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .single();

  if (dbError || !creds) {
    return NextResponse.json({ status: 'error', error: 'Credentials not found' }, { status: 404 });
  }

  try {
    switch (slug) {
      case 'stripe':
        await testStripe(creds.api_key);
        break;
      case 'square':
        await testSquare(creds.extra_config.access_token, creds.extra_config.location_id);
        break;
      case 'yelp':
        await testYelp(creds.api_key, creds.extra_config.business_id);
        break;
      case 'meta':
        await testMeta(creds.api_key, creds.extra_config.account_id);
        break;
      case 'tiktok':
        await testTikTok(creds.api_key, creds.extra_config.advertiser_id, clientId);
        break;
      case 'google-analytics':
        await testGA(creds.api_key, creds.extra_config.property_id);
        break;
      case 'bank':
        await testBank(creds.api_key);
        break;
      default:
        return NextResponse.json({ status: 'error', error: `Testing not implemented for ${slug}` }, { status: 501 });
    }

    return NextResponse.json({ status: 'ok', message: 'Connection successful' });
  } catch (err) {
    console.error(`[test-connection:${slug}]`, err);
    return NextResponse.json({ 
      status: 'error', 
      error: err instanceof Error ? err.message : 'Connection test failed' 
    }, { status: 502 });
  }
}
