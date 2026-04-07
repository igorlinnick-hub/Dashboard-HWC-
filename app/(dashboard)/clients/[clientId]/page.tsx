'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { getConnectorIcon } from '@/lib/connectors/icons';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ConnectModal } from '@/components/connectors/ConnectModal';
import type { ClientConnector, ConnectorDefinition, ConnectorCategory } from '@/types';

const categoryLabels: Record<ConnectorCategory, string> = {
  finance: 'Finance',
  ads: 'Advertising',
  reviews: 'Reviews',
  analytics: 'Analytics',
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
};

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
  const disconnected = connectors.filter((c) => !c.isConnected);

  const grouped = connectors.reduce<Record<string, ClientConnector[]>>((acc, c) => {
    const cat = c.definition.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <PageWrapper title="Client Overview">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
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
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
            >
              {group.map((c) => {
                const Icon = getConnectorIcon(c.definition.slug);
                return (
                  <motion.div key={c.definition.slug} variants={fadeUp}>
                    <Card className={`${c.isConnected ? 'border-accent/20' : 'hover:border-surface-subtle'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            c.isConnected ? 'bg-accent-muted' : 'bg-surface-subtle'
                          }`}>
                            <Icon className={`h-5 w-5 ${c.isConnected ? 'text-accent' : 'text-text-muted'}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-text-primary">{c.definition.name}</h4>
                            <p className="text-xs text-text-muted">{c.definition.authType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.isConnected && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <Badge status={c.isConnected ? 'connected' : 'disconnected'} />
                        </div>
                      </div>
                      <div className="mt-4">
                        {c.isConnected ? (
                          <Link href={`/clients/${clientId}/${c.definition.slug}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              View Data
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full border border-surface-border text-text-muted hover:border-accent/50 hover:text-accent"
                            onClick={() => setConnectingDef(c.definition)}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        );
      })}

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
