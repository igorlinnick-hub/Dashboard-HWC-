'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Client } from '@/types';

export default function AgencyOverviewPage() {
  const { data, isLoading } = useSWR<{ data: Client[] }>('/api/clients', fetcher);
  const clients = data?.data ?? [];

  return (
    <PageWrapper title="Agency Overview">
      {isLoading ? (
        <p className="text-gray-500">Loading clients...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

function ClientCard({ client }: { client: Client }) {
  const { data } = useSWR(
    `/api/clients/${client.id}/connectors`,
    fetcher
  );

  const connectors = data?.data ?? [];
  const connectedCount = connectors.filter(
    (c: { isConnected: boolean }) => c.isConnected
  ).length;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="cursor-pointer transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
            {client.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{client.name}</h3>
            <p className="text-sm text-gray-500">
              {connectedCount} / {connectors.length} connectors
            </p>
          </div>
          <Badge status={client.isActive ? 'connected' : 'disconnected'} label={client.isActive ? 'Active' : 'Inactive'} />
        </div>
      </Card>
    </Link>
  );
}
