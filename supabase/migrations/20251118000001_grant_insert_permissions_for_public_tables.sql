-- ============================================================================
-- GRANT INSERT PERMISSIONS FOR PUBLIC TABLES - 2025-11-18
-- ============================================================================
-- Issue: Tables with public INSERT policies were missing table-level GRANT statements
-- This caused 401 errors (code 42501) when anonymous users tried to insert data
--
-- Root Cause: PostgreSQL RLS requires BOTH:
--   1. Table-level GRANT (SQL privilege) - THIS WAS MISSING
--   2. Row-level Policy (RLS) - We had this
--
-- Without the GRANT, even with a permissive RLS policy, inserts fail
--
-- This migration adds the missing GRANT statements for all public submission tables

-- ============================================================================
-- PRODUCT_RFQS - Public RFQ submissions
-- ============================================================================
GRANT INSERT ON product_rfqs TO anon;
GRANT INSERT ON product_rfqs TO authenticated;

-- ============================================================================
-- PRODUCT_ACCESS_LOGS - Anonymous visitor tracking
-- ============================================================================
GRANT INSERT ON product_access_logs TO anon;
GRANT INSERT ON product_access_logs TO authenticated;

-- ============================================================================
-- PRODUCT_ACCESS_ACTIONS - Anonymous user action tracking
-- ============================================================================
GRANT INSERT ON product_access_actions TO anon;
GRANT INSERT ON product_access_actions TO authenticated;

-- ============================================================================
-- WAITLIST - Public waitlist signups
-- ============================================================================
GRANT INSERT ON waitlist TO anon;
GRANT INSERT ON waitlist TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify all grants were applied correctly
DO $$
DECLARE
  missing_grants TEXT[] := '{}';
  grant_count INTEGER;
BEGIN
  -- Check product_rfqs
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'product_rfqs'
    AND grantee = 'anon'
    AND privilege_type = 'INSERT';
  
  IF grant_count = 0 THEN
    missing_grants := array_append(missing_grants, 'product_rfqs');
  END IF;

  -- Check product_access_logs
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'product_access_logs'
    AND grantee = 'anon'
    AND privilege_type = 'INSERT';
  
  IF grant_count = 0 THEN
    missing_grants := array_append(missing_grants, 'product_access_logs');
  END IF;

  -- Check product_access_actions
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'product_access_actions'
    AND grantee = 'anon'
    AND privilege_type = 'INSERT';
  
  IF grant_count = 0 THEN
    missing_grants := array_append(missing_grants, 'product_access_actions');
  END IF;

  -- Check waitlist
  SELECT COUNT(*) INTO grant_count
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'waitlist'
    AND grantee = 'anon'
    AND privilege_type = 'INSERT';
  
  IF grant_count = 0 THEN
    missing_grants := array_append(missing_grants, 'waitlist');
  END IF;

  -- Report results
  IF array_length(missing_grants, 1) > 0 THEN
    RAISE EXCEPTION 'Failed to grant INSERT permission for tables: %', array_to_string(missing_grants, ', ');
  ELSE
    RAISE NOTICE '✓ Successfully granted INSERT permissions to anon role for all public tables';
    RAISE NOTICE '  - product_rfqs';
    RAISE NOTICE '  - product_access_logs';
    RAISE NOTICE '  - product_access_actions';
    RAISE NOTICE '  - waitlist';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables affected by this migration:
--   • product_rfqs         - Public RFQ submissions from product pages
--   • product_access_logs  - Anonymous visitor access tracking
--   • product_access_actions - Anonymous user action tracking
--   • waitlist             - Public waitlist signups
--
-- These tables all have INSERT policies that allow public submissions,
-- but were missing the table-level GRANT statements that PostgreSQL requires.
--
-- Related code changes:
--   • apps/web/app/api/products/rfq/route.ts (now uses admin client)
--   • apps/web/app/api/products/track-access/route.ts (now uses admin client)
--   • apps/web/app/api/products/track-action/route.ts (now uses admin client)
-- ============================================================================

