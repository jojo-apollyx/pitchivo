-- Create email templates table for admins to save and reuse campaign email templates
CREATE TABLE IF NOT EXISTS email_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create scheduled emails table for batch email sending
CREATE TABLE IF NOT EXISTS scheduled_emails (
  scheduled_email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_company TEXT,
  recipient_name TEXT,
  template_id UUID REFERENCES email_templates(template_id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create email quality scores table to store AI analysis results
CREATE TABLE IF NOT EXISTS email_quality_scores (
  score_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(template_id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  spam_risk_level TEXT NOT NULL, -- low, medium, high
  issues JSONB DEFAULT '[]'::jsonb,
  suggestions JSONB DEFAULT '[]'::jsonb,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_templates_campaign ON email_templates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_default ON email_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_campaign ON scheduled_emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_status ON scheduled_emails(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_time ON scheduled_emails(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_email_quality_scores_campaign ON email_quality_scores(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_quality_scores_template ON email_quality_scores(template_id);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_quality_scores ENABLE ROW LEVEL SECURITY;

-- Policies for email_templates
DROP POLICY IF EXISTS "Allow authenticated users to view email templates" ON email_templates;
CREATE POLICY "Allow authenticated users to view email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert email templates" ON email_templates;
CREATE POLICY "Allow authenticated users to insert email templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update email templates" ON email_templates;
CREATE POLICY "Allow authenticated users to update email templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete email templates" ON email_templates;
CREATE POLICY "Allow authenticated users to delete email templates"
  ON email_templates FOR DELETE
  TO authenticated
  USING (true);

-- Policies for scheduled_emails
DROP POLICY IF EXISTS "Allow authenticated users to view scheduled emails" ON scheduled_emails;
CREATE POLICY "Allow authenticated users to view scheduled emails"
  ON scheduled_emails FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert scheduled emails" ON scheduled_emails;
CREATE POLICY "Allow authenticated users to insert scheduled emails"
  ON scheduled_emails FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update scheduled emails" ON scheduled_emails;
CREATE POLICY "Allow authenticated users to update scheduled emails"
  ON scheduled_emails FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete scheduled emails" ON scheduled_emails;
CREATE POLICY "Allow authenticated users to delete scheduled emails"
  ON scheduled_emails FOR DELETE
  TO authenticated
  USING (true);

-- Policies for email_quality_scores
DROP POLICY IF EXISTS "Allow authenticated users to view email quality scores" ON email_quality_scores;
CREATE POLICY "Allow authenticated users to view email quality scores"
  ON email_quality_scores FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert email quality scores" ON email_quality_scores;
CREATE POLICY "Allow authenticated users to insert email quality scores"
  ON email_quality_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add campaign settings for email scheduling
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS daily_email_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS emails_per_hour INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS sending_hours JSONB DEFAULT '[9, 10, 11, 14, 15, 16]'::jsonb,
ADD COLUMN IF NOT EXISTS auto_schedule_enabled BOOLEAN DEFAULT false;

-- Comments for documentation
COMMENT ON TABLE email_templates IS 'Stores reusable email templates for campaigns';
COMMENT ON TABLE scheduled_emails IS 'Manages batch email sending with scheduling';
COMMENT ON TABLE email_quality_scores IS 'Stores AI analysis results for email quality and spam risk';
COMMENT ON COLUMN campaigns.daily_email_limit IS 'Maximum emails to send per day for this campaign';
COMMENT ON COLUMN campaigns.emails_per_hour IS 'Maximum emails to send per hour';
COMMENT ON COLUMN campaigns.sending_hours IS 'Preferred hours of the day (0-23) for sending emails';
COMMENT ON COLUMN campaigns.auto_schedule_enabled IS 'Whether to automatically schedule emails when campaign is activated';

