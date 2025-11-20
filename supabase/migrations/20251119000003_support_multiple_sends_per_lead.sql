-- ============================================================================
-- SUPPORT MULTIPLE SENDS PER LEAD
-- ============================================================================
-- This migration enables tracking multiple email sends to the same lead
-- and associates events with specific send actions

-- Add send_sequence_number to track multiple sends to the same lead
-- This helps distinguish between first send, second send, etc.
ALTER TABLE scheduled_emails 
ADD COLUMN IF NOT EXISTS send_sequence_number INTEGER NOT NULL DEFAULT 1;

-- Create index for efficient querying of send sequences
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_lead_sequence 
ON scheduled_emails(lead_id, send_sequence_number DESC) 
WHERE lead_id IS NOT NULL;

-- Add constraint to ensure uniqueness of (lead_id, send_sequence_number) for same campaign
-- This prevents duplicate sequence numbers for the same lead in the same campaign
CREATE UNIQUE INDEX IF NOT EXISTS idx_scheduled_emails_lead_campaign_sequence 
ON scheduled_emails(lead_id, campaign_id, send_sequence_number) 
WHERE lead_id IS NOT NULL AND status != 'cancelled';

-- Add helper function to get next send sequence number for a lead
CREATE OR REPLACE FUNCTION get_next_send_sequence(p_lead_id UUID, p_campaign_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_next_sequence INTEGER;
BEGIN
  SELECT COALESCE(MAX(send_sequence_number), 0) + 1
  INTO v_next_sequence
  FROM scheduled_emails
  WHERE lead_id = p_lead_id 
    AND campaign_id = p_campaign_id;
  
  RETURN v_next_sequence;
END;
$$ LANGUAGE plpgsql;

-- Update email_events to reference send_sequence_number
-- This allows us to group events by which send action they belong to
ALTER TABLE email_events
ADD COLUMN IF NOT EXISTS send_sequence_number INTEGER;

-- Create index for querying events by send sequence
CREATE INDEX IF NOT EXISTS idx_email_events_scheduled_email_sequence
ON email_events(scheduled_email_id, send_sequence_number, event_timestamp DESC);

-- Trigger to automatically populate send_sequence_number in email_events
-- when a new event is created, copy the send_sequence_number from scheduled_emails
CREATE OR REPLACE FUNCTION populate_event_send_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Get send_sequence_number from the scheduled email
  SELECT send_sequence_number
  INTO NEW.send_sequence_number
  FROM scheduled_emails
  WHERE scheduled_email_id = NEW.scheduled_email_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on email_events
DROP TRIGGER IF EXISTS email_events_populate_sequence_trigger ON email_events;
CREATE TRIGGER email_events_populate_sequence_trigger
  BEFORE INSERT ON email_events
  FOR EACH ROW
  EXECUTE FUNCTION populate_event_send_sequence();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON COLUMN scheduled_emails.send_sequence_number IS 'Tracks multiple sends to the same lead: 1 for first send, 2 for second send, etc.';
COMMENT ON COLUMN email_events.send_sequence_number IS 'Links event to specific send action - copied from scheduled_emails';
COMMENT ON FUNCTION get_next_send_sequence IS 'Returns the next send sequence number for a lead in a campaign';

