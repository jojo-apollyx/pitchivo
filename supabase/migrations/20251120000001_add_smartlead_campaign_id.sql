-- Add Smartlead campaign ID to campaigns table
-- This enables integration with Smartlead for campaign management
-- while keeping Brevo for email sending and tracking

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS smartlead_campaign_id TEXT;

-- Create index for faster lookups by Smartlead campaign ID
CREATE INDEX IF NOT EXISTS idx_campaigns_smartlead_id 
ON campaigns(smartlead_campaign_id) 
WHERE smartlead_campaign_id IS NOT NULL;

-- Add comment explaining the column's purpose
COMMENT ON COLUMN campaigns.smartlead_campaign_id IS 'Smartlead campaign ID for campaign management integration. Used to sync campaign status and analytics with Smartlead platform.';

