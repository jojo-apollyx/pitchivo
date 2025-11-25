-- ============================================================================
-- ADD COLUMNS TO leads_market_items
-- ============================================================================
-- Move description to column for full-text search

ALTER TABLE leads_market_items
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Migrate existing data from attributes to column (if any exists)
UPDATE leads_market_items
SET description = COALESCE(description, attributes->>'description')
WHERE attributes IS NOT NULL AND attributes->>'description' IS NOT NULL;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_leads_market_items_description_fts ON leads_market_items 
  USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- ============================================================================
-- ADD COLUMNS TO leads_contacts
-- ============================================================================
-- Move commonly queried fields from attributes JSONB to columns

ALTER TABLE leads_contacts
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

-- Migrate existing data from attributes to columns (if any exists)
UPDATE leads_contacts
SET 
  phone = COALESCE(phone, attributes->>'phone'),
  department = COALESCE(department, attributes->>'department')
WHERE attributes IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_contacts_phone ON leads_contacts(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_contacts_department ON leads_contacts(department) WHERE department IS NOT NULL;

