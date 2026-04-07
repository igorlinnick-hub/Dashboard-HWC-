'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ConnectorDefinition } from '@/types';
import { Button } from '@/components/ui/Button';

interface ConnectModalProps {
  connector: ConnectorDefinition;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectModal({ connector, clientId, onClose, onSuccess }: ConnectModalProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(connector.fields.map((f) => [f.key, '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(
      `/api/clients/${clientId}/connectors/${connector.slug}/connect`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentials: values }),
      }
    );

    const json = await res.json();

    if (json.status === 'error') {
      setError(json.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  }

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl"
      >
        <div className="h-0.5 bg-gradient-to-r from-accent via-accent-hover to-accent" />
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Connect {connector.name}</h2>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
            >
              &times;
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {connector.fields.map((field) => (
              <div key={field.key}>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">
                  {field.label}
                </label>
                <input
                  type={field.secret ? 'password' : 'text'}
                  placeholder={field.placeholder}
                  value={values[field.key]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className={inputClass}
                  required
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 glow-orange-sm">
                {loading ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
