-- ============================================================================
-- ADD SENDER SUBDOMAINS TO CAMPAIGNS
-- ============================================================================
-- Add ability to select which Pitchivo subdomains to use for sending emails
-- Emails will be distributed evenly across selected subdomains

-- Add sender_subdomains column to campaigns table
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS sender_subdomains TEXT[] NOT NULL DEFAULT ARRAY['news', 'updates', 'info', 'alerts'];

-- Comment for documentation
COMMENT ON COLUMN campaigns.sender_subdomains IS 'Array of subdomain names (without @pitchivo.com) to use for sending campaign emails. Emails are distributed evenly across selected subdomains. Default: [news, updates, info, alerts]';

