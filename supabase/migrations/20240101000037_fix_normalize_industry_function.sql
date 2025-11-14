-- ============================================================================
-- FIX NORMALIZE INDUSTRY FUNCTION
-- ============================================================================
-- This migration fixes the normalize_industry_code function to work without
-- the industries table (which was dropped in migration 30)

-- Update normalize_industry_code to work without industries table
CREATE OR REPLACE FUNCTION normalize_industry_code(industry_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- If NULL, return NULL
  IF industry_value IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- List of valid industry codes (from hardcoded constants)
  -- If the value is already a valid industry code, return it as-is
  IF industry_value IN (
    'food_supplement',
    'chemicals_raw_materials',
    'pharmaceuticals',
    'cosmetics_personal_care',
    'other',
    -- Legacy codes for backward compatibility
    'supplements_food_ingredients'
  ) THEN
    RETURN industry_value;
  END IF;
  
  -- Convert old industry names to new codes
  RETURN CASE
    WHEN industry_value = 'Food & Supplement Ingredients' THEN 'food_supplement'
    WHEN industry_value = 'Nutritional Supplements / Food Ingredients' THEN 'food_supplement'
    WHEN industry_value = 'Chemicals & Raw Materials' THEN 'chemicals_raw_materials'
    WHEN industry_value = 'Pharmaceuticals' THEN 'pharmaceuticals'
    WHEN industry_value = 'Cosmetics & Personal Care' THEN 'cosmetics_personal_care'
    WHEN industry_value = 'Other' THEN 'other'
    -- Legacy code mapping
    WHEN industry_value = 'supplements_food_ingredients' THEN 'food_supplement'
    ELSE industry_value  -- Return as-is if no match (let validation handle it)
  END;
END;
$$;

COMMENT ON FUNCTION normalize_industry_code IS 'Converts old industry names to new industry codes. Works without industries table (now using hardcoded constants).';

