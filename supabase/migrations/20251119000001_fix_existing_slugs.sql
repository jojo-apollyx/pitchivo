-- ============================================================================
-- FIX EXISTING SLUGS TO REMOVE DOMAIN EXTENSIONS
-- ============================================================================
-- This migration updates existing organization slugs to remove domain extensions
-- (e.g., "pitchivo.com" -> "pitchivo")

-- Update existing slugs that contain domain extensions
UPDATE organizations
SET slug = REGEXP_REPLACE(slug, '\.(com|org|net|io|co|ai|app)$', '', 'g')
WHERE slug ~ '\.(com|org|net|io|co|ai|app)$';

-- Log the changes
DO $$
DECLARE
  affected_rows INTEGER;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Updated % organization slugs to remove domain extensions', affected_rows;
END $$;

