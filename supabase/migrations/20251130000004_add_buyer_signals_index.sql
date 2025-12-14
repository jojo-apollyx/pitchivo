-- ============================================================================
-- ADD COMPOSITE INDEX FOR BUYER SIGNALS QUERY
-- ============================================================================
-- Optimize query pattern: filter by item_id and interaction_type, order by event_date and created_at
-- This index optimizes the buyer discovery query in generate-buyers API

-- Composite index for buyer signals query pattern:
-- WHERE item_id IN (...) AND interaction_type IN (...)
-- ORDER BY event_date DESC, created_at DESC
CREATE INDEX IF NOT EXISTS idx_leads_signals_buyer_query ON leads_signals(
    item_id,
    interaction_type,
    event_date DESC NULLS LAST,
    created_at DESC
)
WHERE interaction_type IN (
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

COMMENT ON INDEX idx_leads_signals_buyer_query IS 'Composite index optimized for buyer discovery queries filtering by item_id and buyer interaction types, ordered by recency';

