-- Campaign Naming Schema Updates
-- Adds display_name and smartlead_name columns for multi-tenant campaign tracking

-- Add new columns to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS smartlead_name TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id);

-- Migrate existing data: campaign_name -> display_name
UPDATE campaigns 
SET display_name = campaign_name
WHERE display_name IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN campaigns.display_name IS 'User-facing campaign name (e.g., "Sodium Benzoate Campaign")';
COMMENT ON COLUMN campaigns.smartlead_name IS 'Smartlead campaign name with org/user context (e.g., "[ChemCorp] John - Sodium Benzoate Campaign")';
COMMENT ON COLUMN campaigns.created_by IS 'User who created the campaign';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_display_name ON campaigns(display_name);

-- Add campaign_lead_events table for tracking individual email events per lead
CREATE TABLE IF NOT EXISTS campaign_lead_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES campaign_leads(lead_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed'
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for campaign_lead_events
CREATE INDEX IF NOT EXISTS idx_campaign_lead_events_lead ON campaign_lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_lead_events_campaign ON campaign_lead_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_lead_events_type ON campaign_lead_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_lead_events_timestamp ON campaign_lead_events(event_timestamp DESC);

-- Add comments
COMMENT ON TABLE campaign_lead_events IS 'Individual email events per lead for detailed tracking';
COMMENT ON COLUMN campaign_lead_events.metadata IS 'Additional event data (message_id, link_url, etc.)';

-- Create email_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_accounts (
  account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smartlead_account_id INTEGER UNIQUE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL UNIQUE,
  smtp_host TEXT,
  smtp_port INTEGER,
  imap_host TEXT,
  imap_port INTEGER,
  daily_limit INTEGER DEFAULT 100,
  daily_sent INTEGER DEFAULT 0,
  is_smtp_success BOOLEAN DEFAULT false,
  warmup_enabled BOOLEAN DEFAULT false,
  warmup_reputation INTEGER DEFAULT 0,
  warmup_status TEXT DEFAULT 'inactive', -- 'active', 'inactive', 'paused'
  health_status TEXT DEFAULT 'unknown', -- 'healthy', 'warning', 'error'
  delivery_rate NUMERIC(5,2) DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for email_accounts
CREATE INDEX IF NOT EXISTS idx_email_accounts_org ON email_accounts(org_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_smartlead ON email_accounts(smartlead_account_id);
CREATE INDEX IF NOT EXISTS idx_email_accounts_email ON email_accounts(from_email);

-- Add comments
COMMENT ON TABLE email_accounts IS 'Email sending accounts configured in Smartlead';
COMMENT ON COLUMN email_accounts.smartlead_account_id IS 'ID from Smartlead system';
COMMENT ON COLUMN email_accounts.warmup_reputation IS 'Warmup reputation score (0-100)';

-- Create campaign_email_accounts junction table (many-to-many)
CREATE TABLE IF NOT EXISTS campaign_email_accounts (
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  account_id UUID REFERENCES email_accounts(account_id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, account_id)
);

-- Index for campaign_email_accounts
CREATE INDEX IF NOT EXISTS idx_campaign_email_accounts_campaign ON campaign_email_accounts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_email_accounts_account ON campaign_email_accounts(account_id);

COMMENT ON TABLE campaign_email_accounts IS 'Links campaigns to their sending email accounts';

-- Create campaign_sequences table for storing email sequences
CREATE TABLE IF NOT EXISTS campaign_sequences (
  sequence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  smartlead_sequence_id INTEGER,
  seq_number INTEGER NOT NULL,
  subject TEXT,
  email_body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 1,
  variant_label TEXT DEFAULT 'A',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, seq_number, variant_label)
);

-- Indexes for campaign_sequences
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_campaign ON campaign_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequences_number ON campaign_sequences(seq_number);

COMMENT ON TABLE campaign_sequences IS 'Email sequences for campaigns';
COMMENT ON COLUMN campaign_sequences.variant_label IS 'A/B test variant (A, B, C, etc.)';

-- Update campaign_leads table to add more tracking fields
ALTER TABLE campaign_leads
ADD COLUMN IF NOT EXISTS smartlead_lead_id TEXT,
ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_sequence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS category_id INTEGER,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Add index for smartlead_lead_id
CREATE INDEX IF NOT EXISTS idx_campaign_leads_smartlead ON campaign_leads(smartlead_lead_id);

COMMENT ON COLUMN campaign_leads.smartlead_lead_id IS 'Lead ID from Smartlead system';
COMMENT ON COLUMN campaign_leads.current_sequence IS 'Current email sequence number the lead is on';
COMMENT ON COLUMN campaign_leads.category_id IS 'Smartlead category ID (Interested, Not Interested, etc.). Categories are defined in code constants, not in database.';

-- Update campaigns table with additional settings
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS sending_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Sunday, 1-5=Mon-Fri, 6=Saturday
ADD COLUMN IF NOT EXISTS sending_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}',
ADD COLUMN IF NOT EXISTS min_time_between_emails INTEGER DEFAULT 30, -- minutes
ADD COLUMN IF NOT EXISTS max_leads_per_day INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS track_opens BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS track_clicks BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS track_replies BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS stop_on_reply BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS stop_on_click BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stop_on_open BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS send_as_plain_text BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS follow_up_percentage INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS unsubscribe_text TEXT DEFAULT 'Unsubscribe',
ADD COLUMN IF NOT EXISTS smartlead_client_id INTEGER;

COMMENT ON COLUMN campaigns.sending_days IS 'Array of days to send (0=Sunday, 1=Monday, etc.)';
COMMENT ON COLUMN campaigns.sending_hours IS 'JSON with start and end time (24h format)';
COMMENT ON COLUMN campaigns.follow_up_percentage IS 'Percentage of leads to follow up (0-100)';

