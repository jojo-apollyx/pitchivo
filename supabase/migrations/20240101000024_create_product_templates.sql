-- ============================================================================
-- PRODUCT TEMPLATES
-- ============================================================================
-- Table to store product templates for different industries
CREATE TABLE IF NOT EXISTS product_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_code TEXT NOT NULL REFERENCES industries(industry_code) ON DELETE CASCADE,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_templates_industry_code ON product_templates(industry_code);
CREATE INDEX IF NOT EXISTS idx_product_templates_active ON product_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_product_templates_version ON product_templates(version);

-- Enable RLS
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active templates
CREATE POLICY "Anyone can read active templates"
  ON product_templates
  FOR SELECT
  USING (is_active = TRUE);

