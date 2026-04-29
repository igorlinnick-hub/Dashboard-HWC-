// Pure adapter: creds + period in → ConnectorResponse | AdapterError out.
// Knows Stripe API only. No supabase, no cache, no HTTP plumbing.

import type { ConnectorAdapter } from '@/types';
import { fetchData } from './fetcher';
import { transformData } from './transformer';
import { classifyStripeError } from './errors';

export const stripeAdapter: ConnectorAdapter = async ({ creds, period }) => {
  if (!creds.api_key) {
    return { status: 'error', code: 'NOT_CONNECTED', error: 'Stripe credentials missing api_key' };
  }
  try {
    const raw = await fetchData(creds.api_key, period.from, period.to);
    return { status: 'ok', data: transformData(raw) };
  } catch (err) {
    return classifyStripeError(err);
  }
};
