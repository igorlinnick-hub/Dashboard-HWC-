'use client';

import { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getConnector } from '@/lib/connectors/registry';
import { getConnectorIcon } from '@/lib/connectors/icons';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/charts/MetricCard';
import { LineChartWidget } from '@/components/charts/LineChartWidget';
import { BarChartWidget } from '@/components/charts/BarChartWidget';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConnectorOnboarding } from '@/components/connectors/ConnectorOnboarding';
import { Button } from '@/components/ui/Button';
import type { ConnectorResponse, ConnectorErrorCode } from '@/types';

interface DataApiResponse {
  status: 'ok' | 'error';
  data: ConnectorResponse | null;
  lastUpdated?: string;
  error?: string;
  code?: ConnectorErrorCode;
  meta?: {
    clientId: string;
    connector: string;
    mock?: boolean;
    cached?: boolean;
    notConnected?: boolean;
    period: { from: string; to: string };
  };
}

export default function ConnectorDetailPage() {
  const params = useParams<{ clientId: string; connectorSlug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { clientId, connectorSlug } = params;
  const connector = getConnector(connectorSlug);
  const Icon = getConnectorIcon(connectorSlug);

  // Build API URL with period params
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const apiUrl = buildApiUrl(clientId, connectorSlug, from, to);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: response, error: fetchError, isLoading, mutate } = useSWR<DataApiResponse>(
    apiUrl,
    fetcher,
  );

  // Refresh handler — re-fetch with cache bypass
  async function handleRefresh() {
    setIsRefreshing(true);
    const refreshUrl = apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'refresh=true';
    await fetch(refreshUrl);
    await mutate();
    setIsRefreshing(false);
  }

  if (!connector) {
    return (
      <PageWrapper title="Connector">
        <ErrorState
          title="Unknown connector"
          description={`Connector "${connectorSlug}" is not registered.`}
          code="UNKNOWN"
        />
      </PageWrapper>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <PageWrapper title={connector.name}>
        <LoadingSkeleton />
      </PageWrapper>
    );
  }

  // Network error — show onboarding (user likely just hasn't connected yet)
  if (fetchError) {
    return (
      <PageWrapper title={connector.name}>
        <ConnectorOnboarding connector={connector} clientId={clientId} onConnected={() => mutate()} />
      </PageWrapper>
    );
  }

  // API returned error — anything that isn't transient gets routed to onboarding
  // so the user always has a path to reconnect with fresh credentials.
  if (response?.status === 'error') {
    const isTransient = response.code === 'RATE_LIMIT' || response.code === 'CONNECTION_TIMEOUT';
    if (!isTransient) {
      return (
        <PageWrapper title={connector.name}>
          <ConnectorOnboarding
            connector={connector}
            clientId={clientId}
            onConnected={() => mutate()}
            errorMessage={response.error}
          />
        </PageWrapper>
      );
    }
    return (
      <PageWrapper title={connector.name}>
        <ErrorState
          title={response.error}
          code={response.code ?? 'UNKNOWN'}
          onRetry={() => mutate()}
        />
      </PageWrapper>
    );
  }

  // Not connected
  if (response?.meta?.notConnected) {
    return (
      <PageWrapper title={connector.name}>
        <ConnectorOnboarding connector={connector} clientId={clientId} onConnected={() => mutate()} />
      </PageWrapper>
    );
  }

  const connectorData = response?.data;
  if (!connectorData) {
    return (
      <PageWrapper title={connector.name}>
        <ConnectorOnboarding connector={connector} clientId={clientId} onConnected={() => mutate()} />
      </PageWrapper>
    );
  }

  const { metrics, timeseries, breakdowns } = connectorData;

  // Split breakdowns by type for multi-chart rendering
  const methodBreakdown = breakdowns.filter(b => b.meta?.type === 'method' || !b.meta?.type);
  const hourBreakdown = breakdowns.filter(b => b.meta?.type === 'hour');

  return (
    <PageWrapper title={connector.name}>
      {/* Top bar: back button, connector info, refresh */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/clients/${clientId}`)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-text-muted transition-colors hover:border-surface-subtle hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-muted">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">{connector.name}</h3>
          </div>
          {response?.meta?.mock && (
            <span className="rounded bg-surface-subtle px-2 py-0.5 text-xs text-text-muted">
              Mock data
            </span>
          )}
          {response?.meta?.cached && (
            <span className="rounded bg-surface-subtle px-2 py-0.5 text-xs text-text-muted">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {response?.lastUpdated && (
            <span className="text-xs text-text-muted">
              Updated {formatTimestamp(response.lastUpdated)}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Metrics grid */}
      {metrics.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {metrics.map((metric, i) => (
            <MetricCard key={metric.key} metric={metric} delay={i * 60} />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {timeseries.length > 0 && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[400px]">
              <LineChartWidget
                data={timeseries}
                xKey="date"
                yKey="value"
                title="Trend"
              />
            </div>
          </div>
        )}
        {methodBreakdown.length > 0 && (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[400px]">
              <BarChartWidget
                data={methodBreakdown.map((b) => ({ label: b.label, value: b.value }))}
                xKey="label"
                yKey="value"
                title="Payment Methods"
              />
            </div>
          </div>
        )}
        {hourBreakdown.length > 0 && (
          <div className="lg:col-span-2 overflow-x-auto pb-2">
            <div className="min-w-[400px]">
              <BarChartWidget
                data={hourBreakdown.map((b) => ({ label: b.label, value: b.value }))}
                xKey="label"
                yKey="value"
                title="Busiest Hours"
              />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

/** Build the data API URL with optional period params */
function buildApiUrl(clientId: string, slug: string, from: string | null, to: string | null): string {
  const base = `/api/clients/${clientId}/connectors/${slug}/data`;
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Format ISO timestamp to relative or short format */
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Skeleton placeholders for loading state */
function LoadingSkeleton() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <MetricCard key={i} isLoading delay={i * 60} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <Skeleton className="mb-4 h-4 w-16" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <div className="rounded-xl border border-surface-border bg-surface-card p-5">
          <Skeleton className="mb-4 h-4 w-20" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </>
  );
}
