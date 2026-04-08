import { NextResponse } from 'next/server';
import { getConnector } from '@/lib/connectors/registry';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string; slug: string };
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

  // Store credentials in Supabase
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

  const supabase = createServerClient();
  const { error: dbError } = await supabase
    .from('connector_credentials')
    .delete()
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
