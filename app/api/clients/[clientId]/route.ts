import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { clientId: string };
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { clientId } = params;
  const body = await request.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { status: 'error', error: 'Name and slug are required', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .update({ name, slug })
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    data: {
      id: data.id,
      name: data.name,
      slug: data.slug,
      logoUrl: data.logo_url,
      isActive: data.is_active,
      createdAt: data.created_at,
    },
  });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { clientId } = params;

  const supabase = createServerClient();
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', clientId);

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, code: 'DB_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
