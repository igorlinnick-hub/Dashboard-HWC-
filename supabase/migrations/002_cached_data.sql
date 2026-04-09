-- Cache table for connector data with per-connector TTL
-- Ch 2.2: Supabase-backed cache

CREATE TABLE IF NOT EXISTS cached_data (
  connector_slug TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (connector_slug, client_id, period_from, period_to)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cached_data_lookup
  ON cached_data (connector_slug, client_id, period_from, period_to);

-- RLS: allow service role full access (API routes use service role key)
ALTER TABLE cached_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON cached_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
