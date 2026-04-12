'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { createBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { LogOut, Bell, Menu, AlertTriangle, Info, AlertCircle, Sun, Moon } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';
import { useSelectedClient } from './ClientSwitcher';
import { useTheme } from '@/hooks/use-theme';
import { fetcher } from '@/lib/fetcher';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const { clientId } = useSelectedClient();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellShaking, setBellShaking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevUnreadRef = useRef(0);

  const { data: alertsData, mutate: mutateAlerts } = useSWR(
    `/api/alerts${clientId ? `?clientId=${clientId}` : ''}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const alerts = alertsData?.data || [];
  const unreadCount = alerts.filter((a: any) => !a.is_read).length;

  // Shake bell when new unread alerts arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setBellShaking(true);
      const t = setTimeout(() => setBellShaking(false), 700);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  async function handleSignOut() {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function markAllRead() {
    await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    });
    mutateAlerts();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-border bg-surface/80 px-4 backdrop-blur-md md:px-6 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-subtle hover:text-text-primary md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-text-primary md:text-xl">{title}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden sm:block">
          <Suspense fallback={<div className="h-9 w-48 animate-pulse rounded-lg bg-surface-subtle" />}>
            <DateRangePicker />
          </Suspense>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-surface-subtle hover:text-text-primary active:scale-95"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-text-muted transition-all hover:bg-surface-subtle hover:text-text-primary active:scale-95"
          >
            <Bell className={`h-5 w-5 ${bellShaking ? 'animate-shake' : ''}`} />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-surface animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-xl border border-surface-border bg-surface-card p-2 shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
                <p className="text-sm font-bold text-text-primary">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] font-semibold uppercase tracking-wider text-accent hover:text-accent-hover"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-auto py-1">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-muted">No notifications yet.</div>
                ) : (
                  alerts.slice(0, 5).map((alert: any) => (
                    <div key={alert.id} className={`flex gap-3 rounded-lg px-3 py-2.5 transition-colors ${alert.is_read ? 'opacity-60' : 'bg-surface-subtle/50'}`}>
                      <div className="mt-0.5">
                        {alert.type === 'error'   ? <AlertCircle   className="h-4 w-4 text-red-400" />    :
                         alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-orange-400" /> :
                                                    <Info          className="h-4 w-4 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-primary leading-tight">{alert.message}</p>
                        <p className="mt-1 text-[10px] text-text-muted uppercase tracking-wider">
                          {alert.connector_slug} • {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-surface-border mx-1" />

        <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </header>
  );
}
