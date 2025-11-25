-- ============================================================================
-- LEADS SYSTEM TABLES
-- ============================================================================
-- Core tables for market intelligence and lead generation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. leads_sources
-- Tracks where data originated from. Critical for data lineage and trust scoring.
CREATE TABLE IF NOT EXISTS leads_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    trust_score FLOAT DEFAULT 0.5 CHECK (trust_score >= 0.0 AND trust_score <= 1.0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_sources_name ON leads_sources(name);
CREATE INDEX IF NOT EXISTS idx_leads_sources_active ON leads_sources(is_active) WHERE is_active = true;

-- 2. leads_market_items
-- The "What" - Products, ingredients, chemicals being traded.
CREATE TABLE IF NOT EXISTS leads_market_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT UNIQUE NOT NULL, -- For deduplication: lower(trim(name))
    
    -- Vector embedding for semantic search (1536 dimensions = OpenAI standard)
    embedding vector(1536),
    
    -- Categorization
    category TEXT, -- Flexible text field - supports any industry (e.g., 'Food & Beverage', 'Pharmaceuticals', 'Technology')
    item_type TEXT NOT NULL DEFAULT 'product', -- General types: 'product', 'ingredient', 'service', 'equipment', 'software', 'material', 'component', 'chemical', 'packaging', 'other'
    
    -- Synonyms and aliases for matching
    aliases TEXT[] DEFAULT '{}',
    
    -- Hierarchical relationships (optional)
    parent_id UUID REFERENCES leads_market_items(id),
    
    -- Flexible attributes (CAS numbers, molecular weight, etc.)
    attributes JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads_market_items
CREATE INDEX IF NOT EXISTS idx_leads_market_items_normalized_name ON leads_market_items(normalized_name);
CREATE INDEX IF NOT EXISTS idx_leads_market_items_item_type ON leads_market_items(item_type);
CREATE INDEX IF NOT EXISTS idx_leads_market_items_category ON leads_market_items(category);
CREATE INDEX IF NOT EXISTS idx_leads_market_items_parent_id ON leads_market_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_leads_market_items_aliases ON leads_market_items USING GIN(aliases);

-- Vector similarity search index (HNSW for fast approximate search)
-- Note: This will only work if vector extension is enabled
CREATE INDEX IF NOT EXISTS idx_leads_market_items_embedding ON leads_market_items 
    USING hnsw (embedding vector_cosine_ops)
    WHERE embedding IS NOT NULL;

-- Trigger to auto-update normalized_name
CREATE OR REPLACE FUNCTION leads_market_items_normalize_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := lower(trim(NEW.name));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_market_items_normalize_trigger
    BEFORE INSERT OR UPDATE ON leads_market_items
    FOR EACH ROW
    EXECUTE FUNCTION leads_market_items_normalize_name();

-- 3. leads_organizations
-- The "Who" - Companies that buy, supply, or manufacture.
CREATE TABLE IF NOT EXISTS leads_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL, -- For deduplication
    domain TEXT, -- Primary key for deduplication (e.g. 'nestle.com')
    
    -- Location
    location_country TEXT,
    location_city TEXT,
    location_state TEXT,
    
    -- Business Activity Fields
    business_type TEXT[] DEFAULT '{}', -- What the company does: 'manufacturer', 'distributor', 'retailer', etc.
    industry_categories TEXT[] DEFAULT '{}', -- Industry classifications: 'food_beverage', 'ingredients_supplements', etc.
    
    -- Roles are calculated from signals, not stored here
    -- But we can cache them for performance
    cached_roles TEXT[] DEFAULT '{}', -- ['buyer', 'seller', 'manufacturer']
    
    -- Locked fields prevent automated overwrites
    locked_fields TEXT[] DEFAULT '{}', -- ['name', 'revenue', 'domain']
    
    -- Flexible profile data (Industry, Revenue, Employee Count, etc.)
    profile_data JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads_organizations
CREATE INDEX IF NOT EXISTS idx_leads_organizations_normalized_name ON leads_organizations(normalized_name);
CREATE INDEX IF NOT EXISTS idx_leads_organizations_domain ON leads_organizations(domain) WHERE domain IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_organizations_location_country ON leads_organizations(location_country);
CREATE INDEX IF NOT EXISTS idx_leads_organizations_business_type ON leads_organizations USING GIN(business_type);
CREATE INDEX IF NOT EXISTS idx_leads_organizations_industry_categories ON leads_organizations USING GIN(industry_categories);
CREATE INDEX IF NOT EXISTS idx_leads_organizations_cached_roles ON leads_organizations USING GIN(cached_roles);
CREATE INDEX IF NOT EXISTS idx_leads_organizations_profile_data ON leads_organizations USING GIN(profile_data);

-- Fuzzy text matching index for deduplication
CREATE INDEX IF NOT EXISTS idx_leads_organizations_name_trgm ON leads_organizations 
    USING gin(name gin_trgm_ops);

-- Trigger to auto-update normalized_name and updated_at
CREATE OR REPLACE FUNCTION leads_organizations_normalize()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := lower(trim(NEW.name));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_organizations_normalize_trigger
    BEFORE INSERT OR UPDATE ON leads_organizations
    FOR EACH ROW
    EXECUTE FUNCTION leads_organizations_normalize();

-- 4. leads_contacts
-- The specific people you want to sell to.
CREATE TABLE IF NOT EXISTS leads_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES leads_organizations(id) ON DELETE CASCADE,
    
    -- Identity
    first_name TEXT,
    last_name TEXT,
    full_name TEXT GENERATED ALWAYS AS (trim(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))) STORED,
    email TEXT,
    linkedin_url TEXT,
    title TEXT,
    
    -- Email hygiene & campaign feedback
    email_status TEXT DEFAULT 'unknown' CHECK (email_status IN (
        'unknown', 'valid', 'bounced', 'unsubscribed', 'risky', 'invalid'
    )),
    
    -- Employment status
    is_current BOOLEAN DEFAULT true,
    employment_verified_at TIMESTAMPTZ,
    
    -- Compliance
    consent_status TEXT DEFAULT 'unknown' CHECK (consent_status IN (
        'unknown', 'consented', 'opted_out', 'pending'
    )),
    
    -- Flexible attributes (Phone, Bio, Personal Email, etc.)
    attributes JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads_contacts
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_contacts_email_unique ON leads_contacts(email) 
    WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_contacts_org_id ON leads_contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_contacts_email_status ON leads_contacts(email_status);
CREATE INDEX IF NOT EXISTS idx_leads_contacts_is_current ON leads_contacts(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_leads_contacts_linkedin_url ON leads_contacts(linkedin_url) 
    WHERE linkedin_url IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION leads_contacts_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_contacts_update_timestamp_trigger
    BEFORE UPDATE ON leads_contacts
    FOR EACH ROW
    EXECUTE FUNCTION leads_contacts_update_timestamp();

-- 5. leads_signals
-- The core engine - records evidence of relationships and interactions.
CREATE TABLE IF NOT EXISTS leads_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationships
    org_id UUID REFERENCES leads_organizations(id) ON DELETE CASCADE,
    item_id UUID REFERENCES leads_market_items(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES leads_contacts(id) ON DELETE SET NULL, -- Optional
    
    -- Source tracking
    source_id UUID REFERENCES leads_sources(id),
    
    -- The interaction type (the "verb") - defines company roles
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        -- Buying activities
        'purchased',           -- Company bought this item
        'requested_quote',     -- Company requested quote for this item
        'viewed_item',         -- Company viewed this item (buying interest)
        'added_to_cart',       -- Company added to cart (buying interest)
        
        -- Selling activities
        'sold',                -- Company sold this item
        'supplied',            -- Company supplied this item
        'listed_for_sale',     -- Company listed this item for sale
        'advertised',          -- Company advertised this item
        
        -- Manufacturing activities
        'manufactured',        -- Company manufactures this item
        'produced',            -- Company produces this item
        
        -- Other activities
        'imported',            -- Company imported this item
        'exported',            -- Company exported this item
        'distributed',         -- Company distributes this item
        'used_in_production',  -- Company uses this item in production
        'mentioned_in_article', -- Item mentioned in company article
        'patent_filed',        -- Company filed patent for this
        'partnership_announced', -- Partnership related to this item
        
        -- Marketplace/Email feedback (legacy support)
        'requested_sample',
        'clicked_link',
        'replied_interested',
        'replied_not_interested',
        'opened_email'
    )),
    
    -- Temporal context
    event_date DATE DEFAULT CURRENT_DATE,
    
    -- Source identifier (human-readable)
    source TEXT, -- 'Mongo_Scrape', 'Website_Marketplace', 'Email_Campaign_Q3'
    
    -- Flexible metadata (Quantity, Campaign Name, Email Subject, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Raw evidence (for your Mongo migration, dump the whole object here)
    raw_data JSONB DEFAULT '{}'::jsonb,
    
    -- Human verification
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID, -- Reference to auth.users(id) if you have user tracking
    verified_at TIMESTAMPTZ,
    user_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads_signals
CREATE INDEX IF NOT EXISTS idx_leads_signals_org_id ON leads_signals(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_signals_item_id ON leads_signals(item_id);
CREATE INDEX IF NOT EXISTS idx_leads_signals_contact_id ON leads_signals(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_signals_source_id ON leads_signals(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_signals_interaction_type ON leads_signals(interaction_type);
CREATE INDEX IF NOT EXISTS idx_leads_signals_event_date ON leads_signals(event_date);
CREATE INDEX IF NOT EXISTS idx_leads_signals_source ON leads_signals(source);
CREATE INDEX IF NOT EXISTS idx_leads_signals_is_verified ON leads_signals(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_leads_signals_created_at ON leads_signals(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_leads_signals_org_item ON leads_signals(org_id, item_id);

-- ============================================================================
-- HELPER VIEWS FOR COMPANY ROLES
-- ============================================================================
-- Views to query companies by their roles (buyer, seller, manufacturer)

-- View: Companies as buyers
CREATE OR REPLACE VIEW v_organizations_as_buyers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    i.id AS item_id,
    s.event_date,
    s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('purchased', 'requested_quote', 'viewed_item', 'added_to_cart');

-- View: Companies as sellers
CREATE OR REPLACE VIEW v_organizations_as_sellers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    i.id AS item_id,
    s.event_date,
    s.metadata
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('sold', 'supplied', 'listed_for_sale', 'advertised');

-- View: Companies as manufacturers
CREATE OR REPLACE VIEW v_organizations_as_manufacturers AS
SELECT DISTINCT
    o.id,
    o.name,
    o.domain,
    i.name AS item_name,
    i.id AS item_id,
    s.event_date
FROM leads_organizations o
JOIN leads_signals s ON s.org_id = o.id
JOIN leads_market_items i ON i.id = s.item_id
WHERE s.interaction_type IN ('manufactured', 'produced');

-- ============================================================================
-- CACHED ROLES UPDATE FUNCTION
-- ============================================================================
-- Function to update cached_roles based on signals for performance optimization

CREATE OR REPLACE FUNCTION update_organization_cached_roles(org_id UUID)
RETURNS void AS $$
DECLARE
    v_roles TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check if company is a buyer
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE leads_signals.org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('purchased', 'requested_quote', 'viewed_item', 'added_to_cart')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'buyer');
    END IF;
    
    -- Check if company is a seller
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE leads_signals.org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('sold', 'supplied', 'listed_for_sale', 'advertised')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'seller');
    END IF;
    
    -- Check if company is a manufacturer
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE leads_signals.org_id = update_organization_cached_roles.org_id
        AND interaction_type IN ('manufactured', 'produced')
        LIMIT 1
    ) THEN
        v_roles := array_append(v_roles, 'manufacturer');
    END IF;
    
    -- Update cached roles
    UPDATE leads_organizations
    SET cached_roles = v_roles
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update cached roles when signals are inserted/updated
CREATE OR REPLACE FUNCTION leads_signals_update_cached_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cached roles for the organization
    PERFORM update_organization_cached_roles(NEW.org_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_signals_update_cached_roles_trigger
    AFTER INSERT OR UPDATE ON leads_signals
    FOR EACH ROW
    WHEN (NEW.org_id IS NOT NULL)
    EXECUTE FUNCTION leads_signals_update_cached_roles();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE leads_sources IS 'Tracks where data originated from. Critical for data lineage and trust scoring';
COMMENT ON TABLE leads_market_items IS 'The "What" - Products, ingredients, chemicals being traded';
COMMENT ON TABLE leads_organizations IS 'The "Who" - Companies that buy, supply, or manufacture';
COMMENT ON TABLE leads_contacts IS 'The specific people you want to sell to';
COMMENT ON TABLE leads_signals IS 'The core engine - records evidence of relationships and interactions';
COMMENT ON VIEW v_organizations_as_buyers IS 'View showing companies that buy products (purchased, requested_quote, etc.)';
COMMENT ON VIEW v_organizations_as_sellers IS 'View showing companies that sell products (sold, supplied, etc.)';
COMMENT ON VIEW v_organizations_as_manufacturers IS 'View showing companies that manufacture products';
COMMENT ON FUNCTION update_organization_cached_roles(UUID) IS 'Updates cached_roles array in leads_organizations based on signals';

