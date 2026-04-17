'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { ConnectorDefinition } from '@/types';
import { Button } from '@/components/ui/Button';

interface ConnectModalProps {
  connector: ConnectorDefinition;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectModal({ connector, clientId, onClose, onSuccess }: ConnectModalProps) {
  // Plaid Link flow for bank connector
  if (connector.authType === 'plaid') {
    return (
      <ModalShell title={`Connect ${connector.name}`} onClose={onClose}>
        <SetupGuide connector={connector} />
        <PlaidLinkFlow clientId={clientId} onClose={onClose} onSuccess={onSuccess} />
      </ModalShell>
    );
  }

  // Standard form flow for api_key / oauth connectors
  return (
    <ModalShell title={`Connect ${connector.name}`} onClose={onClose}>
      <SetupGuide connector={connector} />
      <CredentialForm connector={connector} clientId={clientId} onClose={onClose} onSuccess={onSuccess} />
    </ModalShell>
  );
}

/** Onboarding steps shown above the form/flow */
function SetupGuide({ connector }: { connector: ConnectorDefinition }) {
  if (!connector.setupSteps || connector.setupSteps.length === 0) return null;

  return (
    <div className="mb-5 rounded-xl border border-surface-border bg-surface-subtle/40 p-4 animate-fade-in">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-accent">
          How to connect
        </span>
        {connector.docsUrl && (
          <a
            href={connector.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-text-muted hover:text-accent transition-colors"
          >
            Open docs ↗
          </a>
        )}
      </div>
      <ol className="space-y-2">
        {connector.setupSteps.map((step, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-text-secondary animate-slide-up"
            style={{ animationDelay: `${80 + i * 60}ms`, animationFillMode: 'backwards' }}
          >
            <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-accent/15 text-[11px] font-bold text-accent">
              {i + 1}
            </span>
            <span className="leading-snug">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Shared modal chrome */
function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-2xl animate-slide-up">
        <div className="h-0.5 bg-gradient-to-r from-accent via-accent-hover to-accent" />
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary transition-colors"
            >
              &times;
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Plaid Link flow for bank connector */
function PlaidLinkFlow({ clientId, onClose, onSuccess }: { clientId: string; onClose: () => void; onSuccess: () => void }) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exchanging, setExchanging] = useState(false);

  // Fetch link token on mount
  useEffect(() => {
    fetch('/api/plaid/link-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'error') {
          setError(data.error);
        } else {
          setLinkToken(data.linkToken);
        }
      })
      .catch(() => setError('Failed to initialize Plaid Link'));
  }, [clientId]);

  const onPlaidSuccess = useCallback(
    async (publicToken: string) => {
      setExchanging(true);
      try {
        const res = await fetch('/api/plaid/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, publicToken }),
        });
        const data = await res.json();
        if (data.status === 'error') {
          setError(data.error);
          setExchanging(false);
        } else {
          onSuccess();
        }
      } catch {
        setError('Failed to connect bank account');
        setExchanging(false);
      }
    },
    [clientId, onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken) => onPlaidSuccess(publicToken),
    onExit: () => {
      // User closed Plaid Link without completing
    },
  });

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-muted">
        Connect your bank account securely through Plaid. Your credentials are never stored on our servers.
      </p>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!ready || exchanging}
          onClick={() => open()}
          className="flex-1 glow-orange-sm"
        >
          {exchanging ? 'Connecting...' : !linkToken ? 'Loading...' : 'Open Plaid Link'}
        </Button>
      </div>
    </div>
  );
}

/** Standard credential form for api_key and oauth connectors */
function CredentialForm({
  connector,
  clientId,
  onClose,
  onSuccess,
}: {
  connector: ConnectorDefinition;
  clientId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const storageKey = `connect_draft_${clientId}_${connector.slug}`;

  const [values, setValues] = useState<Record<string, string>>(() => {
    // Restore draft from sessionStorage if user navigated away mid-form
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Merge saved values with field defaults so new fields aren't missing
          return Object.fromEntries(
            connector.fields.map((f) => [f.key, parsed[f.key] || ''])
          );
        }
      } catch { /* ignore corrupt data */ }
    }
    return Object.fromEntries(connector.fields.map((f) => [f.key, '']));
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist draft to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch { /* storage full — ignore */ }
  }, [values, storageKey]);

  const inputClass =
    'block w-full rounded-lg border border-surface-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder-text-muted transition-all duration-200 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Google Analytics: redirect to OAuth flow
    if (connector.slug === 'google-analytics') {
      const propertyId = values['property_id'];
      if (!propertyId) {
        setError('Property ID is required');
        setLoading(false);
        return;
      }
      window.location.href = `/api/auth/google?clientId=${clientId}&propertyId=${encodeURIComponent(propertyId)}`;
      return;
    }

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
    // Clear draft — credentials saved successfully
    try { sessionStorage.removeItem(storageKey); } catch {}
    onSuccess();
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {connector.fields.map((field, i) => (
          <div
            key={field.key}
            className="animate-slide-up"
            style={{
              animationDelay: `${180 + i * 70}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-text-secondary">
                {field.label}
              </label>
              {field.docsUrl && (
                <a
                  href={field.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-text-muted hover:text-accent transition-colors"
                >
                  Where to find ↗
                </a>
              )}
            </div>
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
            {field.hint && (
              <p className="mt-1.5 text-xs leading-snug text-text-muted">{field.hint}</p>
            )}
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
    </>
  );
}
