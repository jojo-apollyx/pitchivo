-- ============================================================================
-- PRODUCT ACCESS TOKENS - Secure Access Control System
-- ============================================================================
-- Replaces insecure query parameters with cryptographically secure tokens
-- Each token has a specific access level and is tied to a channel

-- ============================================================================
-- PRODUCT_ACCESS_TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS product_access_tokens (
  -- Primary key
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product and org references
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Channel tracking
  channel_id TEXT NOT NULL, -- e.g., 'email_campaign_1', 'linkedin_post_2'
  channel_name TEXT, -- Human-readable name
  
  -- Access control
  access_level TEXT NOT NULL CHECK (access_level IN ('public', 'after_click', 'after_rfq')),
  -- 'public' = level 0 (most restricted, but publicly accessible)
  -- 'after_click' = level 1 (channel-specific access)
  -- 'after_rfq' = level 2 (full access after RFQ submission)
  
  -- Token security
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the actual token
  -- We store hash, not plain token, for security (like passwords)
  
  -- Optional: IP binding for extra security
  bound_ip INET, -- If set, token only works from this IP
  
  -- Token lifecycle
  expires_at TIMESTAMPTZ, -- NULL = never expires
  is_revoked BOOLEAN DEFAULT FALSE, -- Can manually revoke tokens
  
  -- Usage tracking
  use_count INTEGER DEFAULT 0, -- How many times token has been used
  last_used_at TIMESTAMPTZ,
  first_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id), -- Which user created this token
  notes TEXT, -- Optional notes about this token
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_access_tokens_product_id ON product_access_tokens(product_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_org_id ON product_access_tokens(org_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_token_hash ON product_access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_access_tokens_channel_id ON product_access_tokens(channel_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires_at ON product_access_tokens(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_access_tokens_is_revoked ON product_access_tokens(is_revoked) WHERE is_revoked = FALSE;

-- ============================================================================
-- ADD token_id to ACCESS LOGS (for attribution)
-- ============================================================================
-- Link access logs to the token that was used
ALTER TABLE product_access_logs 
ADD COLUMN IF NOT EXISTS token_id UUID REFERENCES product_access_tokens(token_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_access_logs_token_id ON product_access_logs(token_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_access_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_access_tokens_updated_at
  BEFORE UPDATE ON product_access_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_access_tokens_updated_at();

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View for active (non-expired, non-revoked) tokens
CREATE OR REPLACE VIEW active_access_tokens AS
SELECT *
FROM product_access_tokens
WHERE 
  is_revoked = FALSE
  AND (expires_at IS NULL OR expires_at > NOW());

-- View for token usage statistics
CREATE OR REPLACE VIEW token_usage_stats AS
SELECT 
  t.token_id,
  t.product_id,
  t.channel_id,
  t.channel_name,
  t.access_level,
  t.use_count,
  t.created_at,
  t.expires_at,
  COUNT(DISTINCT al.visitor_id) as unique_visitors,
  COUNT(al.access_id) as total_accesses,
  MAX(al.accessed_at) as last_access,
  COUNT(DISTINCT CASE WHEN pa.action_type = 'rfq_submit' THEN pa.action_id END) as rfq_count,
  COUNT(DISTINCT CASE WHEN pa.action_type = 'document_download' THEN pa.action_id END) as download_count
FROM product_access_tokens t
LEFT JOIN product_access_logs al ON t.token_id = al.token_id
LEFT JOIN product_access_actions pa ON al.access_id = pa.access_id
GROUP BY t.token_id, t.product_id, t.channel_id, t.channel_name, t.access_level, t.use_count, t.created_at, t.expires_at;

-- ============================================================================
-- RLS (Row Level Security) Policies
-- ============================================================================
ALTER TABLE product_access_tokens ENABLE ROW LEVEL SECURITY;

-- Merchants can view tokens for their organization's products
CREATE POLICY "Users can view their organization's tokens"
  ON product_access_tokens
  FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Merchants can create tokens for their organization's products
CREATE POLICY "Users can create tokens for their organization"
  ON product_access_tokens
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Merchants can update tokens for their organization's products
CREATE POLICY "Users can update their organization's tokens"
  ON product_access_tokens
  FOR UPDATE
  USING (
    org_id IN (
      SELECT om.org_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- Merchants can delete tokens for their organization's products
CREATE POLICY "Users can delete their organization's tokens"
  ON product_access_tokens
  FOR DELETE
  USING (
    org_id IN (
      SELECT om.org_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE product_access_tokens IS 'Secure tokens for channel-based access control. Each token grants a specific access level to a product.';
COMMENT ON COLUMN product_access_tokens.token_hash IS 'SHA-256 hash of the actual token. We never store plain tokens, only hashes (like passwords).';
COMMENT ON COLUMN product_access_tokens.access_level IS 'Minimum access level: public < after_click < after_rfq. Higher levels can see all lower level fields.';
COMMENT ON COLUMN product_access_tokens.bound_ip IS 'Optional: If set, token can only be used from this IP address.';
COMMENT ON COLUMN product_access_tokens.use_count IS 'Number of times this token has been used to access the product.';

