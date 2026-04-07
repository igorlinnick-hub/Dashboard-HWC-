import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { status: 'error', error: 'Name and slug are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({ name, slug, is_active: true })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message },
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
    lastUpdated: new Date().toISOString(),
  });
}

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, data: [] },
      { status: 500 }
    );
  }

  // Map snake_case DB columns to camelCase
  const clients = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    status: 'ok',
    data: clients,
    lastUpdated: new Date().toISOString(),
  });
}
