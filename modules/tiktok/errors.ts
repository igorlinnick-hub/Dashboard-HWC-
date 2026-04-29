import type { AdapterError } from '@/types';

export function classifyTikTokError(err: unknown): AdapterError {
  const message = err instanceof Error ? err.message : 'TikTok API error';

  if (message.includes('401') || message.includes('unauthorized')) {
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
