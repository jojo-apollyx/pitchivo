-- ============================================================================
-- SUPPORTED INDUSTRIES
-- ============================================================================
-- Table to store supported industries for organization setup
CREATE TABLE IF NOT EXISTS supported_industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_supported_industries_name ON supported_industries(name);
CREATE INDEX IF NOT EXISTS idx_supported_industries_active ON supported_industries(is_active);
CREATE INDEX IF NOT EXISTS idx_supported_industries_display_order ON supported_industries(display_order);

-- Enable RLS
ALTER TABLE supported_industries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active industries
CREATE POLICY "Anyone can read active industries"
  ON supported_industries
  FOR SELECT
  USING (is_active = TRUE);

-- Insert default industries (will be populated via seed.sql)
-- This is just a placeholder - actual data comes from seed.sql

