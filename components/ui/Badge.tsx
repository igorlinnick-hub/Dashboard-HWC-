'use client';

import type { ConnectorStatus } from '@/types';

interface BadgeProps {
  status: ConnectorStatus;
  label?: string;
}

const statusColors: Record<ConnectorStatus, string> = {
  connected: 'bg-green-100 text-green-800',
  disconnected: 'bg-gray-100 text-gray-600',
  error: 'bg-red-100 text-red-800',
  loading: 'bg-yellow-100 text-yellow-800',
};

export function Badge({ status, label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[status]}`}>
      {label ?? status}
    </span>
  );
}
