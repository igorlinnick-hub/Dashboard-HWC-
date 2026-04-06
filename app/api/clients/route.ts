import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

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
