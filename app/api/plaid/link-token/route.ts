import { NextResponse } from 'next/server';
import { createLinkToken } from '@/modules/bank/fetcher';

export const dynamic = 'force-dynamic';

/**
 * POST /api/plaid/link-token
 * Body: { clientId: string }
 * Returns: { linkToken: string }
 */
export async function POST(request: Request) {
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
    const plaidError = (err as { response?: { data?: { error_code?: string; error_message?: string } } })?.response?.data;
    const message = plaidError?.error_code
      ? `Plaid error: ${plaidError.error_code}`
      : 'Failed to create link token';
    console.error('[plaid/link-token]', plaidError?.error_code ?? 'unknown');
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
