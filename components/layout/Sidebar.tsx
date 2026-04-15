'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Settings,
  ClipboardList,
  Landmark,
  CreditCard,
  SquareIcon,
  Megaphone,
  Star,
  Music,
  BarChart3,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { ClientSwitcher, useSelectedClient } from './ClientSwitcher';

const connectorLinks: { label: string; slug: string; icon: LucideIcon }[] = [
  { label: 'Bank', slug: 'bank', icon: Landmark },
  { label: 'Stripe', slug: 'stripe', icon: CreditCard },
  { label: 'Square', slug: 'square', icon: SquareIcon },
  { label: 'Meta Ads', slug: 'meta', icon: Megaphone },
  { label: 'Yelp', slug: 'yelp', icon: Star },
  { label: 'TikTok', slug: 'tiktok', icon: Music },
  { label: 'Google Analytics', slug: 'google-analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { clientId, selectClient } = useSelectedClient();

  function linkClass(href: string) {
    const active = pathname === href;
    return `group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-accent-muted text-accent'
        : 'text-text-secondary hover:bg-surface-subtle hover:text-text-primary'
    }`;
  }

  function iconClass(href: string) {
    const active = pathname === href;
    return active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary';
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-surface-border bg-surface">
      {/* Logo */}
      <div className="border-b border-surface-border px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-sm">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Wellness BI</p>
            <p className="text-xs text-text-muted">Agency Dashboard</p>
          </div>
        </div>
      </div>

      {/* Client switcher */}
      <div className="border-b border-surface-border px-3 py-3">
        <ClientSwitcher clientId={clientId} onSelect={selectClient} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto px-3 py-3">
        <div className="space-y-0.5">
          <Link href="/" className={linkClass('/')}>
            <LayoutDashboard className={`h-4 w-4 ${iconClass('/')}`} />
            Overview
          </Link>
          <Link href="/settings/connections" className={linkClass('/settings/connections')}>
            <Settings className={`h-4 w-4 ${iconClass('/settings/connections')}`} />
            Settings
          </Link>
          <Link href="/team" className={linkClass('/team')}>
            <Users className={`h-4 w-4 ${iconClass('/team')}`} />
            Team
          </Link>
        </div>

        {clientId && (
          <>
            <div className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              Connectors
            </div>
            <div className="space-y-0.5">
              <Link href={`/clients/${clientId}`} className={linkClass(`/clients/${clientId}`)}>
                <ClipboardList className={`h-4 w-4 ${iconClass(`/clients/${clientId}`)}`} />
                Client Overview
              </Link>
              {connectorLinks.map((c) => {
                const href = `/clients/${clientId}/${c.slug}`;
                const Icon = c.icon;
                return (
                  <Link key={c.slug} href={href} className={linkClass(href)}>
                    <Icon className={`h-4 w-4 ${iconClass(href)}`} />
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}
