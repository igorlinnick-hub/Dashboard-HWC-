import type { AdapterError } from '@/types';

export function classifyMetaError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'Meta API error';

  // Auth, expired token, missing permission — all treated as INVALID_KEY so
  // the UI offers a reconnect path instead of a dead-end error screen.
  if (
    message.includes('401') ||
    message.includes('unauthorized') ||
    message.includes('(#200)') ||
    message.includes('(#10)') ||
    message.includes('(#190)') ||
    message.toLowerCase().includes('permission') ||
    message.toLowerCase().includes('not grant') ||
    message.toLowerCase().includes('expired')
  ) {
    return { status: 'error', code: 'INVALID_KEY', error: message };
  }
  if (message.includes('timeout')) {
    return { status: 'error', code: 'CONNECTION_TIMEOUT', error: message };
  }
  if (message.includes('429')) {
    return { status: 'error', code: 'RATE_LIMIT', error: message };
  }
  return { status: 'error', code: 'UNKNOWN', error: message };
}
