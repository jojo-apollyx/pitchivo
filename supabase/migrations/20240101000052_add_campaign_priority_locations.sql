-- ============================================================================
-- ADD PRIORITY LOCATIONS TO CAMPAIGNS
-- ============================================================================
-- Add priority_locations field to campaigns table to store location preferences
-- selected in step 3 of campaign creation

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS priority_locations TEXT[] DEFAULT NULL;

COMMENT ON COLUMN campaigns.priority_locations IS 'Array of location names (countries) to prioritize when sending emails. NULL means no preference (target all locations equally).';

