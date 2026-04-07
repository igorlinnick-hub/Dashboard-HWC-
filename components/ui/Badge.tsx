'use client';

import type { ConnectorStatus } from '@/types';

interface BadgeProps {
  status: ConnectorStatus;
  label?: string;
}

const statusColors: Record<ConnectorStatus, string> = {
  connected: 'bg-accent-muted text-accent',
  disconnected: 'bg-surface-subtle text-text-muted',
  error: 'bg-red-500/10 text-red-400',
  loading: 'bg-yellow-500/10 text-yellow-400',
};

export function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {status === 'connected' && (
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
      {label ?? status}
    </span>
  );
}
