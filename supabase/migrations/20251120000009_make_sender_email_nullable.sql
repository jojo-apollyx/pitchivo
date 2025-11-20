-- Remove sender_email column - it's a legacy field no longer used
-- Campaigns now use Smartlead email accounts instead
ALTER TABLE campaigns
DROP COLUMN IF EXISTS sender_email;

