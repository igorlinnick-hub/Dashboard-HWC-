'use client';

import { AlertTriangle, KeyRound, Clock, ShieldAlert, RefreshCw } from 'lucide-react';
import { Button } from './Button';
import type { ConnectorErrorCode } from '@/types';

const errorConfig: Record<ConnectorErrorCode, { icon: typeof AlertTriangle; title: string; description: string }> = {
  INVALID_KEY: {
    icon: KeyRound,
    title: 'Invalid API Key',
    description: 'The saved credentials are invalid or expired. Please disconnect and reconnect with a valid key.',
  },
  CONNECTION_TIMEOUT: {
    icon: Clock,
    title: 'Connection Timeout',
    description: 'Could not reach the external API. This may be a temporary issue — try again in a moment.',
  },
  RATE_LIMIT: {
    icon: ShieldAlert,
    title: 'Rate Limit Exceeded',
    description: 'Too many requests to the API. Please wait a few minutes before retrying.',
  },
  NOT_CONNECTED: {
    icon: AlertTriangle,
    title: 'Not Connected',
    description: 'This connector has no saved credentials. Connect it to start pulling data.',
  },
  UNKNOWN: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    description: 'An unexpected error occurred while fetching data.',
  },
};

interface ErrorStateProps {
  title?: string;
  description?: string;
  code?: ConnectorErrorCode;
  onRetry?: () => void;
}

export function ErrorState({ title, description, code = 'UNKNOWN', onRetry }: ErrorStateProps) {
  const config = errorConfig[code];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <Icon className="h-6 w-6 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title ?? config.title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-text-muted">{description ?? config.description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
