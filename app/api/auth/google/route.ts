import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google?clientId=xxx&propertyId=yyy
 * Redirects user to Google OAuth consent screen.
 * After consent, Google redirects to /api/auth/google/callback
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('clientId');
  const propertyId = url.searchParams.get('propertyId');

  if (!clientId || !propertyId) {
    return NextResponse.json(
      { status: 'error', error: 'Missing clientId or propertyId' },
      { status: 400 }
    );
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!googleClientId || !redirectUri) {
    return NextResponse.json(
      { status: 'error', error: 'Google OAuth not configured (missing env vars)' },
      { status: 500 }
    );
  }

  // Encode clientId + propertyId in state so callback can save to the right record
  const state = JSON.stringify({ clientId, propertyId });

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
