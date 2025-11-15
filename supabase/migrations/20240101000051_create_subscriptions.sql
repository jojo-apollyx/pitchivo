-- ============================================================================
-- SUBSCRIPTIONS & PRICING
-- ============================================================================

-- Pricing tiers enum
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium', 'enterprise');

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'past_due', 'canceled', 'trialing');

-- Table to store organization subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Stripe details
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Subscription details
  tier subscription_tier NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  
  -- Billing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Quota limits (can be overridden by admin)
  email_quota INTEGER NOT NULL DEFAULT 30,
  qr_links_per_product INTEGER NOT NULL DEFAULT 3,
  custom_quota_override BOOLEAN DEFAULT FALSE, -- Set to true if admin overrides
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ
);

-- Table to track quota usage per billing period
CREATE TABLE IF NOT EXISTS quota_usage (
  usage_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Period tracking
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Usage counters
  emails_sent INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one usage record per period
  UNIQUE(org_id, period_start, period_end)
);

-- Table to track QR/custom links per product
CREATE TABLE IF NOT EXISTS product_links (
  link_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Link details
  link_type TEXT NOT NULL CHECK (link_type IN ('qr', 'custom')),
  link_url TEXT NOT NULL,
  link_name TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tier ON subscriptions(tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_quota_usage_org_id ON quota_usage(org_id);
CREATE INDEX IF NOT EXISTS idx_quota_usage_period ON quota_usage(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_product_links_product_id ON product_links(product_id);
CREATE INDEX IF NOT EXISTS idx_product_links_org_id ON product_links(org_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quota_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view their organization's subscription"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = subscriptions.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- RLS Policies for quota_usage
CREATE POLICY "Users can view their organization's quota usage"
  ON quota_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = quota_usage.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- RLS Policies for product_links
CREATE POLICY "Users can view their organization's product links"
  ON product_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = product_links.org_id
      AND user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert product links for their organization"
  ON product_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = product_links.org_id
      AND user_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's product links"
  ON product_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = product_links.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Function to get tier quotas
CREATE OR REPLACE FUNCTION get_tier_quotas(tier_name subscription_tier)
RETURNS TABLE(email_quota INTEGER, qr_links_per_product INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE tier_name
      WHEN 'free' THEN 30
      WHEN 'basic' THEN 400
      WHEN 'premium' THEN 2000
      WHEN 'enterprise' THEN 999999 -- Unlimited represented as large number
    END AS email_quota,
    CASE tier_name
      WHEN 'free' THEN 3
      WHEN 'basic' THEN 10
      WHEN 'premium' THEN 999999 -- Unlimited
      WHEN 'enterprise' THEN 999999 -- Unlimited
    END AS qr_links_per_product;
END;
$$ LANGUAGE plpgsql;

-- Function to initialize subscription for new organization
CREATE OR REPLACE FUNCTION initialize_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (org_id, tier, status, email_quota, qr_links_per_product)
  VALUES (NEW.id, 'free', 'active', 30, 3);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create subscription when organization is created
CREATE TRIGGER auto_create_subscription
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION initialize_subscription();

-- Function to get current quota usage for organization
CREATE OR REPLACE FUNCTION get_current_quota_usage(org_uuid UUID)
RETURNS TABLE(
  emails_sent INTEGER,
  email_quota INTEGER,
  emails_remaining INTEGER,
  qr_links_count INTEGER,
  qr_links_quota INTEGER
) AS $$
DECLARE
  current_sub RECORD;
  current_usage RECORD;
BEGIN
  -- Get subscription details
  SELECT * INTO current_sub
  FROM subscriptions
  WHERE org_id = org_uuid;
  
  IF NOT FOUND THEN
    -- No subscription found, return defaults
    RETURN QUERY SELECT 0, 30, 30, 0, 3;
    RETURN;
  END IF;
  
  -- Get current period usage
  SELECT * INTO current_usage
  FROM quota_usage
  WHERE org_id = org_uuid
    AND period_start <= NOW()
    AND period_end >= NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Return usage stats
  RETURN QUERY SELECT 
    COALESCE(current_usage.emails_sent, 0)::INTEGER,
    current_sub.email_quota::INTEGER,
    (current_sub.email_quota - COALESCE(current_usage.emails_sent, 0))::INTEGER,
    (SELECT COUNT(*)::INTEGER FROM product_links WHERE org_id = org_uuid),
    current_sub.qr_links_per_product::INTEGER;
END;
$$ LANGUAGE plpgsql;

