-- Fix references to old scheduled_emails table and scheduled_email_id column
-- After renaming to brevo_transactional_emails and brevo_email_id, these functions and indexes need updating
-- This migration also cleans up any remaining scheduled_email_id columns and old function names

-- ============================================================================
-- CLEANUP: Remove scheduled_email_id column if it still exists
-- ============================================================================
DO $$
BEGIN
  -- Drop scheduled_email_id column from brevo_email_events if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brevo_email_events' AND column_name = 'scheduled_email_id'
  ) THEN
    ALTER TABLE brevo_email_events DROP COLUMN scheduled_email_id;
    RAISE NOTICE 'Dropped scheduled_email_id column from brevo_email_events';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP: Drop old function if it exists
-- ============================================================================
DROP FUNCTION IF EXISTS update_scheduled_emails_updated_at() CASCADE;

-- ============================================================================
-- UPDATE: Fix trigger function and helper functions
-- ============================================================================
-- Update the trigger function to use the new table and column names
CREATE OR REPLACE FUNCTION populate_event_send_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Get send_sequence_number from the brevo transactional email
  -- Only populate if brevo_email_id is not null (for transactional emails)
  IF NEW.brevo_email_id IS NOT NULL THEN
    SELECT send_sequence_number
    INTO NEW.send_sequence_number
    FROM brevo_transactional_emails
    WHERE brevo_email_id = NEW.brevo_email_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the helper function to use the new table name
CREATE OR REPLACE FUNCTION get_next_send_sequence(p_lead_id UUID, p_campaign_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(send_sequence_number), 0) + 1
  INTO v_next_sequence
  FROM brevo_transactional_emails
  WHERE lead_id = p_lead_id 
    AND campaign_id = p_campaign_id;
  
  RETURN v_next_sequence;
END;
$$ LANGUAGE plpgsql;

-- Update the index to use the new column name and table name
DROP INDEX IF EXISTS idx_email_events_scheduled_email_sequence;
DROP INDEX IF EXISTS idx_brevo_email_events_scheduled_email_sequence;
CREATE INDEX IF NOT EXISTS idx_brevo_email_events_brevo_email_sequence
ON brevo_email_events(brevo_email_id, send_sequence_number, event_timestamp DESC)
WHERE brevo_email_id IS NOT NULL;

-- Update the trigger function name for consistency (function body doesn't need changes)
CREATE OR REPLACE FUNCTION update_brevo_transactional_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with new name on the renamed table
DROP TRIGGER IF EXISTS scheduled_emails_updated_at_trigger ON brevo_transactional_emails;
DROP TRIGGER IF EXISTS brevo_transactional_emails_updated_at_trigger ON brevo_transactional_emails;
CREATE TRIGGER brevo_transactional_emails_updated_at_trigger
  BEFORE UPDATE ON brevo_transactional_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_brevo_transactional_emails_updated_at();

-- ============================================================================
-- CLEANUP: Drop old indexes with scheduled_email in the name
-- ============================================================================
DROP INDEX IF EXISTS idx_email_events_scheduled_email;
DROP INDEX IF EXISTS idx_brevo_email_events_scheduled_email;

-- ============================================================================
-- UPDATE: Comments to reflect new table/column names
-- ============================================================================
COMMENT ON COLUMN brevo_transactional_emails.send_sequence_number IS 'Tracks multiple sends to the same lead: 1 for first send, 2 for second send, etc.';
COMMENT ON COLUMN brevo_email_events.send_sequence_number IS 'Links event to specific send action - copied from brevo_transactional_emails';
COMMENT ON FUNCTION get_next_send_sequence IS 'Returns the next send sequence number for a lead in a campaign';

