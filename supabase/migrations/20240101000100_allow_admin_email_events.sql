-- Allow email_events to track admin/transactional emails without campaigns
-- Make campaign_id and scheduled_email_id nullable for admin-sent emails

ALTER TABLE email_events
ALTER COLUMN campaign_id DROP NOT NULL,
ALTER COLUMN scheduled_email_id DROP NOT NULL;

-- Add index for admin emails (those without campaign_id)
CREATE INDEX IF NOT EXISTS idx_email_events_admin_emails 
  ON email_events(brevo_message_id, event_timestamp DESC) 
  WHERE campaign_id IS NULL;

-- Add tag field to distinguish email types
ALTER TABLE email_events
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index on tags for filtering
CREATE INDEX IF NOT EXISTS idx_email_events_tags 
  ON email_events USING GIN(tags);

-- Comments
COMMENT ON COLUMN email_events.campaign_id IS 'Campaign ID (null for admin/transactional emails)';
COMMENT ON COLUMN email_events.scheduled_email_id IS 'Scheduled email ID (null for admin/transactional emails)';
COMMENT ON COLUMN email_events.tags IS 'Email tags for categorization (e.g., admin-transactional, welcome, password-reset)';

