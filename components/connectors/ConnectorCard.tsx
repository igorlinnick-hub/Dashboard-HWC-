'use client';

import type { ConnectorStatus } from '@/types';
import { getConnectorIcon } from '@/lib/connectors/icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ConnectorCardProps {
  name: string;
  slug?: string;
  status: ConnectorStatus;
  lastSync: string | null;
  onConnect?: () => void;
}

export function ConnectorCard({ name, slug, status, lastSync, onConnect }: ConnectorCardProps) {
  const Icon = slug ? getConnectorIcon(slug) : null;

  return (
    <Card className={status === 'connected' ? 'border-accent/20' : 'hover:border-surface-subtle'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            status === 'connected' ? 'bg-accent-muted' : 'bg-surface-subtle'
          }`}>
            {Icon ? (
              <Icon className={`h-5 w-5 ${status === 'connected' ? 'text-accent' : 'text-text-muted'}`} />
            ) : (
              <span className="text-sm font-bold text-text-muted">{name.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{name}</h3>
            {lastSync && (
              <p className="text-xs text-text-muted">Connected: {lastSync}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={status} />
          {status === 'disconnected' && onConnect && (
            <Button variant="outline" size="sm" onClick={onConnect}>
              Connect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
