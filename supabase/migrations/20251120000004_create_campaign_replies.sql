-- Create Campaign Replies Table
-- Stores replies received from leads via Smartlead campaigns
-- Allows admins to view, respond to, and manage lead replies

CREATE TABLE IF NOT EXISTS campaign_replies (
  reply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  lead_id UUID REFERENCES campaign_leads(lead_id) ON DELETE SET NULL,
  lead_email TEXT NOT NULL,
  reply_subject TEXT,
  reply_text TEXT NOT NULL,
  replied_at TIMESTAMPTZ NOT NULL,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_read BOOLEAN DEFAULT FALSE,
  admin_notes TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_campaign_replies_campaign 
ON campaign_replies(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_replies_lead 
ON campaign_replies(lead_id);

CREATE INDEX IF NOT EXISTS idx_campaign_replies_email 
ON campaign_replies(lead_email);

CREATE INDEX IF NOT EXISTS idx_campaign_replies_is_read 
ON campaign_replies(is_read);

CREATE INDEX IF NOT EXISTS idx_campaign_replies_sentiment 
ON campaign_replies(sentiment);

CREATE INDEX IF NOT EXISTS idx_campaign_replies_replied_at 
ON campaign_replies(replied_at DESC);

-- Add table comment
COMMENT ON TABLE campaign_replies IS 'Replies received from leads in Smartlead campaigns. Populated via Smartlead webhook when leads reply to campaign emails.';
COMMENT ON COLUMN campaign_replies.sentiment IS 'AI-detected sentiment: positive (interested), neutral (neutral), negative (not interested/spam)';
COMMENT ON COLUMN campaign_replies.is_read IS 'Whether admin has read this reply';
COMMENT ON COLUMN campaign_replies.responded_at IS 'When admin responded to this reply';

-- Enable RLS
ALTER TABLE campaign_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all campaign replies"
  ON campaign_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

CREATE POLICY "Users can view their organization's campaign replies"
  ON campaign_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN user_profiles ON user_profiles.organization_id = campaigns.org_id
      WHERE campaigns.campaign_id = campaign_replies.campaign_id
      AND user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update campaign replies"
  ON campaign_replies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_campaign_replies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_replies_updated_at
  BEFORE UPDATE ON campaign_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_replies_updated_at();

