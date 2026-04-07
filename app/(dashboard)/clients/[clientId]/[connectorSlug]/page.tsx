'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { fetcher } from '@/lib/fetcher';
import { getConnector } from '@/lib/connectors/registry';
import { getConnectorIcon } from '@/lib/connectors/icons';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/charts/MetricCard';
import { LineChartWidget } from '@/components/charts/LineChartWidget';
import { CardSkeleton } from '@/components/ui/Skeleton';

// Which chart key and Y-axis to use per connector
const chartConfig: Record<string, { key: string; yKey: string; title: string }> = {
  bank: { key: 'chart', yKey: 'balance', title: 'Balance (30 days)' },
  stripe: { key: 'revenueChart', yKey: 'revenue', title: 'Revenue (7 days)' },
  square: { key: 'chart', yKey: 'sales', title: 'Daily Sales (30 days)' },
  meta: { key: 'chart', yKey: 'spend', title: 'Ad Spend (30 days)' },
  yelp: { key: 'chart', yKey: 'rating', title: 'Rating Trend (30 days)' },
  tiktok: { key: 'chart', yKey: 'spend', title: 'Ad Spend (30 days)' },
  'google-analytics': { key: 'chart', yKey: 'sessions', title: 'Sessions (30 days)' },
};

function formatMetricName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function formatMetricValue(key: string, value: unknown): string {
  if (typeof value !== 'number') return String(value);
  const k = key.toLowerCase();
  if (k.includes('revenue') || k.includes('spend') || k.includes('mrr') || k.includes('balance') || k.includes('sales') || k.includes('ticket') || k.includes('deposits') || k.includes('cashflow') || k.includes('cost')) {
    return `$${value.toLocaleString()}`;
  }
  if (k.includes('rate') || k.includes('ctr')) {
    return `${value}%`;
  }
  if (k.includes('duration')) {
    return `${Math.floor(value / 60)}m ${value % 60}s`;
  }
  return value.toLocaleString();
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function ConnectorDetailPage() {
  const params = useParams<{ clientId: string; connectorSlug: string }>();
  const { clientId, connectorSlug } = params;

  const connector = getConnector(connectorSlug);
  const title = connector?.name ?? connectorSlug;
  const Icon = getConnectorIcon(connectorSlug);
  const cfg = chartConfig[connectorSlug];

  const { data, isLoading } = useSWR(
    `/api/clients/${clientId}/connectors/${connectorSlug}/data`,
    fetcher
  );

  const metrics = data?.data ?? {};
  const metricEntries = Object.entries(metrics).filter(
    ([, v]) => typeof v === 'number'
  );
  const chartData = cfg
    ? ((metrics as Record<string, unknown>)[cfg.key] as Record<string, unknown>[] | undefined)
    : undefined;

  if (isLoading) {
    return (
      <PageWrapper title={title}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={title}>
      {/* Header with icon */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-muted">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-sm text-text-muted">{connector?.category}</p>
        </div>
      </div>

      {/* Metric cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {metricEntries.map(([key, value]) => (
          <motion.div key={key} variants={fadeUp}>
            <MetricCard
              title={formatMetricName(key)}
              value={formatMetricValue(key, value)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
      >
        {chartData && chartData.length > 0 && cfg ? (
          <LineChartWidget
            data={chartData}
            xKey="date"
            yKey={cfg.yKey}
            title={cfg.title}
          />
        ) : (
          <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
            <p className="text-sm text-text-muted">Chart data will appear once the connector is live.</p>
          </div>
        )}
      </motion.div>
    </PageWrapper>
  );
}
