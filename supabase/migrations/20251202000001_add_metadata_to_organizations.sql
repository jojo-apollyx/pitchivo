-- ============================================================================
-- ADD METADATA COLUMN TO leads_organizations
-- ============================================================================
-- Add a metadata JSONB column to store additional flexible metadata
-- This is separate from profile_data which is used for enrichment data

ALTER TABLE leads_organizations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_leads_organizations_metadata 
    ON leads_organizations USING GIN(metadata)
    WHERE metadata != '{}'::jsonb;

-- Add comment
COMMENT ON COLUMN leads_organizations.metadata IS 'Flexible metadata storage as JSON blob for additional organization data';

