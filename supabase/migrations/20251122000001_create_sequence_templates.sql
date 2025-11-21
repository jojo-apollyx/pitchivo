-- Create Global Sequence Templates Table
-- Admin can create default sequence templates that can be used across all campaigns
CREATE TABLE IF NOT EXISTS global_sequence_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  seq_number INTEGER NOT NULL,
  subject TEXT,
  email_body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_name, seq_number)
);

-- Indexes for global_sequence_templates
CREATE INDEX IF NOT EXISTS idx_global_sequence_templates_name ON global_sequence_templates(template_name);
CREATE INDEX IF NOT EXISTS idx_global_sequence_templates_seq_number ON global_sequence_templates(seq_number);
CREATE INDEX IF NOT EXISTS idx_global_sequence_templates_active ON global_sequence_templates(is_active);

COMMENT ON TABLE global_sequence_templates IS 'Global default sequence templates that can be used across all campaigns';
COMMENT ON COLUMN global_sequence_templates.template_name IS 'Name of the template set (e.g., "Default Outreach", "Product Launch")';
COMMENT ON COLUMN global_sequence_templates.seq_number IS 'Sequence number (1, 2, 3, etc.)';
COMMENT ON COLUMN global_sequence_templates.email_body IS 'Email body with placeholders like {{product_url}}, {{user_org_name}}, {{product_name}}';

-- Create Campaign Sequence Templates Table
-- Campaigns can override global templates with custom sequences
CREATE TABLE IF NOT EXISTS campaign_sequence_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  seq_number INTEGER NOT NULL,
  subject TEXT,
  email_body TEXT NOT NULL,
  delay_days INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, seq_number)
);

-- Indexes for campaign_sequence_templates
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_templates_campaign ON campaign_sequence_templates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_templates_seq_number ON campaign_sequence_templates(seq_number);

COMMENT ON TABLE campaign_sequence_templates IS 'Campaign-specific sequence templates that override global templates';
COMMENT ON COLUMN campaign_sequence_templates.email_body IS 'Email body with placeholders like {{product_url}}, {{user_org_name}}, {{product_name}}';

-- Enable RLS
ALTER TABLE global_sequence_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sequence_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_sequence_templates
-- Only admins can manage global templates
CREATE POLICY "Admins can view global sequence templates"
  ON global_sequence_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

CREATE POLICY "Admins can insert global sequence templates"
  ON global_sequence_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

CREATE POLICY "Admins can update global sequence templates"
  ON global_sequence_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

CREATE POLICY "Admins can delete global sequence templates"
  ON global_sequence_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_pitchivo_admin = true
    )
  );

-- RLS Policies for campaign_sequence_templates
-- Users can manage templates for their own campaigns
CREATE POLICY "Users can view campaign sequence templates for their campaigns"
  ON campaign_sequence_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.campaign_id = campaign_sequence_templates.campaign_id
      AND (
        campaigns.org_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_pitchivo_admin = true
        )
      )
    )
  );

CREATE POLICY "Users can insert campaign sequence templates for their campaigns"
  ON campaign_sequence_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.campaign_id = campaign_sequence_templates.campaign_id
      AND (
        campaigns.org_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_pitchivo_admin = true
        )
      )
    )
  );

CREATE POLICY "Users can update campaign sequence templates for their campaigns"
  ON campaign_sequence_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.campaign_id = campaign_sequence_templates.campaign_id
      AND (
        campaigns.org_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_pitchivo_admin = true
        )
      )
    )
  );

CREATE POLICY "Users can delete campaign sequence templates for their campaigns"
  ON campaign_sequence_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.campaign_id = campaign_sequence_templates.campaign_id
      AND (
        campaigns.org_id IN (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.is_pitchivo_admin = true
        )
      )
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sequence_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_global_sequence_templates_updated_at
  BEFORE UPDATE ON global_sequence_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sequence_template_updated_at();

CREATE TRIGGER update_campaign_sequence_templates_updated_at
  BEFORE UPDATE ON campaign_sequence_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_sequence_template_updated_at();

