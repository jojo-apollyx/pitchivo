-- Drop email_quality_scores table as it's unused
-- The UI component calls /api/admin/campaigns/analyze-email which doesn't save to database
DROP TABLE IF EXISTS email_quality_scores CASCADE;

