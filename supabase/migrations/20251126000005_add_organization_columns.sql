-- ============================================================================
-- ADD COLUMNS TO leads_organizations
-- ============================================================================
-- Add slug, description, logo_url, and lead_source as columns instead of JSONB
-- This improves queryability, indexing, and performance

-- Add new columns
ALTER TABLE leads_organizations
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Migrate existing data from profile_data to columns (if any exists)
UPDATE leads_organizations
SET 
  slug = COALESCE(slug, profile_data->>'slug'),
  description = COALESCE(description, profile_data->>'description'),
  logo_url = COALESCE(logo_url, profile_data->>'logo_url'),
  lead_source = COALESCE(lead_source, profile_data->>'lead_source')
WHERE profile_data IS NOT NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_organizations_slug ON leads_organizations(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_organizations_description_fts ON leads_organizations USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_organizations_logo_url ON leads_organizations(logo_url) WHERE logo_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_organizations_lead_source ON leads_organizations(lead_source) WHERE lead_source IS NOT NULL;

-- Add unique constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_organizations_slug_unique ON leads_organizations(slug) WHERE slug IS NOT NULL;

-- ============================================================================
-- ADD lead_source COLUMN TO leads_contacts
-- ============================================================================
-- Add lead_source as a column for better queryability

ALTER TABLE leads_contacts
  ADD COLUMN IF NOT EXISTS lead_source TEXT;

-- Migrate existing data from attributes to column (if any exists)
UPDATE leads_contacts
SET lead_source = COALESCE(lead_source, attributes->>'lead_source')
WHERE attributes IS NOT NULL AND attributes->>'lead_source' IS NOT NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_leads_contacts_lead_source ON leads_contacts(lead_source) WHERE lead_source IS NOT NULL;

-- ============================================================================
-- ADD source COLUMN TO leads_signals (if missing)
-- ============================================================================
-- Check if source column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads_signals' AND column_name = 'source'
  ) THEN
    ALTER TABLE leads_signals ADD COLUMN source TEXT;
    CREATE INDEX IF NOT EXISTS idx_leads_signals_source ON leads_signals(source) WHERE source IS NOT NULL;
  END IF;
END $$;

