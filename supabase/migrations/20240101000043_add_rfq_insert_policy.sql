-- ============================================================================
-- ADD INSERT POLICY FOR PRODUCT_RFQS
-- ============================================================================
-- Allow anyone (including unauthenticated users) to submit RFQs
-- This is needed because RFQs are submitted from public product pages

CREATE POLICY "Anyone can submit RFQs"
  ON product_rfqs
  FOR INSERT
  WITH CHECK (true);

