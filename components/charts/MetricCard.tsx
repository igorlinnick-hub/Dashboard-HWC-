'use client';

import { useCountUp } from '@/hooks/use-count-up';
import type { Metric } from '@/types';

interface MetricCardProps {
  metric?: Metric;
  isLoading?: boolean;
  /** Stagger delay in ms (e.g. index * 60) */
  delay?: number;
}

function formatValue(value: number, format: Metric['format']): string {
  switch (format) {
    case 'currency': return `$${value.toLocaleString()}`;
    case 'percent':  return `${value}%`;
    case 'duration': return `${Math.floor(value / 60)}m ${value % 60}s`;
    case 'rating':   return value.toFixed(1);
    default:         return value.toLocaleString();
  }
}

export function MetricCard({ metric, isLoading, delay = 0 }: MetricCardProps) {
  const animatedValue = useCountUp(metric?.value ?? 0);

  if (isLoading || !metric) {
    return (
      <div
        className="rounded-xl border border-surface-border bg-surface-card p-5 animate-pulse opacity-0 animate-fade-in"
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
      >
        <div className="h-4 w-24 rounded bg-surface-subtle" />
        <div className="mt-3 h-9 w-32 rounded bg-surface-subtle" />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-surface-border bg-surface-card p-5 transition-all duration-200 hover:border-accent/20 hover:shadow-[0_0_16px_rgba(249,115,22,0.08)] opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <p className="text-sm font-medium text-text-muted">{metric.label}</p>
      <p className="mt-2 text-4xl font-bold tabular-nums text-text-primary">
        {formatValue(animatedValue, metric.format)}
      </p>
    </div>
  );
}
