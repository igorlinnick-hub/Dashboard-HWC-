'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClientSwitcher, useSelectedClient } from './ClientSwitcher';

const staticLinks = [
  { label: 'Overview', href: '/' },
  { label: 'Settings', href: '/settings/connections' },
];

const connectorLinks = [
  { label: 'Bank', slug: 'bank' },
  { label: 'Stripe', slug: 'stripe' },
  { label: 'Square', slug: 'square' },
  { label: 'Meta Ads', slug: 'meta' },
  { label: 'Yelp', slug: 'yelp' },
  { label: 'TikTok', slug: 'tiktok' },
  { label: 'Google Analytics', slug: 'google-analytics' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { clientId, selectClient } = useSelectedClient();

  function connectorHref(slug: string) {
    if (!clientId) return '#';
    return `/clients/${clientId}/${slug}`;
  }

  function isActive(href: string) {
    return pathname === href;
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-gray-50">
      <div className="p-4 pb-2">
        <h1 className="text-xl font-bold">Agency Dashboard</h1>
        <p className="text-sm text-gray-500">Multi-Client BI</p>
      </div>

      <ClientSwitcher clientId={clientId} onSelect={selectClient} />

      <nav className="flex-1 space-y-1 overflow-auto p-3">
        {staticLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm font-medium ${
              isActive(item.href)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}

        {clientId && (
          <>
            <div className="pb-1 pt-4 text-xs font-semibold uppercase text-gray-400">
              Connectors
            </div>
            <Link
              href={`/clients/${clientId}`}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === `/clients/${clientId}`
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Client Overview
            </Link>
            {connectorLinks.map((c) => (
              <Link
                key={c.slug}
                href={connectorHref(c.slug)}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(connectorHref(c.slug))
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {c.label}
              </Link>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
