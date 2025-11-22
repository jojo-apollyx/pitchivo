-- Drop the trigger and functions that try to create default email templates
-- These are no longer needed since email_templates is now global (not campaign-specific)

-- Drop the trigger first
DROP TRIGGER IF EXISTS create_default_email_template_trigger ON campaigns;

-- Drop the trigger function
DROP FUNCTION IF EXISTS trigger_create_default_email_template();

-- Drop the template creation function (no longer needed)
DROP FUNCTION IF EXISTS create_default_email_template(UUID);

