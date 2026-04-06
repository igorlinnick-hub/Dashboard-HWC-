'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { getConnector } from '@/lib/connectors/registry';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/charts/MetricCard';
import { LineChartWidget } from '@/components/charts/LineChartWidget';

export default function ConnectorDetailPage() {
  const params = useParams<{ clientId: string; connectorSlug: string }>();
  const { clientId, connectorSlug } = params;

  const connector = getConnector(connectorSlug);
  const title = connector?.name ?? connectorSlug;

  const { data, isLoading } = useSWR(
    `/api/clients/${clientId}/connectors/${connectorSlug}/data`,
    fetcher
  );

  const metrics = data?.data ?? {};
  const metricEntries = Object.entries(metrics);

  return (
    <PageWrapper title={title}>
      {isLoading ? (
        <p className="text-gray-500">Loading data...</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricEntries.map(([key, value]) => (
              <MetricCard
                key={key}
                title={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                value={String(value)}
                status="connected"
              />
            ))}
          </div>
          <LineChartWidget data={[]} xKey="date" yKey="value" title={`${title} — Trend`} />
        </>
      )}
    </PageWrapper>
  );
}
