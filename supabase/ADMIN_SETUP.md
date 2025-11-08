# How to Add Initial Pitchivo Admin

There are several ways to add a Pitchivo admin to your website. Choose the method that works best for your setup.

## Method 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL query (replace `your-email@example.com` with the actual email):

```sql
-- Update user to be Pitchivo admin by email
UPDATE user_profiles
SET is_pitchivo_admin = true
WHERE email = 'your-email@example.com';
```

## Method 2: Using SQL Query by User ID

If you know the user's ID from `auth.users`:

```sql
-- Update user to be Pitchivo admin by user ID
UPDATE user_profiles
SET is_pitchivo_admin = true
WHERE id = 'user-uuid-here';
```

## Method 3: Using the Helper Function

After running migrations, you can use the helper function:

```sql
-- Make user admin by email
SELECT make_pitchivo_admin('your-email@example.com');
```

## Method 4: Using Supabase Client (Programmatic)

If you need to do this programmatically from your application:

```typescript
import { createClient } from '@supabase/supabase-js'

// Use service role key (keep this secret!)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key, not anon key
)

// Update user to admin
const { data, error } = await supabase
  .from('user_profiles')
  .update({ is_pitchivo_admin: true })
  .eq('email', 'your-email@example.com')
```

## Method 5: During User Signup (For First Admin)

If you want to make the first user an admin automatically, you can modify the `handle_new_user()` trigger function to check if this is the first user:

```sql
-- Modify the trigger function to make first user admin
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_domain TEXT;
  org_id UUID;
  user_count INTEGER;
BEGIN
  user_domain := extract_email_domain(NEW.email);
  
  -- Get or create organization for this domain
  org_id := get_or_create_organization(NEW.email);
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  -- Create user profile
  INSERT INTO public.user_profiles (id, email, domain, organization_id, full_name, is_pitchivo_admin, org_role)
  VALUES (
    NEW.id,
    NEW.email,
    user_domain,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_count = 0, -- First user becomes admin
    COALESCE(NEW.raw_user_meta_data->>'org_role', 'user')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Important Notes

1. **Service Role Required**: Most methods require the Supabase service role key, which should be kept secret and never exposed to the client.

2. **Domain Whitelist**: Make sure the admin's email domain is whitelisted in `email_domain_policy` table, or they won't be able to login.

3. **First Admin Setup**: For the very first admin, you might want to:
   - Whitelist their domain first
   - Then create/update their user profile to be admin

## Complete First Admin Setup

Here's a complete SQL script to set up your first admin:

```sql
-- Step 1: Whitelist the admin's domain
INSERT INTO email_domain_policy (domain, status, reason)
VALUES ('yourdomain.com', 'whitelisted', 'Initial admin domain')
ON CONFLICT (domain) DO UPDATE SET status = 'whitelisted';

-- Step 2: After the user signs up, make them admin
-- (Replace with actual email after they sign up)
UPDATE user_profiles
SET is_pitchivo_admin = true
WHERE email = 'admin@yourdomain.com';
```

## Verify Admin Status

To check if a user is an admin:

```sql
SELECT email, is_pitchivo_admin, org_role
FROM user_profiles
WHERE email = 'your-email@example.com';
```

Or in TypeScript:

```typescript
const { data, error } = await supabase
  .from('user_profiles')
  .select('is_pitchivo_admin')
  .eq('id', userId)
  .single()

if (data?.is_pitchivo_admin) {
  // User is a Pitchivo admin
}
```

