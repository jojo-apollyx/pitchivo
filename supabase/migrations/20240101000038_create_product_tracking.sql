-- ============================================================================
-- PRODUCT ACCESS TRACKING
-- ============================================================================
-- Tables to track product page access, channel performance, and user actions

-- ============================================================================
-- PRODUCT_ACCESS_LOGS
-- ============================================================================
-- Tracks each product page visit/access
CREATE TABLE IF NOT EXISTS product_access_logs (
  -- Primary key
  access_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product reference
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Access method tracking
  access_method TEXT NOT NULL CHECK (access_method IN ('url', 'qr_code')),
  -- 'url' = direct link click, 'qr_code' = scanned QR code
  
  -- Channel tracking
  channel_id TEXT, -- e.g., 'email', 'expo', 'linkedin', null for direct access
  channel_name TEXT, -- Human-readable name from channel_links config
  
  -- Session & visitor tracking
  session_id TEXT NOT NULL, -- Client-side generated session ID (stored in localStorage/cookie)
  visitor_id TEXT, -- Anonymized visitor identifier (hash of IP + user agent)
  is_unique_visit BOOLEAN DEFAULT TRUE, -- First visit from this visitor_id to this product
  
  -- Request metadata (privacy-conscious)
  ip_address INET, -- For geolocation (can be anonymized)
  user_agent TEXT, -- Browser/device info
  referrer TEXT, -- Where they came from
  utm_source TEXT, -- UTM parameters if present
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Device & location (optional, from IP geolocation)
  country_code TEXT, -- ISO 3166-1 alpha-2
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet' (from user agent)
  
  -- Timestamps
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_logs_product_id ON product_access_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_org_id ON product_access_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_accessed_at ON product_access_logs(accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_logs_channel_id ON product_access_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_access_method ON product_access_logs(access_method);
CREATE INDEX IF NOT EXISTS idx_access_logs_session_id ON product_access_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_visitor_id ON product_access_logs(visitor_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_product_channel ON product_access_logs(product_id, channel_id);

-- ============================================================================
-- PRODUCT_ACCESS_ACTIONS
-- ============================================================================
-- Tracks specific user actions (clicks, downloads, RFQ submissions)
CREATE TABLE IF NOT EXISTS product_access_actions (
  -- Primary key
  action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to access log
  access_id UUID NOT NULL REFERENCES product_access_logs(access_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'page_view',      -- Initial page load
    'field_reveal',   -- Clicked to reveal after_click field
    'document_view',  -- Viewed a document preview
    'document_download', -- Downloaded a document
    'rfq_submit',     -- Submitted RFQ form
    'email_click',    -- Clicked email link
    'phone_click',    -- Clicked phone number
    'link_click',     -- Clicked external link
    'share_click'     -- Clicked share button
  )),
  
  -- Action metadata
  action_target TEXT, -- What was clicked (field name, document ID, link URL, etc.)
  action_metadata JSONB DEFAULT '{}'::jsonb, -- Additional context (e.g., which field, which document)
  
  -- Timestamps
  action_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_access_actions_access_id ON product_access_actions(access_id);
CREATE INDEX IF NOT EXISTS idx_access_actions_product_id ON product_access_actions(product_id);
CREATE INDEX IF NOT EXISTS idx_access_actions_org_id ON product_access_actions(org_id);
CREATE INDEX IF NOT EXISTS idx_access_actions_action_type ON product_access_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_access_actions_action_at ON product_access_actions(action_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_actions_type_at ON product_access_actions(action_type, action_at DESC);

-- ============================================================================
-- ENABLE RLS
-- ============================================================================
ALTER TABLE product_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_access_actions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - PRODUCT_ACCESS_LOGS
-- ============================================================================

-- Organization members can view their own product access logs
CREATE POLICY "Users can view access logs for their organization products"
  ON product_access_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = product_access_logs.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Public access (no auth) can insert logs
CREATE POLICY "Public can insert access logs"
  ON product_access_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES - PRODUCT_ACCESS_ACTIONS
-- ============================================================================

-- Organization members can view actions for their organization products
CREATE POLICY "Users can view actions for their organization products"
  ON product_access_actions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.organization_id = product_access_actions.org_id
      AND user_profiles.id = auth.uid()
    )
  );

-- Public access (no auth) can insert actions
CREATE POLICY "Public can insert access actions"
  ON product_access_actions
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- HELPER VIEW: PRODUCT CHANNEL PERFORMANCE
-- ============================================================================
-- Summary view for analytics dashboards
CREATE OR REPLACE VIEW product_channel_performance AS
SELECT 
  p.product_id,
  p.product_name,
  p.org_id,
  pal.channel_id,
  pal.channel_name,
  pal.access_method,
  COUNT(DISTINCT pal.access_id) as total_visits,
  COUNT(DISTINCT pal.visitor_id) as unique_visitors,
  COUNT(DISTINCT pal.session_id) as unique_sessions,
  COUNT(DISTINCT CASE WHEN pal.is_unique_visit THEN pal.visitor_id END) as first_time_visitors,
  COUNT(paa.action_id) FILTER (WHERE paa.action_type = 'document_download') as downloads,
  COUNT(paa.action_id) FILTER (WHERE paa.action_type = 'rfq_submit') as rfq_submissions,
  COUNT(paa.action_id) FILTER (WHERE paa.action_type = 'field_reveal') as field_reveals,
  MIN(pal.accessed_at) as first_access,
  MAX(pal.accessed_at) as last_access
FROM products p
LEFT JOIN product_access_logs pal ON p.product_id = pal.product_id
LEFT JOIN product_access_actions paa ON pal.access_id = paa.access_id
WHERE p.status = 'published'
GROUP BY p.product_id, p.product_name, p.org_id, pal.channel_id, pal.channel_name, pal.access_method;

-- Grant access to authenticated users
GRANT SELECT ON product_channel_performance TO authenticated;

COMMENT ON TABLE product_access_logs IS 'Tracks product page visits with channel and access method (URL vs QR code)';
COMMENT ON TABLE product_access_actions IS 'Tracks user actions on product pages (downloads, RFQ submissions, etc.)';
COMMENT ON VIEW product_channel_performance IS 'Summary view for product analytics showing channel performance metrics';

