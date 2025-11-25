-- Allow email_events to track admin/transactional emails without campaigns
-- Make campaign_id and scheduled_email_id/brevo_email_id nullable for admin-sent emails

-- Check if table exists first
DO $$
BEGIN
  -- Make campaign_id nullable if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE email_events ALTER COLUMN campaign_id DROP NOT NULL;
  END IF;

  -- Handle scheduled_email_id (old name) or brevo_email_id (new name)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'scheduled_email_id'
  ) THEN
    ALTER TABLE email_events ALTER COLUMN scheduled_email_id DROP NOT NULL;
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'brevo_email_id'
  ) THEN
    ALTER TABLE email_events ALTER COLUMN brevo_email_id DROP NOT NULL;
  END IF;
END $$;

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
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'campaign_id'
  ) THEN
    COMMENT ON COLUMN email_events.campaign_id IS 'Campaign ID (null for admin/transactional emails)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'scheduled_email_id'
  ) THEN
    COMMENT ON COLUMN email_events.scheduled_email_id IS 'Scheduled email ID (null for admin/transactional emails)';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'brevo_email_id'
  ) THEN
    COMMENT ON COLUMN email_events.brevo_email_id IS 'Brevo email ID (null for admin/transactional emails)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_events' AND column_name = 'tags'
  ) THEN
    COMMENT ON COLUMN email_events.tags IS 'Email tags for categorization (e.g., admin-transactional, welcome, password-reset)';
  END IF;
END $$;

