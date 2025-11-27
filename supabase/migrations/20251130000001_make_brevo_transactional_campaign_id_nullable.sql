-- Make campaign_id nullable in brevo_transactional_emails
-- Transactional emails (invitations, welcome emails, etc.) don't always have a campaign_id
-- This fixes the error: "null value in column "campaign_id" of relation "brevo_transactional_emails" violates not-null constraint"

-- Drop the NOT NULL constraint on campaign_id
ALTER TABLE brevo_transactional_emails 
ALTER COLUMN campaign_id DROP NOT NULL;

-- Update the foreign key constraint to use ON DELETE SET NULL instead of CASCADE
-- This is more appropriate for optional relationships
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the existing foreign key constraint
  SELECT tc.constraint_name INTO constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.table_name = 'brevo_transactional_emails'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'campaign_id'
  LIMIT 1;

  -- Drop and recreate with ON DELETE SET NULL if constraint exists
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE brevo_transactional_emails DROP CONSTRAINT ' || constraint_name;
    EXECUTE 'ALTER TABLE brevo_transactional_emails ADD CONSTRAINT ' || constraint_name || 
            ' FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id) ON DELETE SET NULL';
  END IF;
END $$;

-- Update the comment to reflect that campaign_id is optional
COMMENT ON COLUMN brevo_transactional_emails.campaign_id IS 'Optional reference to campaign (for context only, like admin test sends). NULL for transactional emails without a campaign. Email is sent via Brevo, not Smartlead.';

