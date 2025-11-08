# Database Migrations

This directory contains Supabase database migrations for the Pitchivo application.

## Migration Files

1. **`20240101000000_initial_schema.sql`** - Initial database schema
   - Creates all tables (blocked_email_domains, waitlist, organizations, user_profiles, intro_onboarding)
   - Creates helper functions
   - Creates triggers for automatic profile creation

2. **`20240101000001_rls_policies.sql`** - Row Level Security policies
   - Enables RLS on all tables
   - Creates security policies for data access

3. **`20240101000002_helper_views.sql`** - Helper views and additional functions
   - Creates views for easier data access
   - Adds utility functions for common operations

## Applying Migrations

### Local Development

```bash
# Apply migrations to local Supabase instance
npm run supabase:migrate

# Or using Supabase CLI directly
supabase db push --local
```

### Production

```bash
# Apply migrations to production
supabase db push
```

## Migration Order

Migrations are applied in alphabetical order. The timestamp prefix ensures correct ordering:
- `20240101000000_initial_schema.sql` - First
- `20240101000001_rls_policies.sql` - Second
- `20240101000002_helper_views.sql` - Third

## Schema Overview

See [SCHEMA.md](../SCHEMA.md) for detailed documentation of the database schema.

## Key Features

- **Waitlist System**: Email waitlist with approval workflow
- **User Profiles**: Extended user information with organization association
- **Organizations**: Domain-based organization grouping for shared views
- **Email Domain Filtering**: Blocks public email domains (gmail.com, etc.)
- **Intro Onboarding**: Tracks first-time user onboarding flow
- **Automatic Profile Creation**: Trigger creates user profile on signup
- **Row Level Security**: Secure data access policies

## Testing

After applying migrations, you can test the schema:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Test email domain extraction
SELECT extract_email_domain('user@example.com'); -- Returns 'example.com'

-- Test blocked domain check
SELECT is_email_domain_blocked('user@gmail.com'); -- Returns true
```

## Rollback

To rollback migrations:

```bash
# Reset local database
npm run supabase:reset

# Or manually drop tables (use with caution)
# DROP TABLE IF EXISTS intro_onboarding CASCADE;
# DROP TABLE IF EXISTS user_profiles CASCADE;
# DROP TABLE IF EXISTS organizations CASCADE;
# DROP TABLE IF EXISTS waitlist CASCADE;
# DROP TABLE IF EXISTS blocked_email_domains CASCADE;
```

