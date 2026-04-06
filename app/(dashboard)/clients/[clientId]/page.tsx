'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/charts/MetricCard';
import { ConnectorCard } from '@/components/connectors/ConnectorCard';
import { ConnectModal } from '@/components/connectors/ConnectModal';
import type { ClientConnector, ConnectorDefinition } from '@/types';

export default function ClientOverviewPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const [connectingDef, setConnectingDef] = useState<ConnectorDefinition | null>(null);

  const { data, isLoading, mutate } = useSWR<{ data: ClientConnector[] }>(
    `/api/clients/${clientId}/connectors`,
    fetcher
  );

  const connectors = data?.data ?? [];
  const connected = connectors.filter((c) => c.isConnected);

  return (
    <PageWrapper title="Client Overview">
      {isLoading ? (
        <p className="text-gray-500">Loading connectors...</p>
      ) : (
        <>
          {/* Metric cards for connected connectors */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {connected.map((c) => (
              <MetricCard
                key={c.definition.slug}
                title={c.definition.name}
                value="—"
                status="connected"
              />
            ))}
            {connected.length === 0 && (
              <p className="text-gray-500 col-span-full">No connectors connected yet.</p>
            )}
          </div>

          {/* All connector cards */}
          <h3 className="mb-4 text-lg font-semibold">Data Sources</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectors.map((c) => (
              <ConnectorCard
                key={c.definition.slug}
                name={c.definition.name}
                status={c.isConnected ? 'connected' : 'disconnected'}
                lastSync={c.connectedAt}
                onConnect={() => setConnectingDef(c.definition)}
              />
            ))}
          </div>
        </>
      )}

      {connectingDef && (
        <ConnectModal
          connector={connectingDef}
          clientId={clientId}
          onClose={() => setConnectingDef(null)}
          onSuccess={() => {
            setConnectingDef(null);
            mutate();
          }}
        />
      )}
    </PageWrapper>
  );
}
