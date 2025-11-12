-- ============================================================================
-- MIGRATE TO HARDCODED INDUSTRIES
-- ============================================================================
-- This migration:
-- 1. Drops foreign key constraint first
-- 2. Migrates all existing organizations to 'food_supplement' industry
-- 3. Migrates all existing products to 'food_supplement' industry
-- 4. Drops the industries table (replaced by hardcoded constants)
-- 5. Drops the product_templates table (no longer using templates)

-- Step 1: Drop foreign key constraints FIRST (before updating data)
ALTER TABLE organizations
  DROP CONSTRAINT IF EXISTS fk_organizations_industry;

-- Step 2: Update all organizations to use 'food_supplement' industry
UPDATE organizations
SET industry = 'food_supplement'
WHERE industry IS NOT NULL;

-- Step 3: Update all products to use 'food_supplement' industry
-- First check if products table has an industry column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'industry_code'
  ) THEN
    UPDATE products
    SET industry_code = 'food_supplement'
    WHERE industry_code IS NOT NULL;
  END IF;
END $$;

-- Step 4: Drop product_templates table (template system removed)
DROP TABLE IF EXISTS product_templates CASCADE;

-- Step 5: Drop industries table (now using hardcoded values)
DROP TABLE IF EXISTS industries CASCADE;

-- Step 6: Alter organizations.industry column to be a simple TEXT field (no foreign key)
-- The column already exists, we just removed the foreign key constraint above
-- Keep the column as TEXT with the updated values

-- Add a comment to document the change
COMMENT ON COLUMN organizations.industry IS 'Industry code (now hardcoded in application constants)';

-- Add a comment to document that templates are no longer used
COMMENT ON DATABASE postgres IS 'Product templates have been removed in favor of industry-specific components';

