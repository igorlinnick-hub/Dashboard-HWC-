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

/**
 * Run a live API test for the given slug. Throws if the saved creds don't
 * actually work (e.g. Meta token without ads_read permission).
 */
async function runConnectionTest(
  slug: string,
  apiKey: string | null,
  extra: Record<string, string>,
  clientId: string
): Promise<void> {
  switch (slug) {
    case 'stripe':
      await testStripe(apiKey ?? '');
      return;
    case 'square':
      await testSquare(extra.access_token, extra.location_id);
      return;
    case 'yelp':
      await testYelp(apiKey ?? '', extra.business_id);
      return;
    case 'meta':
      await testMeta(apiKey ?? '', extra.account_id);
      return;
    case 'tiktok':
      await testTikTok(apiKey ?? '', extra.advertiser_id, clientId);
      return;
    case 'google-analytics':
      await testGA(apiKey ?? '', extra.property_id);
      return;
    case 'bank':
      await testBank(apiKey ?? '');
      return;
    default:
      // Unknown connector — skip validation, optimistic save.
      return;
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;
  const body = await request.json();
  const credentials: Record<string, string> = body.credentials ?? {};

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json(
      { status: 'error', error: `Unknown connector: ${slug}`, code: 'UNKNOWN_CONNECTOR' },
      { status: 400 }
    );
  }

  // Validate that all required fields are provided
  const missing = connector.fields
    .filter((f) => !credentials[f.key])
    .map((f) => f.label);

  if (missing.length > 0) {
    return NextResponse.json(
      { status: 'error', error: `Missing fields: ${missing.join(', ')}`, code: 'MISSING_FIELDS' },
      { status: 400 }
    );
  }

  // Find the secret field to store as api_key
  const secretField = connector.fields.find((f) => f.secret);
  const apiKey = secretField ? credentials[secretField.key] : null;

  // Validate credentials live BEFORE marking the connector as connected, so
  // a bad token (e.g. Meta without ads_read) never leaves the dashboard in
  // a fake "connected" state.
  try {
    await runConnectionTest(slug, apiKey, credentials, clientId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection test failed';
    console.error(`[connect:${slug}] validation failed`, message);

    // Persist creds with is_connected=false so the user can re-edit them
    // from the same form (sessionStorage draft is also still around).
    const supabase = createServerClient();
    await supabase
      .from('connector_credentials')
      .upsert(
        {
          client_id: clientId,
          connector_slug: slug,
          api_key: apiKey,
          extra_config: credentials,
          is_connected: false,
        },
        { onConflict: 'client_id,connector_slug' }
      );

    return NextResponse.json(
      { status: 'error', error: message, code: 'INVALID_KEY' },
      { status: 400 }
    );
  }

  // Test passed — store credentials and flag connected
  const supabase = createServerClient();
  const { error: dbError } = await supabase
    .from('connector_credentials')
    .upsert(
      {
        client_id: clientId,
        connector_slug: slug,
        api_key: apiKey,
        extra_config: credentials,
        is_connected: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,connector_slug' }
    );

  if (dbError) {
    return NextResponse.json(
      { status: 'error', error: dbError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    data: { clientId, slug, connected: true },
    lastUpdated: new Date().toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json(
      { error: `Unknown connector: ${slug}`, code: 'UNKNOWN_CONNECTOR' },
      { status: 404 }
    );
  }

  // Soft-delete: keep credentials so user can reconnect without re-entering keys
  const supabase = createServerClient();
  const { error: dbError } = await supabase
    .from('connector_credentials')
    .update({ is_connected: false })
    .eq('client_id', clientId)
    .eq('connector_slug', slug);

  if (dbError) {
    return NextResponse.json(
      { error: dbError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

/** PATCH — reconnect using existing saved credentials */
export async function PATCH(_request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;

  const connector = getConnector(slug);
  if (!connector) {
    return NextResponse.json(
      { status: 'error', error: `Unknown connector: ${slug}`, code: 'UNKNOWN_CONNECTOR' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Load existing creds so we can validate them before flipping is_connected
  const { data: existing } = await supabase
    .from('connector_credentials')
    .select('*')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { status: 'error', error: 'No saved credentials found', code: 'NO_CREDENTIALS' },
      { status: 404 }
    );
  }

  try {
    await runConnectionTest(
      slug,
      existing.api_key,
      (existing.extra_config ?? {}) as Record<string, string>,
      clientId
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection test failed';
    console.error(`[reconnect:${slug}] validation failed`, message);
    return NextResponse.json(
      { status: 'error', error: message, code: 'INVALID_KEY' },
      { status: 400 }
    );
  }

  const { error: dbError } = await supabase
    .from('connector_credentials')
    .update({ is_connected: true, connected_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('connector_slug', slug);

  if (dbError) {
    return NextResponse.json(
      { status: 'error', error: dbError.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    data: { clientId, slug, connected: true, reconnected: true },
  });
}
