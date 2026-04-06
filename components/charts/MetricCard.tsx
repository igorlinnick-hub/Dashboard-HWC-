'use client';

import type { ConnectorStatus } from '@/types';
import { Badge } from '@/components/ui/Badge';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  status?: ConnectorStatus;
}

export function MetricCard({ title, value, change, status }: MetricCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {status && <Badge status={status} />}
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {change !== undefined && (
        <p className={`mt-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </p>
      )}
    </div>
  );
}
