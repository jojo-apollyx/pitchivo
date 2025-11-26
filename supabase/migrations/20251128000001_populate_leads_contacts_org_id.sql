-- ============================================================================
-- POPULATE org_id IN leads_contacts
-- ============================================================================
-- This migration populates the org_id field in leads_contacts by matching
-- email domains to leads_organizations.domain

-- Update leads_contacts with org_id based on email domain matching
UPDATE leads_contacts c
SET org_id = o.id
FROM leads_organizations o
WHERE c.org_id IS NULL
  AND c.email IS NOT NULL
  AND o.domain IS NOT NULL
  AND extract_email_domain(c.email) = o.domain;

-- Log the results
DO $$
DECLARE
  updated_count INTEGER;
  total_contacts INTEGER;
  contacts_with_email INTEGER;
  contacts_without_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_contacts FROM leads_contacts;
  SELECT COUNT(*) INTO contacts_with_email FROM leads_contacts WHERE email IS NOT NULL;
  SELECT COUNT(*) INTO contacts_without_org FROM leads_contacts WHERE org_id IS NULL AND email IS NOT NULL;
  SELECT COUNT(*) INTO updated_count FROM leads_contacts WHERE org_id IS NOT NULL;
  
  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  Total contacts: %', total_contacts;
  RAISE NOTICE '  Contacts with email: %', contacts_with_email;
  RAISE NOTICE '  Contacts with org_id populated: %', updated_count;
  RAISE NOTICE '  Contacts still without org_id (no matching domain): %', contacts_without_org;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE leads_contacts IS 'The specific people you want to sell to. org_id links contacts to their organization based on email domain matching.';

