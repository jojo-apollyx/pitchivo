-- Rename scheduled_emails to brevo_transactional_emails
-- Clarifies that this table is ONLY for Brevo transactional emails (admin sends)
-- Campaign emails are handled by Smartlead

-- Rename table
ALTER TABLE IF EXISTS scheduled_emails 
RENAME TO brevo_transactional_emails;

-- Rename primary key column for clarity
ALTER TABLE brevo_transactional_emails 
RENAME COLUMN scheduled_email_id TO brevo_email_id;

-- Add email_type column to categorize transactional emails
ALTER TABLE brevo_transactional_emails
ADD COLUMN IF NOT EXISTS email_type TEXT DEFAULT 'test';

COMMENT ON COLUMN brevo_transactional_emails.email_type IS 'Type of transactional email: user_notification, admin_alert, system, test, support, or custom. Used to categorize non-campaign emails.';

-- Update indexes
DROP INDEX IF EXISTS idx_scheduled_emails_campaign;
DROP INDEX IF EXISTS idx_scheduled_emails_recipient;
DROP INDEX IF EXISTS idx_scheduled_emails_status;
DROP INDEX IF EXISTS idx_scheduled_emails_scheduled_time;
DROP INDEX IF EXISTS idx_scheduled_emails_brevo_message_id;

CREATE INDEX IF NOT EXISTS idx_brevo_transactional_campaign 
ON brevo_transactional_emails(campaign_id);

CREATE INDEX IF NOT EXISTS idx_brevo_transactional_recipient 
ON brevo_transactional_emails(recipient_email);

CREATE INDEX IF NOT EXISTS idx_brevo_transactional_status 
ON brevo_transactional_emails(status);

CREATE INDEX IF NOT EXISTS idx_brevo_transactional_scheduled_time 
ON brevo_transactional_emails(scheduled_time);

CREATE INDEX IF NOT EXISTS idx_brevo_transactional_message_id 
ON brevo_transactional_emails(brevo_message_id);

-- Update table and column comments
COMMENT ON TABLE brevo_transactional_emails IS 'Brevo transactional emails: ALL non-campaign emails including user notifications, admin notifications, system emails, password resets, welcome emails, test sends, etc. NOT for marketing campaign emails (those go through Smartlead). Tracks Brevo email delivery status via Brevo webhooks.';
COMMENT ON COLUMN brevo_transactional_emails.brevo_email_id IS 'Unique identifier for this Brevo transactional email';
COMMENT ON COLUMN brevo_transactional_emails.campaign_id IS 'Optional reference to campaign (for context only, like admin test sends). Email is sent via Brevo, not Smartlead.';
COMMENT ON COLUMN brevo_transactional_emails.brevo_message_id IS 'Brevo message ID for tracking via Brevo webhooks';
COMMENT ON COLUMN brevo_transactional_emails.brevo_status IS 'Email delivery status from Brevo webhooks (sent, delivered, opened, clicked, bounced, etc.)';

-- Update email_events table to reference new table
ALTER TABLE email_events 
RENAME COLUMN scheduled_email_id TO brevo_email_id;

-- Update email_events table comment
COMMENT ON TABLE email_events IS 'Email event tracking from Brevo webhooks for transactional emails. Tracks delivery, opens, clicks, bounces, etc. Events are received via /api/webhooks/brevo endpoint. For campaign emails, see smartlead_email_events table.';
COMMENT ON COLUMN email_events.brevo_email_id IS 'Reference to brevo_transactional_emails table';

-- Note: RLS policies will automatically apply with the renamed table
-- If there are specific policy names that need updating, do so here:
-- DROP POLICY IF EXISTS "old_policy_name" ON brevo_transactional_emails;
-- CREATE POLICY "new_policy_name" ON brevo_transactional_emails ...

