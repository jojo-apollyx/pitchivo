-- ============================================================================
-- UPGRADE THEME SYSTEM
-- ============================================================================
-- This migration upgrades the theme system to support primary, secondary, and accent colors.

-- Drop old theme_color column if it exists
ALTER TABLE organizations
  DROP COLUMN IF EXISTS theme_color;

-- Drop theme_scheme column if it exists (from previous version)
ALTER TABLE organizations
  DROP COLUMN IF EXISTS theme_scheme;

-- Add new color columns with Emerald Spark as default (complementary accent)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#10B981',
  ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#059669',
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT '#F87171';

-- Add comments for new columns
COMMENT ON COLUMN organizations.primary_color IS 'Primary color for the organization (hex format)';
COMMENT ON COLUMN organizations.secondary_color IS 'Secondary color for the organization (hex format)';
COMMENT ON COLUMN organizations.accent_color IS 'Accent color for the organization (hex format)';
