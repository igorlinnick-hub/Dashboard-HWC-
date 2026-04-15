import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** GET /api/team — list all team members (auth.users) */
export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, code: 'ADMIN_ERROR' },
      { status: 500 }
    );
  }

  const users = (data?.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at ?? null,
    invitedAt: u.invited_at ?? null,
    confirmed: !!u.email_confirmed_at || !!u.last_sign_in_at,
  }));

  return NextResponse.json({ status: 'ok', data: users });
}
