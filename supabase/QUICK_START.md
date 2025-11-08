# Quick Start Guide - Database Schema

## Overview

This schema supports the MVP features:
- ✅ Waitlist + Invite login
- ✅ Intro Onboarding Step
- ✅ Public email blocking
- ✅ Same domain shared views (Org-level permissions)

## Quick Setup

1. **Apply migrations:**
   ```bash
   npm run supabase:migrate
   ```

2. **Verify tables:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

## Key Tables

### `waitlist`
- Stores email waitlist entries
- Status: `pending` → `approved` → `invited`
- Only `invited` users can login

### `user_profiles`
- Extended user information
- Automatically linked to organization by email domain
- Tracks onboarding status

### `organizations`
- Domain-based organizations
- Users with same email domain share organization
- Example: `user1@company.com` and `user2@company.com` → same org

### `intro_onboarding`
- Tracks 3 onboarding steps:
  - `step_upload_product`
  - `step_connect_database`
  - `step_create_campaign`

### `blocked_email_domains`
- Blocks public email domains
- Default: gmail.com, yahoo.com, outlook.com, etc.

## Common Operations

### Check if user can login
```sql
SELECT can_user_login('user@company.com');
```

### Approve waitlist entry
```sql
SELECT approve_waitlist_entry('waitlist-id');
```

### Complete onboarding step
```sql
SELECT complete_onboarding_step('user-id', 'upload_product');
```

### Get organization members
```sql
SELECT * FROM organization_members 
WHERE organization_id = 'org-id';
```

## Workflow Examples

### 1. User joins waitlist
```typescript
const { data, error } = await supabase
  .from('waitlist')
  .insert({
    email: 'user@company.com',
    full_name: 'John Doe',
    company: 'ABC Ingredients',
    role: 'Marketing Manager'
  });
```

### 2. Admin approves waitlist entry
```typescript
const { data, error } = await supabase
  .rpc('approve_waitlist_entry', {
    p_waitlist_id: 'waitlist-id'
  });
```

### 3. User logs in (Magic Link)
- System checks: `can_user_login(email)`
- If blocked domain → redirect to waitlist
- If not whitelisted → redirect to waitlist
- If allowed → login successful

### 4. User completes onboarding step
```typescript
const { data, error } = await supabase
  .rpc('complete_onboarding_step', {
    p_user_id: userId,
    p_step: 'upload_product'
  });
```

### 5. Get user profile with organization
```typescript
const { data, error } = await supabase
  .from('user_profile_with_org')
  .select('*')
  .eq('id', userId)
  .single();
```

## Security

- **RLS enabled** on all tables
- Users can only read/update their own data
- Organization members can read each other's profiles
- Service role required for admin operations

## Next Steps

1. Apply migrations to your Supabase project
2. Configure Supabase Auth to use email magic links
3. Implement middleware to check `can_user_login()` on login
4. Build intro onboarding UI using `intro_onboarding` table
5. Implement organization-based data sharing

For detailed documentation, see [SCHEMA.md](./SCHEMA.md).

