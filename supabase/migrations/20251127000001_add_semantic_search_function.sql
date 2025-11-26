-- ============================================================================
-- ADD SEMANTIC SEARCH FUNCTION FOR MARKET ITEMS
-- ============================================================================
-- Function to search market items using vector similarity (semantic search)

CREATE OR REPLACE FUNCTION match_market_items_semantic(
    query_embedding vector(1536),
    match_threshold float DEFAULT 0.7,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    id uuid,
    name text,
    category text,
    aliases text[],
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        leads_market_items.id,
        leads_market_items.name,
        leads_market_items.category,
        leads_market_items.aliases,
        -- Calculate cosine similarity: 1 - cosine_distance
        -- Higher similarity = more similar (1.0 = identical, 0.0 = completely different)
        1 - (leads_market_items.embedding <=> query_embedding) AS similarity
    FROM leads_market_items
    WHERE leads_market_items.embedding IS NOT NULL
        AND 1 - (leads_market_items.embedding <=> query_embedding) >= match_threshold
    ORDER BY leads_market_items.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_market_items_semantic IS 'Semantic search for market items using vector embeddings. Returns items with similarity >= match_threshold, ordered by similarity.';

