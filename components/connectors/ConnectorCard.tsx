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
  hasSavedCredentials?: boolean;
  onConnect?: () => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectorCard({ name, slug, status, lastSync, hasSavedCredentials, onConnect, onReconnect, onDisconnect }: ConnectorCardProps) {
  const Icon = slug ? getConnectorIcon(slug) : null;

  return (
    <Card className={`transition-all duration-200 ${status === 'connected' ? 'border-accent/20' : 'hover:border-accent/30 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]'}`}>
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
          {status === 'disconnected' && hasSavedCredentials && onReconnect && (
            <Button variant="outline" size="sm" onClick={onReconnect}>
              Reconnect
            </Button>
          )}
          {status === 'disconnected' && !hasSavedCredentials && onConnect && (
            <Button variant="outline" size="sm" onClick={onConnect}>
              Connect
            </Button>
          )}
          {status === 'connected' && onDisconnect && (
            <Button variant="ghost" size="sm" className="text-text-muted hover:text-red-400" onClick={onDisconnect}>
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
