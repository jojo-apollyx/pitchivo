-- ============================================================================
-- ADD TEMPLATE VERSION SNAPSHOT TO PRODUCTS
-- ============================================================================
-- This migration adds template_version_snapshot to products table
-- to store the exact schema used at product creation time
-- This ensures products remain stable even if templates update

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS template_version_snapshot JSONB;

-- Add index for querying by template snapshot (if needed)
CREATE INDEX IF NOT EXISTS idx_products_template_snapshot ON products USING GIN (template_version_snapshot);

-- Add comment to explain the column
COMMENT ON COLUMN products.template_version_snapshot IS 'Stores the exact schema_json from the template at the time of product creation, ensuring product stability even when templates evolve';

