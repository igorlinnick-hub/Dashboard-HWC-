import { NextResponse } from 'next/server';
import { createServerClient as createAdminClient } from '@/lib/supabase';
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: { userId: string };
}

/** DELETE /api/team/[userId] — remove a team member. Cannot remove self. */
export async function DELETE(_request: Request, { params }: RouteParams) {
  const { userId } = params;

  // Verify caller identity via session cookie and block self-removal
  const cookieStore = cookies();
  const ssr = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user: caller },
  } = await ssr.auth.getUser();

  if (!caller) {
    return NextResponse.json(
      { status: 'error', error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (caller.id === userId) {
    return NextResponse.json(
      { status: 'error', error: 'You cannot remove yourself', code: 'SELF_REMOVAL' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);

  if (error) {
    return NextResponse.json(
      { status: 'error', error: error.message, code: 'ADMIN_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({ status: 'ok' });
}
