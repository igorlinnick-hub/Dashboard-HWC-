// Classify Stripe SDK / fetch errors into ConnectorErrorCode.
// Pure: takes an error, returns an AdapterError. No side effects.

import type { AdapterError } from '@/types';

export function classifyStripeError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'Stripe API error';

  if (message.includes('Invalid API Key') || message.includes('authentication')) {
    return { status: 'error', code: 'INVALID_KEY', error: message };
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return { status: 'error', code: 'CONNECTION_TIMEOUT', error: message };
  }
  if (message.includes('rate') || message.includes('Too many')) {
    return { status: 'error', code: 'RATE_LIMIT', error: message };
  }
  return { status: 'error', code: 'UNKNOWN', error: message };
}
