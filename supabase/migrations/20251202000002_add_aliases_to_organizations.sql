-- ============================================================================
-- ADD ALIASES COLUMN TO leads_organizations
-- ============================================================================
-- Add aliases column to store alternative names, variations, or aliases
-- for the organization (e.g., legal names, DBA names, common misspellings)

ALTER TABLE leads_organizations
ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- Create GIN index for efficient array queries
CREATE INDEX IF NOT EXISTS idx_leads_organizations_aliases 
    ON leads_organizations USING GIN(aliases)
    WHERE array_length(aliases, 1) > 0;

-- Add comment
COMMENT ON COLUMN leads_organizations.aliases IS 'Alternative names, variations, or aliases for the organization (e.g., legal names, DBA names, common misspellings)';

