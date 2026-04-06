import type { ConnectorDefinition } from '@/types';

/**
 * CONNECTOR REGISTRY — single source of truth.
 * Adding a new connector = adding one object here. Nothing else needs to change.
 */
export const CONNECTORS: ConnectorDefinition[] = [
  {
    slug: 'bank',
    name: 'Bank (Plaid)',
    category: 'finance',
    authType: 'plaid',
    fields: [
      { key: 'client_id', label: 'Plaid Client ID', placeholder: 'your_plaid_client_id', secret: false },
      { key: 'secret', label: 'Plaid Secret', placeholder: 'your_plaid_secret', secret: true },
    ],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    category: 'finance',
    authType: 'api_key',
    fields: [
      { key: 'api_key', label: 'Secret Key', placeholder: 'sk_live_...', secret: true },
    ],
  },
  {
    slug: 'square',
    name: 'Square',
    category: 'finance',
    authType: 'api_key',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAAl...', secret: true },
      { key: 'location_id', label: 'Location ID', placeholder: 'L...', secret: false },
    ],
  },
  {
    slug: 'meta',
    name: 'Meta Ads',
    category: 'ads',
    authType: 'oauth',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAAGm...', secret: true },
      { key: 'account_id', label: 'Ad Account ID', placeholder: 'act_123456', secret: false },
    ],
  },
  {
    slug: 'yelp',
    name: 'Yelp',
    category: 'reviews',
    authType: 'api_key',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'your_yelp_api_key', secret: true },
      { key: 'business_id', label: 'Business ID', placeholder: 'hawaii-wellness-clinic-honolulu', secret: false },
    ],
  },
  {
    slug: 'tiktok',
    name: 'TikTok Ads',
    category: 'ads',
    authType: 'oauth',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'your_tiktok_token', secret: true },
      { key: 'advertiser_id', label: 'Advertiser ID', placeholder: '123456789', secret: false },
    ],
  },
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    category: 'analytics',
    authType: 'oauth',
    fields: [
      { key: 'property_id', label: 'GA4 Property ID', placeholder: '123456789', secret: false },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '1//0...', secret: true },
    ],
  },
];

/** Lookup a connector by slug */
export function getConnector(slug: string): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.slug === slug);
}

/** Get connectors by category */
export function getConnectorsByCategory(category: string): ConnectorDefinition[] {
  return CONNECTORS.filter((c) => c.category === category);
}
