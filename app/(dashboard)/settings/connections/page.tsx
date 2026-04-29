'use client';

import { useState, useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { useSelectedClient } from '@/components/layout/ClientSwitcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { ConnectorCard } from '@/components/connectors/ConnectorCard';
import { ConnectModal } from '@/components/connectors/ConnectModal';
import { useToast } from '@/hooks/use-toast';
import { CONNECTORS } from '@/lib/connectors/registry';
import type { ClientConnector, ConnectorDefinition } from '@/types';

export default function ConnectionSettingsPage() {
  const { clientId } = useSelectedClient();
  const modalStorageKey = `connecting_slug_${clientId}`;

  const [connectingDef, setConnectingDef] = useState<ConnectorDefinition | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const slug = sessionStorage.getItem(modalStorageKey);
        if (slug) return CONNECTORS.find((c) => c.slug === slug) ?? null;
      } catch {}
    }
    return null;
  });
  const { toast } = useToast();

  useEffect(() => {
    try {
      if (connectingDef) {
        sessionStorage.setItem(modalStorageKey, connectingDef.slug);
      } else {
        sessionStorage.removeItem(modalStorageKey);
      }
    } catch {}
  }, [connectingDef, modalStorageKey]);

  const { data, isLoading, mutate } = useSWR<{ data: ClientConnector[] }>(
    clientId ? `/api/clients/${clientId}/connectors` : null,
    fetcher
  );

  const connectors = data?.data ?? [];

  const handleReconnect = useCallback(async (def: ConnectorDefinition) => {
    if (!clientId) return;
    const res = await fetch(
      `/api/clients/${clientId}/connectors/${def.slug}/connect`,
      { method: 'PATCH' }
    );
    const json = await res.json().catch(() => ({}));

    if (res.ok) {
      toast(`${def.name} reconnected`, 'success');
      mutate();
      return;
    }

    // Saved creds rejected by the upstream API — open the Connect form so
    // the admin can paste a fresh value without having to disconnect first.
    if (json?.code === 'INVALID_KEY') {
      toast(`${def.name} credentials need updating`, 'error');
      setConnectingDef(def);
      mutate();
      return;
    }

    toast(json?.error || `Failed to reconnect ${def.name}`, 'error');
    mutate();
  }, [clientId, mutate, toast]);

  // Build a lookup of connected status from API
  const statusMap = new Map(
    connectors.map((c) => [c.definition.slug, c])
  );

  if (!clientId) {
    return (
      <PageWrapper title="Connection Settings">
        <p className="text-gray-500">Select a client from the sidebar to manage connections.</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Connection Settings">
      {isLoading ? (
        <p className="text-gray-500">Loading connectors...</p>
      ) : (
        <div className="space-y-6">
          {(['finance', 'ads', 'reviews', 'analytics'] as const).map((category) => {
            const group = CONNECTORS.filter((c) => c.category === category);
            if (group.length === 0) return null;
            return (
              <div key={category}>
                <h3 className="mb-3 text-sm font-semibold uppercase text-gray-400">
                  {category}
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {group.map((def) => {
                    const info = statusMap.get(def.slug);
                    const isConnected = info?.isConnected ?? false;
                    return (
                      <ConnectorCard
                        key={def.slug}
                        name={def.name}
                        status={isConnected ? 'connected' : 'disconnected'}
                        lastSync={info?.connectedAt ?? null}
                        hasSavedCredentials={info?.hasSavedCredentials ?? false}
                        onConnect={() => setConnectingDef(def)}
                        onReconnect={() => handleReconnect(def)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {connectingDef && clientId && (
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
