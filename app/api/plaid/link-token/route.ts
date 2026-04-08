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
    const message = err instanceof Error ? err.message : 'Failed to create link token';
    return NextResponse.json(
      { status: 'error', error: message },
      { status: 500 }
    );
  }
}
