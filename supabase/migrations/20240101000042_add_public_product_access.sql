-- ============================================================================
-- ADD PUBLIC ACCESS POLICY FOR PUBLISHED PRODUCTS
-- ============================================================================
-- Allow anyone (including unauthenticated users) to view published products
-- This is needed for the public product pages to work

CREATE POLICY "Public can view published products"
  ON products
  FOR SELECT
  USING (status = 'published');

