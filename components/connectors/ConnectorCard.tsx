'use client';

import type { ConnectorStatus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ConnectorCardProps {
  name: string;
  status: ConnectorStatus;
  lastSync: string | null;
  onConnect?: () => void;
}

export function ConnectorCard({ name, status, lastSync, onConnect }: ConnectorCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-500">
            {name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            {lastSync && (
              <p className="text-xs text-gray-500">Connected: {lastSync}</p>
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
