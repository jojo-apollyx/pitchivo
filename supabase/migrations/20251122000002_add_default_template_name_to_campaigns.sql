-- Add default_template_name column to campaigns table
-- This allows campaigns to specify which global sequence template to use for auto-population

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS default_template_name TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_default_template_name ON campaigns(default_template_name);

-- Add comment
COMMENT ON COLUMN campaigns.default_template_name IS 'Name of the global sequence template to use for auto-populating sequences when campaign is created in Smartlead';

