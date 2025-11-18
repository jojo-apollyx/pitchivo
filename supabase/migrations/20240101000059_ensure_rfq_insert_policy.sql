-- ============================================================================
-- ENSURE RFQ INSERT POLICY FOR ANONYMOUS USERS
-- ============================================================================
-- This migration ensures anonymous users can insert RFQs
-- RFQs are submitted from public product pages by unauthenticated users

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can submit RFQs" ON product_rfqs;

-- Allow anyone (including unauthenticated users) to insert RFQs
-- This matches the pattern used in waitlist and other public tables
CREATE POLICY "Anyone can submit RFQs"
  ON product_rfqs
  FOR INSERT
  WITH CHECK (true);

