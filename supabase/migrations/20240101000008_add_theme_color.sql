-- ============================================================================
-- ADD THEME COLOR TO ORGANIZATIONS
-- ============================================================================
-- This migration adds theme_color field to organizations table
-- Default theme color: #ADEBB3 (Mint Green)

-- Add theme_color column to organizations table
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#ADEBB3';

-- Add comment
COMMENT ON COLUMN organizations.theme_color IS 'Primary theme color for the organization (hex format, e.g., #ADEBB3)';

