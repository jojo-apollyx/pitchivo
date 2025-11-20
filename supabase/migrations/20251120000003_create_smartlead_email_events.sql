-- Create Smartlead Email Events Table
-- This table tracks all email events from Smartlead campaigns
-- Smartlead handles campaign email sending, this tracks delivery, opens, clicks, replies, etc.

CREATE TABLE IF NOT EXISTS smartlead_email_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(lead_id) ON DELETE SET NULL,
  smartlead_campaign_id TEXT NOT NULL,
  smartlead_lead_id TEXT,
  lead_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_smartlead_events_campaign 
ON smartlead_email_events(campaign_id);

CREATE INDEX IF NOT EXISTS idx_smartlead_events_lead 
ON smartlead_email_events(lead_id);

CREATE INDEX IF NOT EXISTS idx_smartlead_events_email 
ON smartlead_email_events(lead_email);

CREATE INDEX IF NOT EXISTS idx_smartlead_events_type 
ON smartlead_email_events(event_type);

CREATE INDEX IF NOT EXISTS idx_smartlead_events_timestamp 
ON smartlead_email_events(event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_smartlead_events_smartlead_campaign 
ON smartlead_email_events(smartlead_campaign_id);

-- Add table comment
COMMENT ON TABLE smartlead_email_events IS 'Email event tracking from Smartlead webhooks. Tracks campaign email delivery, opens, clicks, bounces, replies, etc. Events are received via /api/webhooks/smartlead endpoint.';
COMMENT ON COLUMN smartlead_email_events.smartlead_campaign_id IS 'Smartlead campaign ID from webhook event';
COMMENT ON COLUMN smartlead_email_events.smartlead_lead_id IS 'Smartlead lead ID from webhook event';
COMMENT ON COLUMN smartlead_email_events.event_type IS 'Event type: sent, delivered, opened, clicked, bounced, replied, unsubscribed, etc.';
COMMENT ON COLUMN smartlead_email_events.metadata IS 'Additional event data from Smartlead: user agent, device, location, links, reply text, etc.';

-- Enable RLS
ALTER TABLE smartlead_email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admins can view all, users can view their org's events
CREATE POLICY "Admins can view all smartlead email events"
  ON smartlead_email_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their organization's smartlead email events"
  ON smartlead_email_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN user_profiles ON user_profiles.organization_id = campaigns.org_id
      WHERE campaigns.campaign_id = smartlead_email_events.campaign_id
      AND user_profiles.id = auth.uid()
    )
  );

