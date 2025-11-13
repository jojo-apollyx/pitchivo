-- Migration: Drop unused product_field_applications table
-- 
-- Context: The product_field_applications table was created to track which fields 
-- from which files were applied to products, but this functionality was never implemented.
-- Instead, we now store uploaded file IDs directly in the product_data JSONB column,
-- which is simpler and more flexible.
-- 
-- The reference_count on document_extractions will no longer be incremented by this table,
-- but that's acceptable since reference counting was primarily for safe deletion,
-- and files are now referenced in product_data.

-- Drop dependent triggers first
DROP TRIGGER IF EXISTS product_field_applications_insert ON public.product_field_applications;
DROP TRIGGER IF EXISTS product_field_applications_delete ON public.product_field_applications;

-- Drop the table (CASCADE will drop any remaining dependencies)
DROP TABLE IF EXISTS public.product_field_applications CASCADE;

-- Note: We're keeping the increment/decrement reference count functions
-- as they may be useful for future features, even though they're not currently in use.

