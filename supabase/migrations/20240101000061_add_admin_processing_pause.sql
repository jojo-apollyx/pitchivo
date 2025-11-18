-- ============================================================================
-- ADD ADMIN PROCESSING PAUSE TO CAMPAIGNS
-- ============================================================================
-- Add admin-only flag to pause email processing for a campaign
-- This is separate from the user-visible campaign status

-- Add admin_processing_paused column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS admin_processing_paused BOOLEAN NOT NULL DEFAULT false;

-- Add admin_pause_reason column for tracking why it was paused
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS admin_pause_reason TEXT;

-- Add admin_paused_at timestamp
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS admin_paused_at TIMESTAMPTZ;

-- Add admin_paused_by to track which admin paused it
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS admin_paused_by UUID REFERENCES auth.users(id);

-- Add index for faster lookups of paused campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_admin_processing_paused 
ON campaigns(admin_processing_paused) 
WHERE admin_processing_paused = true;

-- Comments for documentation
COMMENT ON COLUMN campaigns.admin_processing_paused IS 'Admin-only flag to temporarily stop cron job from processing this campaign. Not visible to regular users.';
COMMENT ON COLUMN campaigns.admin_pause_reason IS 'Optional reason why admin paused the campaign processing';
COMMENT ON COLUMN campaigns.admin_paused_at IS 'Timestamp when campaign processing was paused by admin';
COMMENT ON COLUMN campaigns.admin_paused_by IS 'User ID of admin who paused the campaign processing';

