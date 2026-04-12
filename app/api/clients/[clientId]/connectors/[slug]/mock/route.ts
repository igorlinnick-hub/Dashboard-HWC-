import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface RouteParams {
  params: { clientId: string; slug: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  const { clientId, slug } = params;
  const { useMock } = await request.json();

  const supabase = createServerClient();

  // First check if a record exists
  const { data: existing } = await supabase
    .from('connector_credentials')
    .select('id')
    .eq('client_id', clientId)
    .eq('connector_slug', slug)
    .single();

  let error;
  if (existing) {
    // Update existing
    const { error: updateError } = await supabase
      .from('connector_credentials')
      .update({ use_mock: useMock })
      .eq('id', existing.id);
    error = updateError;
  } else {
    // Insert new stub (allows demo mode even for unconfigured connectors)
    const { error: insertError } = await supabase
      .from('connector_credentials')
      .insert({
        client_id: clientId,
        connector_slug: slug,
        use_mock: useMock,
        is_connected: false
      });
    error = insertError;
  }

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'ok', useMock });
}
