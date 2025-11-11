-- ============================================================================
-- ENHANCE PRODUCT TEMPLATES
-- ============================================================================
-- This migration enhances the product_templates table to support:
-- 1. Multiple templates per industry (regional variations, sub-types)
-- 2. Template naming for better identification
-- 3. Default template flag per industry

-- Add new columns
ALTER TABLE product_templates
  ADD COLUMN IF NOT EXISTS template_name TEXT,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE;

-- Add unique constraint: only one default template per industry
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_templates_unique_default_per_industry
  ON product_templates(industry_code)
  WHERE is_default = TRUE AND is_active = TRUE;

-- Add index for template_name lookups
CREATE INDEX IF NOT EXISTS idx_product_templates_name ON product_templates(template_name);

-- Add index for default template lookups
CREATE INDEX IF NOT EXISTS idx_product_templates_default ON product_templates(industry_code, is_default)
  WHERE is_default = TRUE AND is_active = TRUE;

-- Add comments
COMMENT ON COLUMN product_templates.template_name IS 'Human-readable name for the template, e.g., "supplements_us_gmp" or "supplements_eu_novel_foods"';
COMMENT ON COLUMN product_templates.is_default IS 'Flags the default template for an industry. Only one default template per industry can be active at a time.';
COMMENT ON COLUMN product_templates.industry_code IS 'Many templates can share the same industry_code to support regional variations and product sub-types';

-- Update RLS policy to allow reading all active templates (not just default)
-- The existing policy already allows reading all active templates, so no change needed

