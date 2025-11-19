-- ============================================================================
-- FIX EXISTING SLUGS TO REMOVE DOMAIN EXTENSIONS
-- ============================================================================
-- This migration updates existing organization slugs to remove domain extensions
-- Handles both patterns:
--   - "pitchivo.com" -> "pitchivo" (dots)
--   - "pitchivo-com" -> "pitchivo" (hyphens)

-- First, update slugs with dots (e.g., "pitchivo.com" -> "pitchivo")
UPDATE organizations
SET slug = REGEXP_REPLACE(slug, '\.(com|org|net|io|co|ai|app)$', '', 'g')
WHERE slug ~ '\.(com|org|net|io|co|ai|app)$';

-- Then, update slugs with hyphens (e.g., "pitchivo-com" -> "pitchivo")
UPDATE organizations
SET slug = REGEXP_REPLACE(slug, '-(com|org|net|io|co|ai|app)$', '', 'g')
WHERE slug ~ '-(com|org|net|io|co|ai|app)$';

