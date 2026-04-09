-- Alerts table for system notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  connector_slug TEXT NOT NULL,
  type TEXT NOT NULL, -- 'error', 'warning', 'info'
  severity TEXT NOT NULL, -- 'high', 'medium', 'low'
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast counts
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON alerts (client_id, is_read);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);
