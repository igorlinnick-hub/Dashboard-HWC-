import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/team/invite — invite a user by email.
 *
 * Behavior:
 * - New email → sends a fresh invite (signup flow, user sets their password).
 * - Already-invited but never signed in → resends a recovery link so the
 *   stale invite token can be replaced without manually deleting the row.
 * - Already an active member (has signed in) → returns ALREADY_MEMBER so the
 *   caller can show a non-destructive error.
 */
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

  if (!error) {
    return NextResponse.json({
      status: 'ok',
      data: {
        id: data.user?.id,
        email: data.user?.email,
        action: 'invited',
      },
    });
  }

  // Fallback for "already registered": decide whether to resend or refuse.
  if (/already/i.test(error.message)) {
    const existing = await findUserByEmail(supabase, email);

    if (!existing) {
      return NextResponse.json(
        { status: 'error', error: error.message, code: 'ADMIN_ERROR' },
        { status: 400 }
      );
    }

    if (existing.last_sign_in_at) {
      return NextResponse.json(
        {
          status: 'error',
          error: `${email} is already an active team member`,
          code: 'ALREADY_MEMBER',
        },
        { status: 400 }
      );
    }

    const { error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (linkError) {
      return NextResponse.json(
        { status: 'error', error: linkError.message, code: 'ADMIN_ERROR' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      data: {
        id: existing.id,
        email: existing.email,
        action: 'reinvited',
      },
    });
  }

  return NextResponse.json(
    { status: 'error', error: error.message, code: 'ADMIN_ERROR' },
    { status: 400 }
  );
}

type AdminClient = ReturnType<typeof createServerClient>;

async function findUserByEmail(supabase: AdminClient, email: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const target = email.toLowerCase();
  return data?.users.find((u) => u.email?.toLowerCase() === target);
}
