'use client';

import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <header className="flex items-center justify-between border-b border-surface-border bg-surface px-6 py-4">
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <LogOut className="mr-1.5 h-3.5 w-3.5" />
        Sign Out
      </Button>
    </header>
  );
}
