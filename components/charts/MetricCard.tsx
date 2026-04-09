'use client';

import type { Metric } from '@/types';

interface MetricCardProps {
  metric?: Metric;
  isLoading?: boolean;
}

function formatValue(value: number, format: Metric['format']): string {
  switch (format) {
    case 'currency':
      return `$${value.toLocaleString()}`;
    case 'percent':
      return `${value}%`;
    case 'duration':
      return `${Math.floor(value / 60)}m ${value % 60}s`;
    case 'rating':
      return value.toFixed(1);
    default:
      return value.toLocaleString();
  }
}

export function MetricCard({ metric, isLoading }: MetricCardProps) {
  if (isLoading || !metric) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface-card p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-surface-subtle" />
        <div className="mt-3 h-8 w-32 rounded bg-surface-subtle" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-surface-border bg-surface-card p-5 transition-all duration-200 hover:border-surface-subtle">
      <p className="text-sm font-medium text-text-muted">{metric.label}</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">
        {formatValue(metric.value, metric.format)}
      </p>
    </div>
  );
}
