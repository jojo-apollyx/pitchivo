-- ============================================================================
-- PRODUCTS
-- ============================================================================
-- Table to store products created by organizations
CREATE TABLE IF NOT EXISTS products (
  product_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  industry_code TEXT NOT NULL REFERENCES industries(industry_code) ON DELETE RESTRICT,
  template_id UUID REFERENCES product_templates(template_id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_industry_code ON products(industry_code);
CREATE INDEX IF NOT EXISTS idx_products_template_id ON products(template_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see products from their organization
CREATE POLICY "Users can view products from their organization"
  ON products
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = products.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can insert products for their organization
CREATE POLICY "Users can insert products for their organization"
  ON products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = products.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can update products from their organization
CREATE POLICY "Users can update products from their organization"
  ON products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = products.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can delete products from their organization
CREATE POLICY "Users can delete products from their organization"
  ON products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = products.org_id
      AND user_profiles.id = auth.uid()
    )
  );

