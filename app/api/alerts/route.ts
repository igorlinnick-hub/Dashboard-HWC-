import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  const supabase = createServerClient();
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { clientId } = body;

  const supabase = createServerClient();
  let query = supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('is_read', false);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
