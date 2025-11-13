-- ============================================================================
-- EXTRACT KEY SEARCHABLE FIELDS FROM PRODUCT_DATA TO REGULAR COLUMNS
-- ============================================================================
-- Extract frequently searched/displayed fields as regular columns for:
-- 1. Faster search queries with regular indexes
-- 2. Better query performance
-- 3. Simpler WHERE clauses
-- 
-- These fields will be duplicated (in both columns and product_data JSONB)
-- to maintain flexibility while improving search performance.

-- Add key searchable columns (only initially shown/frequently searched fields)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS origin_country TEXT,
ADD COLUMN IF NOT EXISTS manufacturer_name TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS form TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS applications TEXT[]; -- Array for multi-select

-- Create indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_products_origin_country ON products(origin_country);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer_name ON products(manufacturer_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_form ON products(form);
CREATE INDEX IF NOT EXISTS idx_products_grade ON products(grade);
CREATE INDEX IF NOT EXISTS idx_products_applications_gin ON products USING GIN(applications); -- For array contains queries

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_country_category 
  ON products(origin_country, category) 
  WHERE origin_country IS NOT NULL AND category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_category_form 
  ON products(category, form) 
  WHERE category IS NOT NULL AND form IS NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN products.origin_country IS 'Country of origin - extracted for fast filtering (e.g., China, USA, Germany)';
COMMENT ON COLUMN products.manufacturer_name IS 'Manufacturer name - extracted for fast searching';
COMMENT ON COLUMN products.category IS 'Product category (e.g., Vitamin, Mineral, Botanical Extract) - extracted for fast filtering';
COMMENT ON COLUMN products.form IS 'Physical form (e.g., Powder, Liquid, Capsule) - extracted for fast filtering';
COMMENT ON COLUMN products.grade IS 'Product grade (e.g., Food Grade, Pharmaceutical Grade) - extracted for fast filtering';
COMMENT ON COLUMN products.applications IS 'Array of application areas - extracted for fast filtering with @> operator (e.g., ["Dietary Supplements", "Food Fortification"])';


