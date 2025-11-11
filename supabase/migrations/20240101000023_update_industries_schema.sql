-- ============================================================================
-- UPDATE INDUSTRIES SCHEMA
-- ============================================================================
-- This migration updates the industries table to use industry_code as PK
-- and updates organizations.industry to reference it

-- Drop the old supported_industries table if it exists
DROP TABLE IF EXISTS supported_industries CASCADE;

-- Create new industries table with industry_code as PK
CREATE TABLE IF NOT EXISTS industries (
  industry_code TEXT PRIMARY KEY,
  industry_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_industries_enabled ON industries(is_enabled);
CREATE INDEX IF NOT EXISTS idx_industries_name ON industries(industry_name);

-- Enable RLS
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read enabled industries
CREATE POLICY "Anyone can read enabled industries"
  ON industries
  FOR SELECT
  USING (is_enabled = TRUE);

-- Insert initial industries data (required before adding foreign key constraint)
INSERT INTO industries (industry_code, industry_name, description, is_enabled) VALUES
  ('supplements_food_ingredients', 'Nutritional Supplements / Food Ingredients', 'Companies producing nutritional supplements, food ingredients, and related products', TRUE),
  ('chemicals_raw_materials', 'Chemicals & Raw Materials', 'Companies producing chemicals, raw materials, and industrial compounds', TRUE),
  ('pharmaceuticals', 'Pharmaceuticals', 'Companies in the pharmaceutical industry producing medicines and healthcare products', TRUE),
  ('cosmetics_personal_care', 'Cosmetics & Personal Care', 'Companies producing cosmetics, personal care products, and beauty items', TRUE),
  ('other', 'Other', 'Other industries not specifically categorized', TRUE)
ON CONFLICT (industry_code) DO NOTHING;

-- Update organizations.industry column to reference industry_code
-- First, migrate existing data from old names to new codes
UPDATE organizations
SET industry = CASE
  WHEN industry = 'Food & Supplement Ingredients' THEN 'supplements_food_ingredients'
  WHEN industry = 'Chemicals & Raw Materials' THEN 'chemicals_raw_materials'
  WHEN industry = 'Pharmaceuticals' THEN 'pharmaceuticals'
  WHEN industry = 'Cosmetics & Personal Care' THEN 'cosmetics_personal_care'
  WHEN industry = 'Other' THEN 'other'
  ELSE NULL
END
WHERE industry IS NOT NULL;

-- Drop existing constraint if it exists
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS fk_organizations_industry;

-- Add foreign key constraint
ALTER TABLE organizations
  ADD CONSTRAINT fk_organizations_industry
  FOREIGN KEY (industry)
  REFERENCES industries(industry_code)
  ON DELETE SET NULL;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_organizations_industry_code ON organizations(industry);

