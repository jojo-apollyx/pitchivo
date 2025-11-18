-- ============================================================================
-- ENSURE PRODUCT TRACKING POLICIES FOR ANONYMOUS USERS
-- ============================================================================
-- This migration ensures anonymous users can insert access logs and actions
-- Tracking happens from public product pages by unauthenticated users

-- ============================================================================
-- PRODUCT_ACCESS_LOGS POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can insert access logs" ON product_access_logs;

-- Allow anyone (including unauthenticated users) to insert access logs
-- This matches the pattern used in waitlist and RFQs
CREATE POLICY "Public can insert access logs"
  ON product_access_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PRODUCT_ACCESS_ACTIONS POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can insert access actions" ON product_access_actions;

-- Allow anyone (including unauthenticated users) to insert access actions
CREATE POLICY "Public can insert access actions"
  ON product_access_actions
  FOR INSERT
  WITH CHECK (true);

