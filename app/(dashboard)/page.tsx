'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { Client } from '@/types';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function AgencyOverviewPage() {
  const { data, isLoading, mutate } = useSWR<{ data: Client[] }>('/api/clients', fetcher);
  const clients = data?.data ?? [];
  const [showModal, setShowModal] = useState(false);

  return (
    <PageWrapper title="Agency Overview">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-text-muted">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Client
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : clients.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <p className="text-base font-medium text-text-primary">No clients yet</p>
            <p className="mt-1 text-sm text-text-muted">Click &quot;New Client&quot; to add your first clinic.</p>
          </div>
        </Card>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {clients.map((client) => (
            <motion.div key={client.id} variants={fadeUp}>
              <ClientCard client={client} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            mutate();
          }}
        />
      )}
    </PageWrapper>
  );
}

function ClientCard({ client }: { client: Client }) {
  const { data } = useSWR(`/api/clients/${client.id}/connectors`, fetcher);

  const connectors = data?.data ?? [];
  const connectedCount = connectors.filter(
    (c: { isConnected: boolean }) => c.isConnected
  ).length;
  const totalCount = connectors.length;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="cursor-pointer hover:border-accent/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.08)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-orange-600 text-lg font-bold text-white shadow-sm">
              {client.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">{client.name}</h3>
              <p className="text-xs text-text-muted">{client.slug}</p>
            </div>
          </div>
          <Badge
            status={client.isActive ? 'connected' : 'disconnected'}
            label={client.isActive ? 'Active' : 'Inactive'}
          />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold text-text-primary">{connectedCount}</p>
            <p className="text-xs text-text-muted">of {totalCount} connected</p>
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-full rounded-full bg-surface-subtle">
              <div
                className="h-1.5 rounded-full bg-accent transition-all duration-500"
                style={{ width: totalCount > 0 ? `${(connectedCount / totalCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function NewClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generateSlug(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  function handleNameChange(value: string) {
    setName(value);
    setSlug(generateSlug(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    });

    const json = await res.json();

    if (json.status === 'error') {
      setError(json.error);
      setLoading(false);
      return;
    }

    onCreated();
  }

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl"
      >
        <div className="h-0.5 bg-gradient-to-r from-accent via-accent-hover to-accent" />
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">New Client</h2>
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
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="Aloha Spa & Recovery"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className={`${inputClass} bg-surface-card`}
                placeholder="aloha-spa-recovery"
                required
              />
              <p className="mt-1 text-xs text-text-muted">Auto-generated from name. Edit if needed.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Client'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
