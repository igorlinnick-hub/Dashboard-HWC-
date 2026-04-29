import type { AdapterError } from '@/types';

export function classifyGAError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'Google Analytics API error';

  if (message.includes('401') || message.includes('403') || message.includes('token refresh failed')) {
    return { status: 'error', code: 'INVALID_KEY', error: message };
  }
  if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
    return { status: 'error', code: 'CONNECTION_TIMEOUT', error: message };
  }
  if (message.includes('429') || message.includes('rate') || message.includes('quota')) {
    return { status: 'error', code: 'RATE_LIMIT', error: message };
  }
  return { status: 'error', code: 'UNKNOWN', error: message };
}
