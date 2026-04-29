import { NextResponse } from 'next/server';
import { runConnector } from '@/lib/connectors/orchestrator';

export const dynamic = 'force-dynamic';
// `dynamic` only opts the route handler out of static rendering. Next.js still
// caches every fetch() inside the handler with cache:'force-cache' by default,
// which means Supabase selects (creds, cached_data) get memoised forever and
// out-of-band updates never become visible. force-no-store opts every fetch
// in this handler — including Supabase JS — out of the data cache.
export const fetchCache = 'force-no-store';

interface RouteParams {
  params: { clientId: string; slug: string };
}

/** Default period: last 30 days (YYYY-MM-DD inclusive) */
function defaultPeriod(): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - 30);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
}

export async function GET(request: Request, { params }: RouteParams) {
  const url = new URL(request.url);
  const defaults = defaultPeriod();
  const from = url.searchParams.get('from') ?? defaults.from;
  const to = url.searchParams.get('to') ?? defaults.to;
  const refresh = url.searchParams.get('refresh') === 'true';

  const result = await runConnector({
    clientId: params.clientId,
    slug: params.slug,
    period: { from, to },
    refresh,
  });

  // HTTP status mapping:
  //   ok               → 200
  //   error UNKNOWN    → 404 (slug not registered or no adapter)
  //   error otherwise  → 502 (upstream/auth/rate-limit)
  const httpStatus =
    result.status === 'ok' ? 200 : result.code === 'UNKNOWN' ? 404 : 502;

  return NextResponse.json(result, { status: httpStatus });
}
