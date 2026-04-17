'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { Check } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { getConnectorIcon } from '@/lib/connectors/icons';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { ConnectModal } from '@/components/connectors/ConnectModal';
import { ConnectorCard } from '@/components/connectors/ConnectorCard';
import { MetricCard } from '@/components/charts/MetricCard';
import type { ClientConnector, ConnectorDefinition, ConnectorCategory } from '@/types';

const categoryLabels: Record<ConnectorCategory, string> = {
  finance: 'Finance',
  ads: 'Advertising',
  reviews: 'Reviews',
  analytics: 'Analytics',
};

export default function ClientOverviewPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const [connectingDef, setConnectingDef] = useState<ConnectorDefinition | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState<ConnectorDefinition | null>(null);
  const { toast } = useToast();

  const { data, isLoading, mutate } = useSWR<{ data: ClientConnector[] }>(
    `/api/clients/${clientId}/connectors`,
    fetcher
  );

  const connectors = data?.data ?? [];
  const connected = connectors.filter((c) => c.isConnected);
  const disconnected = connectors.filter((c) => !c.isConnected);

  const grouped = connectors.reduce<Record<string, ClientConnector[]>>((acc, c) => {
    const cat = c.definition.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  const handleReconnect = useCallback(async (def: ConnectorDefinition) => {
    // Reconnect using saved credentials — no need to re-enter keys
    const res = await fetch(
      `/api/clients/${clientId}/connectors/${def.slug}/connect`,
      { method: 'PATCH' }
    );

    if (res.ok) {
      toast(`${def.name} reconnected`, 'success');
    } else {
      toast(`Failed to reconnect ${def.name}`, 'error');
    }
    mutate();
  }, [clientId, mutate, toast]);

  const handleDisconnect = useCallback(async (def: ConnectorDefinition) => {
    // Optimistic update
    mutate(
      (current) => {
        if (!current) return current;
        return {
          ...current,
          data: current.data.map((c) =>
            c.definition.slug === def.slug
              ? { ...c, isConnected: false, connectedAt: null }
              : c
          ),
        };
      },
      false
    );
    setConfirmDisconnect(null);

    const res = await fetch(
      `/api/clients/${clientId}/connectors/${def.slug}/connect`,
      { method: 'DELETE' }
    );

    if (res.ok) {
      toast(`${def.name} disconnected`, 'success');
    } else {
      toast(`Failed to disconnect ${def.name}`, 'error');
    }

    mutate();
  }, [clientId, mutate]);

  if (isLoading) {
    return (
      <PageWrapper title="Client Overview">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCard key={i} isLoading />
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Client Overview">
      {/* Summary bar */}
      <div className="mb-6 flex items-center gap-6 rounded-xl border border-surface-border bg-surface-card px-6 py-4">
        <div>
          <p className="text-sm text-text-muted">Connected</p>
          <p className="text-2xl font-bold text-accent">{connected.length}</p>
        </div>
        <div className="h-10 w-px bg-surface-border" />
        <div>
          <p className="text-sm text-text-muted">Disconnected</p>
          <p className="text-2xl font-bold text-text-muted">{disconnected.length}</p>
        </div>
        <div className="h-10 w-px bg-surface-border" />
        <div>
          <p className="text-sm text-text-muted">Total</p>
          <p className="text-2xl font-bold text-text-primary">{connectors.length}</p>
        </div>
      </div>

      {/* Connectors by category */}
      {(Object.keys(categoryLabels) as ConnectorCategory[]).map((cat) => {
        const group = grouped[cat];
        if (!group || group.length === 0) return null;
        return (
          <div key={cat} className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {categoryLabels[cat]}
            </h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {group.map((c, i) => {
                const Icon = getConnectorIcon(c.definition.slug);
                return (
                  <div key={c.definition.slug} className="animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                    <ConnectorCard
                      name={c.definition.name}
                      slug={c.definition.slug}
                      status={c.isConnected ? 'connected' : 'disconnected'}
                      lastSync={c.connectedAt ? new Date(c.connectedAt).toLocaleDateString() : null}
                      hasSavedCredentials={c.hasSavedCredentials}
                      onConnect={() => setConnectingDef(c.definition)}
                      onReconnect={() => handleReconnect(c.definition)}
                      onDisconnect={() => setConfirmDisconnect(c.definition)}
                    />
                    {c.isConnected && (
                      <div className="mt-2 text-right">
                        <Link href={`/clients/${clientId}/${c.definition.slug}`}>
                          <Button variant="outline" size="xs" className="text-[10px] h-6 px-2">
                            View Data
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Connect modal */}
      {connectingDef && (
        <ConnectModal
          connector={connectingDef}
          clientId={clientId}
          onClose={() => setConnectingDef(null)}
          onSuccess={() => {
            setConnectingDef(null);
            toast(`${connectingDef.name} connected`, 'success');
            mutate();
          }}
        />
      )}

      {/* Confirm disconnect dialog */}
      {confirmDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-text-primary">
              Disconnect {confirmDisconnect.name}?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              This will remove saved credentials. You can reconnect later.
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmDisconnect(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => handleDisconnect(confirmDisconnect)}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}
