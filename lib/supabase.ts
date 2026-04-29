import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/** Browser-side Supabase client for safe cookie handling */
export function createBrowserClient() {
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

/** Server-side Supabase client (used in API routes).
 *
 * Forces `cache: 'no-store'` on the underlying fetch so Next.js does not
 * memoize Supabase responses inside the data cache. Without this, every
 * server-side `supabase.from(...).select(...)` would be cached forever
 * (default revalidation is Infinity in Next.js 14), and any record updated
 * out-of-band — credential rotation, cache invalidation, etc. — keeps
 * showing the stale value until the function instance is recycled.
 */
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...(init ?? {}), cache: 'no-store' as RequestCache }),
    },
  });
}
