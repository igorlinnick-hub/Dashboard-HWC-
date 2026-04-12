import { NextResponse } from 'next/server';
import { createLinkToken } from '@/modules/bank/fetcher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/plaid/link-token
 * Body: { clientId: string }
 * Returns: { linkToken: string }
 */
export async function POST(request: Request) {
  console.log('[plaid/link-token] PLAID_CLIENT_ID set:', !!process.env.PLAID_CLIENT_ID);
  console.log('[plaid/link-token] PLAID_SECRET set:', !!process.env.PLAID_SECRET);
  console.log('[plaid/link-token] PLAID_ENV:', process.env.PLAID_ENV ?? 'not set (defaults to sandbox)');

  try {
    const { clientId } = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { status: 'error', error: 'Missing clientId' },
        { status: 400 }
      );
    }

    const linkToken = await createLinkToken(clientId);

    return NextResponse.json({ status: 'ok', linkToken });
  } catch (err) {
    const plaidError = (err as any)?.response?.data;
    const message = plaidError
      ? `Plaid error: ${plaidError.error_code} — ${plaidError.error_message}`
      : err instanceof Error ? err.message : 'Failed to create link token';
    console.error('[plaid/link-token] error:', JSON.stringify(plaidError ?? { message }));
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
