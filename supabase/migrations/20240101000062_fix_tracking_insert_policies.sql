-- ============================================================================
-- FIX TRACKING INSERT POLICIES
-- ============================================================================
-- Ensure access logs and actions can be inserted by anonymous users
-- Explicitly include FOR INSERT clause

-- Fix product_access_logs INSERT policy
DROP POLICY IF EXISTS "Public can insert access logs" ON product_access_logs;

CREATE POLICY "Public can insert access logs"
  ON product_access_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Fix product_access_actions INSERT policy
DROP POLICY IF EXISTS "Public can insert access actions" ON product_access_actions;

CREATE POLICY "Public can insert access actions"
  ON product_access_actions
  FOR INSERT
  TO public
  WITH CHECK (true);

