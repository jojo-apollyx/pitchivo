-- ============================================================================
-- ADD PRODUCT_DATA COLUMN TO PRODUCTS TABLE
-- ============================================================================
-- Add JSONB column to store structured product data using snake_case field names
-- This aligns with PRODUCT_FIELDS schema in food-supplement/extraction-schema.ts

ALTER TABLE products
ADD COLUMN IF NOT EXISTS product_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_product_data_gin ON products USING GIN (product_data);

-- Add comment to document the schema
COMMENT ON COLUMN products.product_data IS 'Structured product data using snake_case field names from PRODUCT_FIELDS schema. Fields include: product_name, origin_country, manufacturer_name, cas_number, form, grade, category, applications, description, botanical_name, extraction_ratio, carrier_material, appearance, odor, taste, solubility, particle_size, mesh_size, bulk_density, assay, ph, moisture, ash_content, loss_on_drying, residual_solvents, lead, arsenic, cadmium, mercury, pesticide_residue, aflatoxins, total_plate_count, yeast_mold, e_coli_presence, salmonella_presence, staphylococcus_presence, price_lead_time (array), packaging_type, net_weight, gross_weight, packages_per_pallet, shelf_life, storage_conditions (array), storage_temperature, payment_terms, incoterm, samples (array), certificates (array), allergen_info, gmo_status, irradiation_status, bse_statement, halal_certified, kosher_certified, organic_certification_body, inventory_locations (array)';


