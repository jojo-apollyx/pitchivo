-- Rename email_templates to brevo_email_templates
ALTER TABLE IF EXISTS email_templates RENAME TO brevo_email_templates;

-- Rename email_events to brevo_email_events
ALTER TABLE IF EXISTS email_events RENAME TO brevo_email_events;

-- Rename indexes
ALTER INDEX IF EXISTS idx_email_templates_category RENAME TO idx_brevo_email_templates_category;
ALTER INDEX IF EXISTS idx_email_templates_created_by RENAME TO idx_brevo_email_templates_created_by;
ALTER INDEX IF EXISTS idx_email_templates_name RENAME TO idx_brevo_email_templates_name;

ALTER INDEX IF EXISTS idx_email_events_scheduled_email RENAME TO idx_brevo_email_events_scheduled_email;
ALTER INDEX IF EXISTS idx_email_events_campaign RENAME TO idx_brevo_email_events_campaign;
ALTER INDEX IF EXISTS idx_email_events_type RENAME TO idx_brevo_email_events_type;
ALTER INDEX IF EXISTS idx_email_events_timestamp RENAME TO idx_brevo_email_events_timestamp;
ALTER INDEX IF EXISTS idx_email_events_brevo_message RENAME TO idx_brevo_email_events_brevo_message;
ALTER INDEX IF EXISTS idx_email_events_scheduled_email_sequence RENAME TO idx_brevo_email_events_scheduled_email_sequence;
ALTER INDEX IF EXISTS idx_email_events_admin_emails RENAME TO idx_brevo_email_events_admin_emails;
ALTER INDEX IF EXISTS idx_email_events_tags RENAME TO idx_brevo_email_events_tags;

-- Rename triggers
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'email_events_populate_sequence_trigger'
  ) THEN
    ALTER TRIGGER email_events_populate_sequence_trigger ON brevo_email_events RENAME TO brevo_email_events_populate_sequence_trigger;
  END IF;
END $$;

-- Note: RLS policies are automatically attached to the renamed table
-- Policy names remain the same but work with the new table name

-- Update table comments
COMMENT ON TABLE brevo_email_templates IS 'Global reusable email templates for Brevo transactional emails (not campaign-specific)';
COMMENT ON TABLE brevo_email_events IS 'Email event tracking from Brevo webhooks for transactional emails. Tracks delivery, opens, clicks, bounces, etc. Events are received via /api/webhooks/brevo endpoint. For campaign emails, see smartlead_email_events table.';

