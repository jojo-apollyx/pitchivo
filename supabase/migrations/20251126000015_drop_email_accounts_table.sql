-- Drop email_accounts table and related junction table
-- This table is unused - email accounts are managed via Smartlead API, not stored in database

-- Drop junction table first (has foreign key to email_accounts)
DROP TABLE IF EXISTS campaign_email_accounts CASCADE;

-- Drop main table
DROP TABLE IF EXISTS email_accounts CASCADE;

