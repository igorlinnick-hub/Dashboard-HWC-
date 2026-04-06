'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import type { Client } from '@/types';

const STORAGE_KEY = 'selectedClientId';

export function useSelectedClient() {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    setClientId(localStorage.getItem(STORAGE_KEY));
  }, []);

  function selectClient(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setClientId(id);
  }

  return { clientId, selectClient };
}

interface ClientSwitcherProps {
  clientId: string | null;
  onSelect: (id: string) => void;
}

export function ClientSwitcher({ clientId, onSelect }: ClientSwitcherProps) {
  const { data } = useSWR<{ data: Client[] }>('/api/clients', fetcher);
  const clients = data?.data ?? [];

  return (
    <div className="px-3 py-2">
      <label className="mb-1 block text-xs font-medium text-gray-500">Client</label>
      <select
        value={clientId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-md border bg-white px-2 py-1.5 text-sm"
      >
        <option value="">All Clients</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
