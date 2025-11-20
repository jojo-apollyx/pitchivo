-- Update Campaigns Table for Smartlead-First Architecture
-- Remove/clarify Brevo-specific columns since campaigns now go through Smartlead

-- Add new Smartlead-specific columns
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS replies_received INTEGER DEFAULT 0;

-- Add comments to clarify column usage
COMMENT ON COLUMN campaigns.sender_email IS 'Legacy field - kept for reference. Campaign emails are sent via Smartlead using their email accounts.';
COMMENT ON COLUMN campaigns.sender_subdomains IS 'Brevo sender subdomains for transactional admin emails only. Not used for campaign sends.';
COMMENT ON COLUMN campaigns.sender_health IS 'Legacy field - kept for backwards compatibility. Smartlead manages sender health.';
COMMENT ON COLUMN campaigns.emails_sent IS 'Total campaign emails sent (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.emails_delivered IS 'Total campaign emails delivered (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.emails_opened IS 'Total campaign emails opened (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.emails_clicked IS 'Total campaign emails clicked (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.emails_bounced IS 'Total campaign emails bounced (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.replies_received IS 'Total replies received from campaign leads (tracked via Smartlead webhooks)';
COMMENT ON COLUMN campaigns.smartlead_campaign_id IS 'Smartlead campaign ID for campaign management integration. Used to sync campaign status and analytics with Smartlead platform.';

-- Update table comment
COMMENT ON TABLE campaigns IS 'Campaign management table. Campaigns are created and managed via Smartlead (smartlead_campaign_id). Email sending and tracking is handled by Smartlead. Brevo is used only for transactional admin emails.';

