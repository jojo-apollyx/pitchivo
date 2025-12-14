-- ============================================================================
-- ADD HS CODE COLUMN TO leads_market_items
-- ============================================================================
-- Add HS (Harmonized System) code column for international trade classification

ALTER TABLE leads_market_items
  ADD COLUMN IF NOT EXISTS hs_code TEXT;

-- Create index for HS code queries
CREATE INDEX IF NOT EXISTS idx_leads_market_items_hs_code 
  ON leads_market_items(hs_code) 
  WHERE hs_code IS NOT NULL;

-- Add comment to column
COMMENT ON COLUMN leads_market_items.hs_code IS 'Harmonized System (HS) code for international trade classification (typically 6-10 digits)';

