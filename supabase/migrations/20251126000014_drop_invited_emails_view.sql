-- Drop the invited_emails view as it's unused
-- The application queries the underlying tables (waitlist and email_domain_policy) directly
DROP VIEW IF EXISTS invited_emails;

