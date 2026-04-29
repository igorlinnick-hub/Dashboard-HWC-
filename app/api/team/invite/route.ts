import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/team/invite — invite a user by email.
 *
 * Always returns an `actionLink` so the admin can copy and share it directly
 * (Telegram etc.) when the SMTP path is unreliable.
 *
 * - New email → generates an `invite` link (user picks their own password).
 * - Already-invited but never signed in → generates a `recovery` link so
 *   the stale token gets replaced.
 * - Already-active member → ALREADY_MEMBER, no link.
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
  const existing = await findUserByEmail(supabase, email);

  if (existing?.last_sign_in_at) {
    return NextResponse.json(
      {
        status: 'error',
        error: `${email} is already an active team member`,
        code: 'ALREADY_MEMBER',
      },
      { status: 400 }
    );
  }

  const linkType = existing ? 'recovery' : 'invite';
  const { data, error } = await supabase.auth.admin.generateLink({
    type: linkType,
    email,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, code: 'ADMIN_ERROR' },
      { status: 400 }
    );
  }

  // Supabase falls back to Site URL if the requested redirect_to isn't in
  // the allow list. Force /reset-password — the deployed login/dashboard
  // hash handlers also catch the recovery token if Supabase rewrites it.
  const rawLink = data.properties?.action_link ?? '';
  const actionLink = forceResetPasswordRedirect(rawLink, origin);

  return NextResponse.json({
    status: 'ok',
    data: {
      id: data.user?.id,
      email: data.user?.email,
      action: existing ? 'reinvited' : 'invited',
      actionLink,
    },
  });
}

type AdminClient = ReturnType<typeof createServerClient>;

async function findUserByEmail(supabase: AdminClient, email: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
  const target = email.toLowerCase();
  return data?.users.find((u) => u.email?.toLowerCase() === target);
}

function forceResetPasswordRedirect(link: string, origin: string): string {
  if (!link) return link;
  try {
    const u = new URL(link);
    const redirect = u.searchParams.get('redirect_to');
    if (redirect && redirect === origin) {
      u.searchParams.set('redirect_to', `${origin}/reset-password`);
      return u.toString();
    }
  } catch {
    return link;
  }
  return link;
}
