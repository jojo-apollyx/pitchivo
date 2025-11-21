-- Create table to store admin's selected default sequences
-- This stores an ordered list of template IDs that will be auto-applied to new campaigns
CREATE TABLE IF NOT EXISTS admin_default_sequences (
  id INTEGER PRIMARY KEY DEFAULT 1,
  template_ids UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default row
INSERT INTO admin_default_sequences (id, template_ids)
VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE admin_default_sequences IS 'Stores the ordered list of default sequence templates selected by admin';
COMMENT ON COLUMN admin_default_sequences.template_ids IS 'Ordered array of template_ids from global_sequence_templates';

