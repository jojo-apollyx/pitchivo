-- ============================================================================
-- ADD RLS POLICIES FOR PRODUCT TEMPLATES
-- ============================================================================
-- Add INSERT, UPDATE, and DELETE policies for product_templates table

-- Policy: Authenticated users with an organization can insert templates
CREATE POLICY "Authenticated users can insert templates"
  ON product_templates
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id IS NOT NULL
    )
  );

-- Policy: Authenticated users can update templates
-- (Templates are shared resources, so any authenticated user can update)
CREATE POLICY "Authenticated users can update templates"
  ON product_templates
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id IS NOT NULL
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND organization_id IS NOT NULL
    )
  );

-- Policy: Service role can manage all templates
CREATE POLICY "Service role can manage all templates"
  ON product_templates
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

