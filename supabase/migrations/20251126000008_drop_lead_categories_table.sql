-- Drop lead_categories table
-- Lead categories are now defined in code constants (apps/web/lib/constants/lead-categories.ts)
-- instead of in the database for better maintainability and consistency

DROP TABLE IF EXISTS lead_categories;

COMMENT ON COLUMN campaign_leads.category_id IS 'Smartlead category ID (Interested, Not Interested, etc.). Categories are defined in code constants (@/lib/constants/lead-categories), not in database.';

