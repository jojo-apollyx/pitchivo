-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR LEADS TABLES
-- ============================================================================
-- Restrict access to leads tables to authenticated users only
-- No anonymous access allowed
--
-- NOTE: Service role (used by migrations) bypasses RLS automatically
-- Migrations will have full access to all tables regardless of RLS policies

-- Enable RLS on all leads tables
ALTER TABLE leads_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_market_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_signals ENABLE ROW LEVEL SECURITY;

-- Enable RLS on enrichment tables
ALTER TABLE leads_enrichment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_enrichment_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_enrichment_api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_enrichment_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_enrichment_executions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- REVOKE ANONYMOUS ACCESS
-- ============================================================================
-- Explicitly revoke all permissions from anonymous role
REVOKE ALL ON leads_sources FROM anon;
REVOKE ALL ON leads_market_items FROM anon;
REVOKE ALL ON leads_organizations FROM anon;
REVOKE ALL ON leads_contacts FROM anon;
REVOKE ALL ON leads_signals FROM anon;
REVOKE ALL ON leads_enrichment_providers FROM anon;
REVOKE ALL ON leads_enrichment_api_keys FROM anon;
REVOKE ALL ON leads_enrichment_api_usage FROM anon;
REVOKE ALL ON leads_enrichment_steps FROM anon;
REVOKE ALL ON leads_enrichment_executions FROM anon;

-- ============================================================================
-- GRANT TABLE-LEVEL PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================
-- Grant SELECT, INSERT, UPDATE, DELETE to authenticated users
-- RLS policies will further restrict access as needed
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_sources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_market_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_signals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_enrichment_providers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_enrichment_api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_enrichment_api_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_enrichment_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads_enrichment_executions TO authenticated;

-- Grant usage on sequences (if any are used)
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================================================
-- SERVICE ROLE ACCESS (FOR MIGRATIONS)
-- ============================================================================
-- Service role automatically bypasses RLS, but we grant explicit permissions
-- to ensure migrations and admin operations work correctly
GRANT ALL ON leads_sources TO service_role;
GRANT ALL ON leads_market_items TO service_role;
GRANT ALL ON leads_organizations TO service_role;
GRANT ALL ON leads_contacts TO service_role;
GRANT ALL ON leads_signals TO service_role;
GRANT ALL ON leads_enrichment_providers TO service_role;
GRANT ALL ON leads_enrichment_api_keys TO service_role;
GRANT ALL ON leads_enrichment_api_usage TO service_role;
GRANT ALL ON leads_enrichment_steps TO service_role;
GRANT ALL ON leads_enrichment_executions TO service_role;
GRANT SELECT ON v_organizations_as_buyers TO service_role;
GRANT SELECT ON v_organizations_as_sellers TO service_role;
GRANT SELECT ON v_organizations_as_manufacturers TO service_role;

-- ============================================================================
-- RLS POLICIES FOR leads_sources
-- ============================================================================
-- Authenticated users can read all sources
CREATE POLICY "Authenticated users can read leads sources"
  ON leads_sources
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert sources
CREATE POLICY "Authenticated users can insert leads sources"
  ON leads_sources
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update sources
CREATE POLICY "Authenticated users can update leads sources"
  ON leads_sources
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can delete sources
CREATE POLICY "Authenticated users can delete leads sources"
  ON leads_sources
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_market_items
-- ============================================================================
-- Authenticated users can read all market items
CREATE POLICY "Authenticated users can read leads market items"
  ON leads_market_items
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert market items
CREATE POLICY "Authenticated users can insert leads market items"
  ON leads_market_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update market items
CREATE POLICY "Admins can update leads market items"
  ON leads_market_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Authenticated users can delete market items
CREATE POLICY "Authenticated users can delete leads market items"
  ON leads_market_items
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_organizations
-- ============================================================================
-- Authenticated users can read all organizations
CREATE POLICY "Authenticated users can read leads organizations"
  ON leads_organizations
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert organizations
CREATE POLICY "Authenticated users can insert leads organizations"
  ON leads_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update organizations
CREATE POLICY "Admins can update leads organizations"
  ON leads_organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Authenticated users can delete organizations
CREATE POLICY "Authenticated users can delete leads organizations"
  ON leads_organizations
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_contacts
-- ============================================================================
-- Authenticated users can read all contacts
CREATE POLICY "Authenticated users can read leads contacts"
  ON leads_contacts
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert contacts
CREATE POLICY "Authenticated users can insert leads contacts"
  ON leads_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update contacts
CREATE POLICY "Admins can update leads contacts"
  ON leads_contacts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Authenticated users can delete contacts
CREATE POLICY "Authenticated users can delete leads contacts"
  ON leads_contacts
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_signals
-- ============================================================================
-- Authenticated users can read all signals
CREATE POLICY "Authenticated users can read leads signals"
  ON leads_signals
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert signals
CREATE POLICY "Authenticated users can insert leads signals"
  ON leads_signals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Only admins can update signals
CREATE POLICY "Admins can update leads signals"
  ON leads_signals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND is_pitchivo_admin = true
    )
  );

-- Authenticated users can delete signals
CREATE POLICY "Authenticated users can delete leads signals"
  ON leads_signals
  FOR DELETE
  TO authenticated
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_enrichment_providers
-- ============================================================================
CREATE POLICY "Authenticated users can read enrichment providers"
  ON leads_enrichment_providers
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage enrichment providers"
  ON leads_enrichment_providers
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_enrichment_api_keys
-- ============================================================================
CREATE POLICY "Authenticated users can read enrichment api keys"
  ON leads_enrichment_api_keys
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage enrichment api keys"
  ON leads_enrichment_api_keys
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_enrichment_api_usage
-- ============================================================================
CREATE POLICY "Authenticated users can read enrichment api usage"
  ON leads_enrichment_api_usage
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage enrichment api usage"
  ON leads_enrichment_api_usage
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_enrichment_steps
-- ============================================================================
CREATE POLICY "Authenticated users can read enrichment steps"
  ON leads_enrichment_steps
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage enrichment steps"
  ON leads_enrichment_steps
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR leads_enrichment_executions
-- ============================================================================
CREATE POLICY "Authenticated users can read enrichment executions"
  ON leads_enrichment_executions
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage enrichment executions"
  ON leads_enrichment_executions
  FOR ALL
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- RLS POLICIES FOR RELATED VIEWS
-- ============================================================================
-- Enable RLS on views (views inherit RLS from underlying tables)
-- Grant access to authenticated users only
GRANT SELECT ON v_organizations_as_buyers TO authenticated;
GRANT SELECT ON v_organizations_as_sellers TO authenticated;
GRANT SELECT ON v_organizations_as_manufacturers TO authenticated;

REVOKE ALL ON v_organizations_as_buyers FROM anon;
REVOKE ALL ON v_organizations_as_sellers FROM anon;
REVOKE ALL ON v_organizations_as_manufacturers FROM anon;

