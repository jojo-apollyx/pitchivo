-- ============================================================================
-- PRODUCT RFQs (Request for Quote) TABLE
-- ============================================================================
-- Store RFQ submissions from customers

CREATE TABLE IF NOT EXISTS product_rfqs (
  -- Primary key
  rfq_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Product and org references
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  
  -- RFQ details
  message TEXT NOT NULL,
  quantity TEXT,
  target_date TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'responded', 'won', 'lost', 'archived')),
  
  -- Response tracking
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  response_message TEXT,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rfqs_product_id ON product_rfqs(product_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_org_id ON product_rfqs(org_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_email ON product_rfqs(email);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON product_rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_submitted_at ON product_rfqs(submitted_at DESC);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_rfqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rfqs_updated_at
  BEFORE UPDATE ON product_rfqs
  FOR EACH ROW
  EXECUTE FUNCTION update_rfqs_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE product_rfqs ENABLE ROW LEVEL SECURITY;

-- Merchants can view RFQs for their organization's products
CREATE POLICY "Users can view their organization's RFQs"
  ON product_rfqs
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- Merchants can update RFQs for their organization's products
CREATE POLICY "Users can update their organization's RFQs"
  ON product_rfqs
  FOR UPDATE
  USING (
    org_id IN (
      SELECT organization_id FROM user_profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE product_rfqs IS 'Stores RFQ (Request for Quote) submissions from customers';
COMMENT ON COLUMN product_rfqs.status IS 'RFQ status: new, in_progress, responded, won, lost, archived';

