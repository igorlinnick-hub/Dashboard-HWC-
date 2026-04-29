import type { AdapterError } from '@/types';

export function classifySquareError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'Square API error';

  if (message.includes('401') || message.includes('unauthorized') || message.includes('UNAUTHORIZED')) {
    return { status: 'error', code: 'INVALID_KEY', error: message };
  }
  if (message.includes('timeout')) {
    return { status: 'error', code: 'CONNECTION_TIMEOUT', error: message };
  }
  if (message.includes('rate') || message.includes('429')) {
    return { status: 'error', code: 'RATE_LIMIT', error: message };
  }
  return { status: 'error', code: 'UNKNOWN', error: message };
}
