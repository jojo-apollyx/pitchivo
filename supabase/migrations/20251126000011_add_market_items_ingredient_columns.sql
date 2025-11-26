-- ============================================================================
-- ADD COLUMNS TO leads_market_items FOR INGREDIENT COLLECTION
-- ============================================================================
-- Add is_standard_ingredient flag to distinguish ingredients from Ingredient collection
-- Add logo_url column for ingredient logos

ALTER TABLE leads_market_items
  ADD COLUMN IF NOT EXISTS is_standard_ingredient BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create index for filtering standard ingredients
CREATE INDEX IF NOT EXISTS idx_leads_market_items_is_standard_ingredient 
  ON leads_market_items(is_standard_ingredient) 
  WHERE is_standard_ingredient = true;

-- Create index for logo_url queries
CREATE INDEX IF NOT EXISTS idx_leads_market_items_logo_url 
  ON leads_market_items(logo_url) 
  WHERE logo_url IS NOT NULL;

