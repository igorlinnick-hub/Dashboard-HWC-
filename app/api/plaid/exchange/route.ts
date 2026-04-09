import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { exchangePublicToken } from '@/modules/bank/fetcher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/plaid/exchange
 * Body: { clientId: string, publicToken: string }
 * Exchanges public_token for access_token and saves to connector_credentials.
 */
export async function POST(request: Request) {
  try {
    const { clientId, publicToken } = await request.json();

    if (!clientId || !publicToken) {
      return NextResponse.json(
        { status: 'error', error: 'Missing clientId or publicToken' },
        { status: 400 }
      );
    }

    const accessToken = await exchangePublicToken(publicToken);

    // Save access_token to Supabase
    const supabase = createServerClient();
    const { error: dbError } = await supabase
      .from('connector_credentials')
      .upsert(
        {
          client_id: clientId,
          connector_slug: 'bank',
          api_key: accessToken,
          extra_config: {},
          is_connected: true,
          connected_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,connector_slug' }
      );

    if (dbError) {
      return NextResponse.json(
        { status: 'error', error: dbError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      data: { clientId, connected: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to exchange token';
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
