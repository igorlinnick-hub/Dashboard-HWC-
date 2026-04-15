import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** POST /api/team/invite — invite a user by email */
export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { status: 'error', error: 'Valid email is required', code: 'INVALID_INPUT' },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/reset-password`;

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });

  if (error) {
    const msg = error.message || 'Failed to send invite';
    const code = /already/i.test(msg) ? 'ALREADY_EXISTS' : 'ADMIN_ERROR';
    return NextResponse.json(
      { status: 'error', error: msg, code },
      { status: 400 }
    );
  }

  return NextResponse.json({
    status: 'ok',
    data: {
      id: data.user?.id,
      email: data.user?.email,
    },
  });
}
