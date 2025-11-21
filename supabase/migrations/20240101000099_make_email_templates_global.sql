-- Make email templates global/reusable (not tied to specific campaigns)
-- Templates should be pure and reusable across all campaigns

-- Drop the campaign_id foreign key constraint and column
ALTER TABLE email_templates
DROP COLUMN IF EXISTS campaign_id CASCADE;

-- Remove is_default column (doesn't make sense for global templates)
ALTER TABLE email_templates
DROP COLUMN IF EXISTS is_default;

-- Add category field for organizing templates
ALTER TABLE email_templates
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop old campaign-specific index
DROP INDEX IF EXISTS idx_email_templates_campaign;
DROP INDEX IF EXISTS idx_email_templates_default;

-- Create new indexes for global templates
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_created_by ON email_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(template_name);

-- Also update email_quality_scores to remove campaign_id requirement
ALTER TABLE email_quality_scores
ALTER COLUMN campaign_id DROP NOT NULL,
ALTER COLUMN template_id DROP NOT NULL;

-- Drop old quality scores index
DROP INDEX IF EXISTS idx_email_quality_scores_campaign;

-- Update table comment
COMMENT ON TABLE email_templates IS 'Global reusable email templates (not campaign-specific)';
COMMENT ON COLUMN email_templates.category IS 'Template category: general, outreach, follow-up, announcement, etc.';
COMMENT ON COLUMN email_templates.description IS 'Brief description of template purpose';
COMMENT ON COLUMN email_templates.created_by IS 'User who created this template';

