-- ============================================================================
-- CAMPAIGN LEADS TABLE
-- ============================================================================
-- Create table to persist campaign leads/contacts
CREATE TABLE IF NOT EXISTS campaign_leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  
  -- Contact information
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  title TEXT,
  company TEXT NOT NULL,
  country TEXT,
  industry TEXT,
  phone TEXT,
  linkedin_url TEXT,
  
  -- Lead status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'invalid')),
  
  -- Tracking
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_contacted TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique email per campaign
  UNIQUE(campaign_id, email)
);

-- Create indexes for campaign_leads
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_email ON campaign_leads(email);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_added_at ON campaign_leads(added_at DESC);

-- Enable RLS on campaign_leads
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_leads
DROP POLICY IF EXISTS "Allow authenticated users to view campaign leads" ON campaign_leads;
CREATE POLICY "Allow authenticated users to view campaign leads"
  ON campaign_leads FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert campaign leads" ON campaign_leads;
CREATE POLICY "Allow authenticated users to insert campaign leads"
  ON campaign_leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update campaign leads" ON campaign_leads;
CREATE POLICY "Allow authenticated users to update campaign leads"
  ON campaign_leads FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete campaign leads" ON campaign_leads;
CREATE POLICY "Allow authenticated users to delete campaign leads"
  ON campaign_leads FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================================
-- ENHANCE SCHEDULED_EMAILS TABLE
-- ============================================================================
-- Add missing columns to scheduled_emails for lead tracking and Brevo status

-- Add lead_id column (foreign key to campaign_leads)
ALTER TABLE scheduled_emails 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES campaign_leads(lead_id) ON DELETE SET NULL;

-- Add recipient_title column (used in code but missing in schema)
ALTER TABLE scheduled_emails 
ADD COLUMN IF NOT EXISTS recipient_title TEXT;

-- Add Brevo tracking columns
ALTER TABLE scheduled_emails 
ADD COLUMN IF NOT EXISTS brevo_message_id TEXT,
ADD COLUMN IF NOT EXISTS brevo_status TEXT CHECK (
  brevo_status IS NULL OR 
  brevo_status IN (
    'queued', 'sent', 'delivered', 'opened', 'clicked', 
    'hard_bounce', 'soft_bounce', 'spam', 'blocked', 
    'unsubscribed', 'error'
  )
),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bounce_reason TEXT,
ADD COLUMN IF NOT EXISTS spam_reported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

-- Create additional indexes for scheduled_emails
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_lead_id ON scheduled_emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_brevo_message_id ON scheduled_emails(brevo_message_id) WHERE brevo_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_brevo_status ON scheduled_emails(brevo_status) WHERE brevo_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_recipient_email ON scheduled_emails(recipient_email);

-- ============================================================================
-- HELPER FUNCTION: Update campaign_leads.updated_at on row update
-- ============================================================================
CREATE OR REPLACE FUNCTION update_campaign_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for campaign_leads
DROP TRIGGER IF EXISTS campaign_leads_updated_at_trigger ON campaign_leads;
CREATE TRIGGER campaign_leads_updated_at_trigger
  BEFORE UPDATE ON campaign_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_leads_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Update scheduled_emails.updated_at on row update
-- ============================================================================
CREATE OR REPLACE FUNCTION update_scheduled_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduled_emails (if not exists)
DROP TRIGGER IF EXISTS scheduled_emails_updated_at_trigger ON scheduled_emails;
CREATE TRIGGER scheduled_emails_updated_at_trigger
  BEFORE UPDATE ON scheduled_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_emails_updated_at();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE campaign_leads IS 'Stores leads/contacts for email campaigns with tracking and status management';
COMMENT ON COLUMN campaign_leads.status IS 'Lead status: active (can be contacted), unsubscribed (opted out), bounced (email bounced), invalid (invalid email)';
COMMENT ON COLUMN campaign_leads.last_contacted IS 'Last time this lead was contacted via email';

COMMENT ON COLUMN scheduled_emails.lead_id IS 'Reference to the campaign lead this email is for (optional)';
COMMENT ON COLUMN scheduled_emails.brevo_message_id IS 'Brevo/Sendinblue message ID for tracking';
COMMENT ON COLUMN scheduled_emails.brevo_status IS 'Current Brevo delivery status (updated via webhooks)';
COMMENT ON COLUMN scheduled_emails.delivered_at IS 'When the email was delivered (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.opened_at IS 'When the email was first opened (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.clicked_at IS 'When a link was first clicked (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.bounced_at IS 'When the email bounced (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.bounce_reason IS 'Reason for bounce (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.spam_reported_at IS 'When recipient marked as spam (from Brevo webhook)';
COMMENT ON COLUMN scheduled_emails.unsubscribed_at IS 'When recipient unsubscribed (from Brevo webhook)';

