-- ==========================================
-- RLS: restrict clients + credentials to authenticated team users
-- Model: any authenticated (team) user has full access.
-- Anon/public access is blocked. Service role (server) bypasses RLS.
-- ==========================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_pages ENABLE ROW LEVEL SECURITY;

-- clients
DROP POLICY IF EXISTS "team read clients" ON clients;
DROP POLICY IF EXISTS "team write clients" ON clients;
CREATE POLICY "team read clients" ON clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "team write clients" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- connector_credentials
DROP POLICY IF EXISTS "team read credentials" ON connector_credentials;
DROP POLICY IF EXISTS "team write credentials" ON connector_credentials;
CREATE POLICY "team read credentials" ON connector_credentials
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "team write credentials" ON connector_credentials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- dashboard_pages (read-only reference)
DROP POLICY IF EXISTS "team read pages" ON dashboard_pages;
CREATE POLICY "team read pages" ON dashboard_pages
  FOR SELECT TO authenticated USING (true);
