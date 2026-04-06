'use client';

import { Button } from '@/components/ui/Button';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  // TODO: add user menu, date range picker, sync all button
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="flex items-center gap-4">
        {/* TODO: date range picker */}
        {/* TODO: user avatar / sign out */}
        <Button variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    </header>
  );
}
