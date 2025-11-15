-- ============================================================================
-- CAMPAIGNS
-- ============================================================================
-- Table to store email campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  
  -- Campaign details
  campaign_name TEXT NOT NULL,
  data_source_id TEXT NOT NULL DEFAULT 'pitchville_curated',
  buyer_count INTEGER NOT NULL DEFAULT 0,
  
  -- Sending configuration
  email_count INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date TIMESTAMPTZ,
  sender_email TEXT NOT NULL,
  sender_health TEXT NOT NULL DEFAULT 'healthy' CHECK (sender_health IN ('healthy', 'warming_up', 'caution', 'poor')),
  
  -- Campaign status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Metrics
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_delivered INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_clicked INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  rfqs_received INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_org_id ON campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_product_id ON campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_launched_at ON campaigns(launched_at DESC);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see campaigns from their organization
CREATE POLICY "Users can view campaigns from their organization"
  ON campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = campaigns.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can insert campaigns for their organization
CREATE POLICY "Users can insert campaigns for their organization"
  ON campaigns
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = campaigns.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can update campaigns from their organization
CREATE POLICY "Users can update campaigns from their organization"
  ON campaigns
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = campaigns.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can delete campaigns from their organization
CREATE POLICY "Users can delete campaigns from their organization"
  ON campaigns
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = campaigns.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- ============================================================================
-- CAMPAIGN ACTIVITIES
-- ============================================================================
-- Table to store campaign activity events
CREATE TABLE IF NOT EXISTS campaign_activities (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN ('email_sent', 'email_opened', 'email_clicked', 'email_bounced', 'product_viewed', 'rfq_submitted')),
  buyer_company TEXT,
  contact_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_activities_campaign_id ON campaign_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_type ON campaign_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_campaign_activities_created_at ON campaign_activities(created_at DESC);

-- Enable RLS
ALTER TABLE campaign_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view activities from their organization's campaigns
CREATE POLICY "Users can view activities from their organization's campaigns"
  ON campaign_activities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN user_profiles ON user_profiles.organization_id = campaigns.org_id
      WHERE campaigns.campaign_id = campaign_activities.campaign_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Policy: Users can insert activities for their organization's campaigns
CREATE POLICY "Users can insert activities for their organization's campaigns"
  ON campaign_activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN user_profiles ON user_profiles.organization_id = campaigns.org_id
      WHERE campaigns.campaign_id = campaign_activities.campaign_id
      AND user_profiles.id = auth.uid()
    )
  );

