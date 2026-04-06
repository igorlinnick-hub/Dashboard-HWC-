-- ==========================================
-- Multi-client agency dashboard schema
-- ==========================================

-- Agency clients (clinics)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Per-client connector credentials
CREATE TABLE connector_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  connector_slug TEXT NOT NULL,
  api_key TEXT,                     -- encrypted at rest via Supabase Vault
  extra_config JSONB DEFAULT '{}',  -- GA property_id, Meta account_id, etc.
  is_connected BOOLEAN NOT NULL DEFAULT false,
  connected_at TIMESTAMPTZ,
  UNIQUE (client_id, connector_slug)
);

-- Dashboard pages configuration
CREATE TABLE dashboard_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  connector_slug TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_credentials_client ON connector_credentials(client_id);
CREATE INDEX idx_credentials_slug ON connector_credentials(connector_slug);
CREATE INDEX idx_credentials_client_slug ON connector_credentials(client_id, connector_slug);

-- Seed dashboard pages
INSERT INTO dashboard_pages (title, slug, connector_slug, "order") VALUES
  ('Bank (Plaid)', 'bank', 'bank', 1),
  ('Stripe', 'stripe', 'stripe', 2),
  ('Square', 'square', 'square', 3),
  ('Meta Ads', 'meta', 'meta', 4),
  ('Yelp', 'yelp', 'yelp', 5),
  ('TikTok Ads', 'tiktok', 'tiktok', 6),
  ('Google Analytics', 'google-analytics', 'google-analytics', 7);
