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
    docsUrl: 'https://dashboard.plaid.com/team/keys',
    setupSteps: [
      'Click "Open Plaid Link" below',
      'Select your bank and log in with your online-banking credentials',
      'Plaid securely returns a token — no credentials are stored on our side',
    ],
    fields: [],
  },
  {
    slug: 'stripe',
    name: 'Stripe',
    category: 'finance',
    authType: 'api_key',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    setupSteps: [
      'Open Stripe Dashboard → Developers → API keys',
      'Copy the "Secret key" (starts with sk_live_ or sk_test_)',
      'Paste it below — read-only access is enough',
    ],
    fields: [
      {
        key: 'api_key',
        label: 'Secret Key',
        placeholder: 'sk_live_...',
        secret: true,
        hint: 'Restricted key with read access to Charges, Customers, Products is enough.',
        docsUrl: 'https://dashboard.stripe.com/apikeys',
      },
    ],
  },
  {
    slug: 'square',
    name: 'Square',
    category: 'finance',
    authType: 'api_key',
    docsUrl: 'https://developer.squareup.com/apps',
    setupSteps: [
      'Open Square Developer Dashboard → your Application',
      'Switch to Production, copy the Access Token',
      'Find the Location ID in Square Dashboard → Account & Settings → Locations',
    ],
    fields: [
      {
        key: 'access_token',
        label: 'Production Access Token',
        placeholder: 'EAAAl...',
        secret: true,
        hint: 'Requires scopes: PAYMENTS_READ, ORDERS_READ, MERCHANT_PROFILE_READ.',
        docsUrl: 'https://developer.squareup.com/apps',
      },
      {
        key: 'location_id',
        label: 'Location ID',
        placeholder: 'L1A2B3C4D5',
        secret: false,
        hint: 'One Square account can have multiple locations — pick the clinic you want to report on.',
        docsUrl: 'https://squareup.com/dashboard/locations',
      },
    ],
  },
  {
    slug: 'meta',
    name: 'Meta Ads',
    category: 'ads',
    authType: 'oauth',
    docsUrl: 'https://business.facebook.com/settings/system-users',
    setupSteps: [
      'Go to Meta Business Manager → Business Settings → System Users',
      'Create (or pick) a System User → Generate Token with ads_read permission',
      'Copy the token and the Ad Account ID from Ads Manager (format: act_1234567890)',
    ],
    fields: [
      {
        key: 'access_token',
        label: 'Access Token',
        placeholder: 'EAAGm...',
        secret: true,
        hint: 'System User token with ads_read scope. Never expires — preferred over short-lived user tokens.',
        docsUrl: 'https://business.facebook.com/settings/system-users',
      },
      {
        key: 'account_id',
        label: 'Ad Account ID',
        placeholder: 'act_1234567890',
        secret: false,
        hint: 'Must start with "act_". Copy from Ads Manager top-left account picker.',
        docsUrl: 'https://adsmanager.facebook.com/adsmanager/',
      },
    ],
  },
  {
    slug: 'yelp',
    name: 'Yelp',
    category: 'reviews',
    authType: 'api_key',
    docsUrl: 'https://www.yelp.com/developers/v3/manage_app',
    setupSteps: [
      'Open Yelp Fusion → Manage App and copy the API Key',
      'Find the clinic on yelp.com — the URL ends with its business slug',
      'E.g. yelp.com/biz/hawaii-wellness-clinic-honolulu → business_id is the last part',
    ],
    fields: [
      {
        key: 'api_key',
        label: 'Fusion API Key',
        placeholder: 'your_yelp_api_key',
        secret: true,
        hint: 'Yelp Fusion is free. One API key works for all businesses.',
        docsUrl: 'https://www.yelp.com/developers/v3/manage_app',
      },
      {
        key: 'business_id',
        label: 'Business ID (slug)',
        placeholder: 'hawaii-wellness-clinic-honolulu',
        secret: false,
        hint: 'The slug from the business page URL on yelp.com/biz/<slug>.',
        docsUrl: 'https://www.yelp.com/',
      },
    ],
  },
  {
    slug: 'tiktok',
    name: 'TikTok Ads',
    category: 'ads',
    authType: 'oauth',
    docsUrl: 'https://ads.tiktok.com/marketing_api/homepage',
    setupSteps: [
      'Open TikTok for Business → Marketing API → your App',
      'Generate a Long-Term Access Token for the advertiser',
      'Copy the Advertiser ID from TikTok Ads Manager top bar',
    ],
    fields: [
      {
        key: 'access_token',
        label: 'Long-Term Access Token',
        placeholder: 'your_tiktok_token',
        secret: true,
        hint: 'Requires Reporting + Ad Account Management permissions.',
        docsUrl: 'https://ads.tiktok.com/marketing_api/homepage',
      },
      {
        key: 'advertiser_id',
        label: 'Advertiser ID',
        placeholder: '1234567890123456',
        secret: false,
        hint: 'Numeric ID, visible in Ads Manager → top-right account switcher.',
        docsUrl: 'https://ads.tiktok.com/i18n/dashboard',
      },
    ],
  },
  {
    slug: 'google-analytics',
    name: 'Google Analytics',
    category: 'analytics',
    authType: 'oauth',
    docsUrl: 'https://analytics.google.com/',
    setupSteps: [
      'Open Google Analytics → Admin → Property Settings',
      'Copy the numeric Property ID (GA4 only — Universal Analytics is deprecated)',
      'Paste it below and you will be redirected to Google to grant read access',
    ],
    fields: [
      {
        key: 'property_id',
        label: 'GA4 Property ID',
        placeholder: '123456789',
        secret: false,
        hint: 'Numeric only, e.g. 287654321. You will authorize via Google OAuth on the next step.',
        docsUrl: 'https://analytics.google.com/analytics/web/#/a/admin',
      },
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

