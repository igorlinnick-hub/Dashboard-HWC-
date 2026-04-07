'use client';

import type { ConnectorStatus } from '@/types';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  status?: ConnectorStatus;
}

export function MetricCard({ title, value, change }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5 transition-all duration-200 hover:border-surface-subtle">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
      {change !== undefined && (
        <p className={`mt-1 text-sm font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
