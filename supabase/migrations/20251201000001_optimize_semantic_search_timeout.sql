-- ============================================================================
-- OPTIMIZE SEMANTIC SEARCH FUNCTION TO HANDLE TIMEOUTS
-- ============================================================================
-- This migration optimizes the semantic search function to prevent statement timeouts
-- by improving query performance and adding timeout handling

-- Drop and recreate the function with optimizations
-- Note: The optimized version below replaces this, but keeping for reference

-- Alternative optimized version using a more efficient approach
-- This version uses the index more efficiently by leveraging the HNSW index's native ordering
CREATE OR REPLACE FUNCTION match_market_items_semantic_v2(
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
LANGUAGE sql
STABLE
SET statement_timeout = '30s'
AS $$
    WITH candidates AS (
        SELECT
            leads_market_items.id,
            leads_market_items.name,
            leads_market_items.category,
            leads_market_items.aliases,
            1 - (leads_market_items.embedding <=> query_embedding) AS similarity
        FROM leads_market_items
        WHERE leads_market_items.embedding IS NOT NULL
        ORDER BY leads_market_items.embedding <=> query_embedding
        LIMIT LEAST(match_count * 3, 100)  -- Get top candidates efficiently using index
    )
    SELECT
        candidates.id,
        candidates.name,
        candidates.category,
        candidates.aliases,
        candidates.similarity
    FROM candidates
    WHERE candidates.similarity >= match_threshold
    ORDER BY candidates.similarity DESC
    LIMIT match_count;
$$;

-- Replace the original function with the optimized version
DROP FUNCTION IF EXISTS match_market_items_semantic(vector, float, int);
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
LANGUAGE sql
STABLE
SET statement_timeout = '30s'
AS $$
    WITH candidates AS (
        SELECT
            leads_market_items.id,
            leads_market_items.name,
            leads_market_items.category,
            leads_market_items.aliases,
            1 - (leads_market_items.embedding <=> query_embedding) AS similarity
        FROM leads_market_items
        WHERE leads_market_items.embedding IS NOT NULL
        ORDER BY leads_market_items.embedding <=> query_embedding
        LIMIT LEAST(match_count * 3, 100)  -- Get top candidates efficiently using index
    )
    SELECT
        candidates.id,
        candidates.name,
        candidates.category,
        candidates.aliases,
        candidates.similarity
    FROM candidates
    WHERE candidates.similarity >= match_threshold
    ORDER BY candidates.similarity DESC
    LIMIT match_count;
$$;

COMMENT ON FUNCTION match_market_items_semantic IS 'Optimized semantic search for market items using vector embeddings. Uses HNSW index efficiently and has a 30s timeout. Returns items with similarity >= match_threshold, ordered by similarity.';

-- Verify the HNSW index exists and is properly configured
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_leads_market_items_embedding'
    ) THEN
        RAISE NOTICE 'HNSW index idx_leads_market_items_embedding does not exist. Creating it...';
        CREATE INDEX IF NOT EXISTS idx_leads_market_items_embedding ON leads_market_items 
            USING hnsw (embedding vector_cosine_ops)
            WHERE embedding IS NOT NULL;
    ELSE
        RAISE NOTICE 'HNSW index idx_leads_market_items_embedding exists.';
    END IF;
END $$;

