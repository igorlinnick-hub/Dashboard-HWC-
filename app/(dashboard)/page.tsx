'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { Client } from '@/types';

interface OverviewItem {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  revenue: number;
  adSpend: number;
  yelpRating: number;
  sessions: number;
  connectedCount: number;
  totalConnectors: number;
}

function generateSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const inputClass =
  'block w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200';

type SortConfig = { key: keyof OverviewItem; direction: 'asc' | 'desc' } | null;

export default function AgencyOverviewPage() {
  const router = useRouter();
  const { data, isLoading, mutate } = useSWR<{ data: OverviewItem[] }>('/api/agency/overview', fetcher);
  const items = data?.data ?? [];
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingClient, setEditingClient] = useState<OverviewItem | null>(null);
  const [deletingClient, setDeletingClient] = useState<OverviewItem | null>(null);
  const { toast } = useToast();
  const [sort, setSort] = useState<SortConfig>(null);

  const handleSort = (key: keyof OverviewItem) => {
    setSort(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sort) return 0;
    const { key, direction } = sort;
    const valA = a[key];
    const valB = b[key];
    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDelete = useCallback(async (client: OverviewItem) => {
    mutate(
      (current) => {
        if (!current) return current;
        return { ...current, data: current.data.filter((c) => c.id !== client.id) };
      },
      false
    );
    setDeletingClient(null);

    const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast(`${client.name} deleted`, 'success');
    } else {
      toast('Failed to delete client', 'error');
    }
    mutate();
  }, [mutate]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <PageWrapper title="Agency Overview">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-text-muted">{items.length} client{items.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Client
        </Button>
      </div>

      <Card className="overflow-hidden border-surface-border bg-surface-card p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface/50">
                <SortableHeader label="Client" sortKey="name" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Revenue" sortKey="revenue" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Ad Spend" sortKey="adSpend" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Yelp" sortKey="yelpRating" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Sessions" sortKey="sessions" currentSort={sort} onSort={handleSort} />
                <SortableHeader label="Connect" sortKey="connectedCount" currentSort={sort} onSort={handleSort} />
                <th className="px-6 py-4 font-semibold text-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : sortedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No clients yet. Click &quot;New Client&quot; to get started.
                  </td>
                </tr>
              ) : (
                sortedItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className="group transition-colors hover:bg-surface/30 cursor-pointer"
                    onClick={() => router.push(`/clients/${item.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-orange-600 font-bold text-white shadow-sm">
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{item.name}</div>
                          <div className="text-[10px] text-text-muted uppercase tracking-wider">{item.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary">{formatCurrency(item.revenue)}</td>
                    <td className="px-6 py-4 text-text-muted">{formatCurrency(item.adSpend)}</td>
                    <td className="px-6 py-4">
                      {item.yelpRating > 0 ? (
                        <div className="flex items-center gap-1.5 font-medium text-text-primary">
                          <span className="text-orange-400">★</span>
                          {item.yelpRating.toFixed(1)}
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{item.sessions.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-surface-subtle overflow-hidden">
                          <div 
                            className="h-full bg-accent transition-all duration-500" 
                            style={{ width: `${(item.connectedCount / item.totalConnectors) * 100}%` }} 
                          />
                        </div>
                        <span className="text-xs font-medium text-text-primary">
                          {item.connectedCount}/{item.totalConnectors}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingClient(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingClient(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create modal */}
      {showCreate && (
        <ClientFormModal
          title="New Client"
          submitLabel="Create Client"
          onClose={() => setShowCreate(false)}
          onSubmit={async (name, slug) => {
            const res = await fetch('/api/clients', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, slug }),
            });
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.error);
            setShowCreate(false);
            toast(`${name} created`, 'success');
            mutate();
          }}
        />
      )}

      {/* Edit modal */}
      {editingClient && (
        <ClientFormModal
          title="Edit Client"
          submitLabel="Save Changes"
          initialName={editingClient.name}
          initialSlug={editingClient.slug}
          onClose={() => setEditingClient(null)}
          onSubmit={async (name, slug) => {
            const res = await fetch(`/api/clients/${editingClient.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, slug }),
            });
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.error);
            setEditingClient(null);
            toast(`${name} updated`, 'success');
            mutate();
          }}
        />
      )}

      {/* Delete confirm */}
      {deletingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-surface-border bg-surface-card p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-bold text-text-primary">
              Delete {deletingClient.name}?
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              This cannot be undone. The client will be removed from your dashboard.
            </p>
            <div className="mt-5 flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeletingClient(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => handleDelete(deletingClient)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </PageWrapper>
  );
}

function SortableHeader({ label, sortKey, currentSort, onSort }: { 
  label: string; 
  sortKey: keyof OverviewItem; 
  currentSort: SortConfig;
  onSort: (key: keyof OverviewItem) => void;
}) {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className="px-6 py-4 font-semibold text-text-secondary cursor-pointer select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
        {label}
        <div className="flex flex-col">
          <ChevronUp className={`h-2.5 w-2.5 -mb-1 ${isActive && currentSort.direction === 'asc' ? 'text-accent' : 'text-text-muted'}`} />
          <ChevronDown className={`h-2.5 w-2.5 ${isActive && currentSort.direction === 'desc' ? 'text-accent' : 'text-text-muted'}`} />
        </div>
      </div>
    </th>
  );
}

// ── Shared Client Form Modal (Create + Edit) ─────────────

interface ClientFormModalProps {
  title: string;
  submitLabel: string;
  initialName?: string;
  initialSlug?: string;
  onClose: () => void;
  onSubmit: (name: string, slug: string) => Promise<void>;
}

function ClientFormModal({ title, submitLabel, initialName = '', initialSlug = '', onClose, onSubmit }: ClientFormModalProps) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!initialName) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(name, slug);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl animate-slide-up">
        <div className="h-0.5 bg-gradient-to-r from-accent via-accent-hover to-accent" />
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none transition-colors">
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Clinic Name</label>
              <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} className={inputClass} placeholder="Aloha Spa & Recovery" required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Slug</label>
              <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className={`${inputClass} bg-surface-card`} placeholder="aloha-spa-recovery" required />
              <p className="mt-1 text-xs text-text-muted">URL-friendly identifier.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Saving...' : submitLabel}</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
