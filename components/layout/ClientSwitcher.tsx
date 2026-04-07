'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { ChevronDown } from 'lucide-react';
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
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Client
      </label>
      <div className="relative">
        <select
          value={clientId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full appearance-none rounded-lg border border-surface-border bg-surface-card px-3 py-2 pr-8 text-sm font-medium text-text-primary transition-all duration-200 hover:border-surface-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="">All Clients</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
      </div>
    </div>
  );
}
