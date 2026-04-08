'use client';

import { Cable } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  connectorName: string;
  onConnect: () => void;
}

export function EmptyState({ connectorName, onConnect }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-surface-card py-16 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-muted">
        <Cable className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">Connect {connectorName}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-text-muted">
        Connect {connectorName} to see your data here. Your credentials are stored securely.
      </p>
      <Button size="sm" className="mt-5" onClick={onConnect}>
        Connect {connectorName}
      </Button>
    </div>
  );
}
