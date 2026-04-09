import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * GET /api/auth/google/callback?code=xxx&state=yyy
 * Exchanges authorization code for tokens, saves refresh_token to Supabase.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return redirectWithError(`Google OAuth denied: ${error}`);
  }

  if (!code || !stateRaw) {
    return redirectWithError('Missing code or state from Google');
  }

  let state: { clientId: string; propertyId: string };
  try {
    state = JSON.parse(stateRaw);
  } catch {
    return redirectWithError('Invalid state parameter');
  }

  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!googleClientId || !googleClientSecret || !redirectUri) {
    return redirectWithError('Google OAuth not configured');
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    return redirectWithError(`Token exchange failed: ${body}`);
  }

  const tokens: GoogleTokenResponse = await tokenRes.json();

  if (!tokens.refresh_token) {
    return redirectWithError('No refresh_token received. Re-authorize with prompt=consent.');
  }

  // Save to Supabase
  const supabase = createServerClient();
  const { error: dbError } = await supabase
    .from('connector_credentials')
    .upsert(
      {
        client_id: state.clientId,
        connector_slug: 'google-analytics',
        api_key: tokens.refresh_token,
        extra_config: {
          property_id: state.propertyId,
          refresh_token: tokens.refresh_token,
        },
        is_connected: true,
        connected_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,connector_slug' }
    );

  if (dbError) {
    return redirectWithError(`Database error: ${dbError.message}`);
  }

  // Redirect back to client's connector page
  return NextResponse.redirect(
    new URL(`/clients/${state.clientId}/google-analytics`, request.url)
  );
}

function redirectWithError(message: string) {
  // In a real app we'd redirect to an error page; for now return JSON
  return NextResponse.json(
    { status: 'error', error: message },
    { status: 400 }
  );
}
