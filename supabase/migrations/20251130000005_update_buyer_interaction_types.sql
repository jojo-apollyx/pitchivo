-- ============================================================================
-- UPDATE BUYER INTERACTION TYPES
-- ============================================================================
-- Update views and functions to include all buyer-side interaction types:
-- 'purchased', 'requested_quote', 'viewed_item', 'added_to_cart', 'imported', 
-- 'used_in_production', 'distributed', 'mentioned_in_article', 'partnership_announced'

-- Update view: Companies as buyers
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
WHERE s.interaction_type IN (
    'purchased', 
    'requested_quote', 
    'viewed_item', 
    'added_to_cart',
    'imported',
    'used_in_production',
    'distributed',
    'mentioned_in_article',
    'partnership_announced'
);

-- Update function: Update organization cached roles
CREATE OR REPLACE FUNCTION update_organization_cached_roles(org_id UUID)
RETURNS void AS $$
DECLARE
    v_roles TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check if company is a buyer
    IF EXISTS (
        SELECT 1 FROM leads_signals 
        WHERE leads_signals.org_id = update_organization_cached_roles.org_id
        AND interaction_type IN (
            'purchased', 
            'requested_quote', 
            'viewed_item', 
            'added_to_cart',
            'imported',
            'used_in_production',
            'distributed',
            'mentioned_in_article',
            'partnership_announced'
        )
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

COMMENT ON VIEW v_organizations_as_buyers IS 'View showing companies that buy products (purchased, requested_quote, imported, used_in_production, distributed, mentioned_in_article, partnership_announced, etc.)';
COMMENT ON FUNCTION update_organization_cached_roles(UUID) IS 'Updates cached_roles array in leads_organizations based on signals, including all buyer-side interaction types';

