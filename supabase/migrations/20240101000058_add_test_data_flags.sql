-- ============================================================================
-- ADD TEST DATA FLAGS
-- ============================================================================
-- Add is_test flag to key tables to identify test data for easy cleanup
-- This allows admins to mark data as test data and bulk delete with cascade

-- Add is_test flag to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false NOT NULL;

-- Add is_test flag to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false NOT NULL;

-- Add is_test flag to campaigns
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false NOT NULL;

-- Add is_test flag to product_rfqs
ALTER TABLE product_rfqs
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT false NOT NULL;

-- Create indexes for faster test data queries
CREATE INDEX IF NOT EXISTS idx_organizations_is_test ON organizations(is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_products_is_test ON products(is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_campaigns_is_test ON campaigns(is_test) WHERE is_test = true;
CREATE INDEX IF NOT EXISTS idx_rfqs_is_test ON product_rfqs(is_test) WHERE is_test = true;

-- Comments for documentation
COMMENT ON COLUMN organizations.is_test IS 'Flag to mark organization as test data for easy cleanup';
COMMENT ON COLUMN products.is_test IS 'Flag to mark product as test data for easy cleanup';
COMMENT ON COLUMN campaigns.is_test IS 'Flag to mark campaign as test data for easy cleanup';
COMMENT ON COLUMN product_rfqs.is_test IS 'Flag to mark RFQ as test data for easy cleanup';

-- ============================================================================
-- TEST DATA CLEANUP FUNCTION
-- ============================================================================
-- Function to preview test data that would be deleted
CREATE OR REPLACE FUNCTION preview_test_data_cleanup()
RETURNS TABLE (
  table_name TEXT,
  record_count BIGINT,
  record_ids UUID[]
) AS $$
BEGIN
  -- Count organizations
  RETURN QUERY
  SELECT 
    'organizations'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(id)::UUID[] as record_ids
  FROM organizations
  WHERE is_test = true;

  -- Count products
  RETURN QUERY
  SELECT 
    'products'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(product_id)::UUID[] as record_ids
  FROM products
  WHERE is_test = true;

  -- Count campaigns
  RETURN QUERY
  SELECT 
    'campaigns'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(campaign_id)::UUID[] as record_ids
  FROM campaigns
  WHERE is_test = true;

  -- Count product_rfqs
  RETURN QUERY
  SELECT 
    'product_rfqs'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(rfq_id)::UUID[] as record_ids
  FROM product_rfqs
  WHERE is_test = true;

  -- Count brevo_transactional_emails (cascade from campaigns, formerly scheduled_emails)
  RETURN QUERY
  SELECT 
    'brevo_transactional_emails'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(brevo_email_id)::UUID[] as record_ids
  FROM brevo_transactional_emails
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE is_test = true
  );

  -- Note: brevo_email_templates are global (not campaign-specific)
  -- Templates are not tied to campaigns, so we don't count them here

  -- Count campaign_activities (cascade from campaigns)
  RETURN QUERY
  SELECT 
    'campaign_activities'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(activity_id)::UUID[] as record_ids
  FROM campaign_activities
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE is_test = true
  );

  -- Note: email_quality_scores table has been removed

  -- Count document_extractions (cascade from organizations)
  RETURN QUERY
  SELECT 
    'document_extractions'::TEXT as table_name,
    COUNT(*)::BIGINT as record_count,
    ARRAY_AGG(id)::UUID[] as record_ids
  FROM document_extractions
  WHERE organization_id IN (
    SELECT id FROM organizations WHERE is_test = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TEST DATA DELETION FUNCTION
-- ============================================================================
-- Function to delete all test data with proper cascade
-- Returns summary of deleted records
CREATE OR REPLACE FUNCTION delete_test_data()
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT
) AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Delete in reverse order of dependencies to avoid foreign key issues
  
  -- 1. Delete campaign_activities for test campaigns
  DELETE FROM campaign_activities
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE is_test = true
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'campaign_activities'::TEXT, v_count;

  -- 2. Delete brevo_transactional_emails for test campaigns (formerly scheduled_emails)
  DELETE FROM brevo_transactional_emails
  WHERE campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE is_test = true
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'brevo_transactional_emails'::TEXT, v_count;

  -- Note: brevo_email_templates are global (not campaign-specific)
  -- Templates are not tied to campaigns, so we don't delete them here

  -- 5. Delete test RFQs
  DELETE FROM product_rfqs
  WHERE is_test = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'product_rfqs'::TEXT, v_count;

  -- 6. Delete test campaigns
  DELETE FROM campaigns
  WHERE is_test = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'campaigns'::TEXT, v_count;

  -- 7. Delete test products
  DELETE FROM products
  WHERE is_test = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'products'::TEXT, v_count;

  -- 8. Delete document_extractions for test organizations
  DELETE FROM document_extractions
  WHERE organization_id IN (
    SELECT id FROM organizations WHERE is_test = true
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'document_extractions'::TEXT, v_count;

  -- 9. Delete test organizations (last, after all dependencies)
  DELETE FROM organizations
  WHERE is_test = true;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'organizations'::TEXT, v_count;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admin will check in application layer)
GRANT EXECUTE ON FUNCTION preview_test_data_cleanup TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION delete_test_data TO authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION preview_test_data_cleanup IS 'Returns a preview of all test data that would be deleted, with counts and IDs per table';
COMMENT ON FUNCTION delete_test_data IS 'Deletes all records marked as test data with proper cascade handling. Returns count of deleted records per table.';

