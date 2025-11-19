-- ============================================================================
-- EMAIL EVENTS HISTORY TABLE
-- ============================================================================
-- This table stores a complete timeline of all events for each scheduled email
-- Allows tracking the full lifecycle: sent -> delivered -> opened -> clicked, etc.

CREATE TABLE IF NOT EXISTS email_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_email_id UUID NOT NULL REFERENCES scheduled_emails(scheduled_email_id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  
  -- Event details
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'sent', 'delivered', 'opened', 'unique_opened', 'first_opening',
      'clicked', 'hard_bounced', 'soft_bounced', 'blocked', 'invalid',
      'complaint', 'unsubscribed', 'deferred', 'error', 'loaded_by_proxy'
    )
  ),
  event_timestamp TIMESTAMPTZ NOT NULL,
  
  -- Tracking information
  recipient_email TEXT NOT NULL,
  brevo_message_id TEXT,
  
  -- Event metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Metadata can include:
  -- - ip: IP address that triggered the event
  -- - user_agent: Browser/client user agent
  -- - link: URL that was clicked (for click events)
  -- - device_used: DESKTOP, MOBILE, TABLET
  -- - reason: Bounce or error reason
  -- - sending_ip: IP used to send the email
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_events_scheduled_email 
  ON email_events(scheduled_email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign 
  ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type 
  ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_timestamp 
  ON email_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_email_events_brevo_message 
  ON email_events(brevo_message_id) WHERE brevo_message_id IS NOT NULL;

-- RLS Policies
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read email events
DROP POLICY IF EXISTS "Allow authenticated users to read email events" ON email_events;
CREATE POLICY "Allow authenticated users to read email events"
  ON email_events FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert email events (for webhooks)
DROP POLICY IF EXISTS "Allow service role to insert email events" ON email_events;
CREATE POLICY "Allow service role to insert email events"
  ON email_events FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE email_events IS 'Complete timeline of all email events for tracking delivery, opens, clicks, etc.';
COMMENT ON COLUMN email_events.event_type IS 'Type of email event: sent, delivered, opened, clicked, bounced, etc.';
COMMENT ON COLUMN email_events.event_timestamp IS 'When the event occurred (from Brevo webhook or our system)';
COMMENT ON COLUMN email_events.metadata IS 'Additional event data: IP, user agent, links, device info, error reasons, etc.';

