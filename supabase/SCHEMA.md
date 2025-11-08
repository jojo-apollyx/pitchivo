# Database Schema Documentation

This document describes the Supabase database schema for the Pitchivo application.

## Overview

The database schema supports:
- **Waitlist System** - Email waitlist management with approval workflow
- **User Profiles** - Extended user information with organization association
- **Organizations** - Domain-based organization grouping
- **Email Domain Filtering** - Block public email domains
- **Intro Onboarding** - Track first-time user onboarding flow

## Tables

### `blocked_email_domains`

Stores blocked public email domains (gmail.com, yahoo.com, etc.).

**Columns:**
- `id` (UUID, Primary Key)
- `domain` (TEXT, Unique) - Email domain to block
- `reason` (TEXT) - Reason for blocking
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Default blocked domains:**
- gmail.com
- yahoo.com
- outlook.com
- hotmail.com
- icloud.com
- aol.com
- mail.com
- protonmail.com
- yandex.com
- zoho.com

### `waitlist`

Manages waitlist entries for new users.

**Columns:**
- `id` (UUID, Primary Key)
- `email` (TEXT, Unique) - User email
- `full_name` (TEXT) - User's full name
- `company` (TEXT) - Company name
- `role` (TEXT, Optional) - User's role
- `note` (TEXT, Optional) - Additional notes
- `status` (TEXT) - Status: 'pending', 'approved', 'rejected', 'invited'
- `invited_at` (TIMESTAMPTZ, Optional) - When user was invited
- `invited_by` (UUID, Optional) - User who approved the invitation
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_waitlist_email` - On `email`
- `idx_waitlist_status` - On `status`
- `idx_waitlist_created_at` - On `created_at DESC`

### `organizations`

Domain-based organizations for sharing views and data.

**Columns:**
- `id` (UUID, Primary Key)
- `domain` (TEXT, Unique) - Email domain (e.g., 'abcingredients.com')
- `name` (TEXT) - Company name
- `slug` (TEXT, Unique) - URL-friendly identifier
- `logo_url` (TEXT, Optional) - Organization logo URL
- `settings` (JSONB) - Organization settings
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_organizations_domain` - On `domain`
- `idx_organizations_slug` - On `slug`

### `user_profiles`

Extended user profile information.

**Columns:**
- `id` (UUID, Primary Key, References `auth.users`)
- `email` (TEXT, Unique) - User email
- `full_name` (TEXT, Optional) - User's full name
- `avatar_url` (TEXT, Optional) - Avatar image URL
- `role` (TEXT, Optional) - User role (e.g., 'marketing', 'sales', 'admin')
- `organization_id` (UUID, Optional, References `organizations`) - Associated organization
- `domain` (TEXT) - Extracted email domain for quick lookups
- `is_onboarded` (BOOLEAN) - Whether user completed onboarding
- `onboarding_completed_at` (TIMESTAMPTZ, Optional) - When onboarding was completed
- `metadata` (JSONB) - Additional user metadata
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_user_profiles_email` - On `email`
- `idx_user_profiles_domain` - On `domain`
- `idx_user_profiles_organization_id` - On `organization_id`
- `idx_user_profiles_is_onboarded` - On `is_onboarded`

### `intro_onboarding`

Tracks intro onboarding flow completion.

**Columns:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Unique, References `auth.users`) - User ID
- `step_upload_product` (BOOLEAN) - Upload first product step
- `step_connect_database` (BOOLEAN) - Connect Pitchville Database step
- `step_create_campaign` (BOOLEAN) - Create first Campaign step
- `completed_at` (TIMESTAMPTZ, Optional) - When all steps were completed
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

**Indexes:**
- `idx_intro_onboarding_user_id` - On `user_id`

## Views

### `user_profile_with_org`

Combines user profile with organization details.

### `organization_members`

Lists all members of an organization.

### `waitlist_status`

Waitlist entries with account status and whitelist status.

## Functions

### `extract_email_domain(email TEXT)`

Extracts domain from email address.

### `is_email_domain_blocked(email TEXT)`

Checks if email domain is blocked.

### `get_or_create_organization(email TEXT, company_name TEXT)`

Gets or creates organization for email domain.

### `is_user_whitelisted(email TEXT)`

Checks if user email is whitelisted (approved/invited in waitlist).

### `can_user_login(email TEXT)`

Checks if user can login (not blocked domain and whitelisted).

### `complete_onboarding_step(p_user_id UUID, p_step TEXT)`

Marks an onboarding step as complete. Returns true if all steps are complete.

**Steps:**
- `upload_product`
- `connect_database`
- `create_campaign`

### `get_organization_member_count(org_id UUID)`

Returns count of members in an organization.

### `approve_waitlist_entry(p_waitlist_id UUID, p_invited_by UUID)`

Approves a waitlist entry and marks as invited.

## Triggers

### `on_auth_user_created`

Automatically creates user profile and intro onboarding record when a new user signs up.

### `update_*_updated_at`

Automatically updates `updated_at` timestamp on record updates.

## Row Level Security (RLS)

### `blocked_email_domains`
- **Read**: Anyone can read (needed for validation)
- **Write**: Service role only

### `waitlist`
- **Insert**: Anyone can join waitlist
- **Read**: Users can read own entry, service role can read all
- **Update**: Service role only (for approval)

### `organizations`
- **Read**: Users can read their own organization and organization members
- **Write**: Service role only

### `user_profiles`
- **Read**: Users can read own profile and organization members' profiles
- **Update**: Users can update own profile
- **Write**: Service role only

### `intro_onboarding`
- **Read**: Users can read own onboarding status, service role can read all
- **Update**: Users can update own onboarding status
- **Insert**: Users can insert own onboarding record

## Workflow

### Waitlist Flow

1. User submits email to waitlist → `waitlist` table entry created with status 'pending'
2. Admin reviews and approves → Status updated to 'approved' or 'invited'
3. User receives magic link → Can login if whitelisted

### Login Flow

1. User attempts login with email
2. System checks:
   - Is domain blocked? → Redirect to waitlist if blocked
   - Is user whitelisted? → Redirect to waitlist if not whitelisted
3. If allowed, user can login

### Onboarding Flow

1. User logs in for first time
2. System checks `intro_onboarding` table
3. User completes steps:
   - Upload first product
   - Connect Pitchville Database
   - Create first Campaign
4. When all steps complete, `is_onboarded` set to true

### Organization Sharing

1. User signs up with email (e.g., `user@abcingredients.com`)
2. System extracts domain (`abcingredients.com`)
3. System gets or creates organization for domain
4. User profile linked to organization
5. All users with same domain share:
   - Products
   - Campaigns
   - RFQ
   - Data views
   - Permissions

## Usage Examples

### Check if email domain is blocked

```sql
SELECT is_email_domain_blocked('user@gmail.com'); -- Returns true
```

### Check if user can login

```sql
SELECT can_user_login('user@company.com'); -- Returns true if whitelisted and not blocked
```

### Complete onboarding step

```sql
SELECT complete_onboarding_step('user-id', 'upload_product');
```

### Get organization members

```sql
SELECT * FROM organization_members WHERE organization_id = 'org-id';
```

### Approve waitlist entry

```sql
SELECT approve_waitlist_entry('waitlist-id', 'admin-user-id');
```

