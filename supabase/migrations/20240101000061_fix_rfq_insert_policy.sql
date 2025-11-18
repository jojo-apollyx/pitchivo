-- ============================================================================
-- FIX RFQ INSERT POLICY
-- ============================================================================
-- The policy exists but the SQL definition may be missing FOR INSERT
-- This migration drops and recreates it with the correct FOR INSERT clause

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can submit RFQs" ON product_rfqs;

-- Recreate with explicit FOR INSERT clause
CREATE POLICY "Anyone can submit RFQs"
  ON product_rfqs
  FOR INSERT
  TO public
  WITH CHECK (true);

