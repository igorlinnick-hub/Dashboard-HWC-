import type { AdapterError } from '@/types';

export function classifyBankError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'Plaid API error';

  if (message.includes('INVALID_ACCESS_TOKEN') || message.includes('ITEM_LOGIN_REQUIRED')) {
    return { status: 'error', code: 'INVALID_KEY', error: message };
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return { status: 'error', code: 'CONNECTION_TIMEOUT', error: message };
  }
  if (message.includes('RATE_LIMIT')) {
    return { status: 'error', code: 'RATE_LIMIT', error: message };
  }
  return { status: 'error', code: 'UNKNOWN', error: message };
}
