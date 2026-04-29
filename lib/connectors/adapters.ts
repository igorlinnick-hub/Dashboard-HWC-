// SERVER-ONLY: adapter registry.
// Imports each connector's pure adapter and exposes a slug→adapter lookup.
// Kept separate from `registry.ts` because adapters transitively pull in
// Node-only dependencies (e.g. `fs`, `stream`) via fetchers/SDKs, and
// `registry.ts` is also imported from client components (it carries UI
// metadata used by ConnectModal). Client bundles must not bundle adapters.

import 'server-only';
import type { ConnectorAdapter } from '@/types';
import { stripeAdapter } from '@/modules/stripe/adapter';
import { squareAdapter } from '@/modules/square/adapter';
import { metaAdapter } from '@/modules/meta/adapter';
import { tiktokAdapter } from '@/modules/tiktok/adapter';
import { yelpAdapter } from '@/modules/yelp/adapter';
import { gaAdapter } from '@/modules/google-analytics/adapter';
import { bankAdapter } from '@/modules/bank/adapter';

const ADAPTERS: Record<string, ConnectorAdapter> = {
  stripe: stripeAdapter,
  square: squareAdapter,
  meta: metaAdapter,
  tiktok: tiktokAdapter,
  yelp: yelpAdapter,
  'google-analytics': gaAdapter,
  bank: bankAdapter,
};

/** Lookup an adapter by slug. Server-only. */
export function getConnectorAdapter(slug: string): ConnectorAdapter | undefined {
  return ADAPTERS[slug];
}
