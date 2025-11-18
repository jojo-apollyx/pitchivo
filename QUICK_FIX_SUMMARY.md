# Quick Fix Summary: RLS 401 Errors

## Issue
Production RFQ submissions were failing with `401 Unauthorized` (PostgreSQL error code 42501).

## Root Cause
**INSERT + SELECT pattern fails for anonymous users when:**
1. Table has public INSERT policy (allows anonymous)
2. Table has restricted SELECT policy (requires authentication)
3. Code uses `.insert().select()` pattern

The anonymous user can INSERT but then can't SELECT back the result → 401 error.

## Solution Applied

### ✅ Code Changes (Uses Admin Client)

Updated these API routes to use admin client (service role key):

1. **`/api/products/rfq/route.ts`**
   - RFQ insert now uses `supabaseAdmin`
   - RFQ action tracking uses `supabaseAdmin`

2. **`/api/products/track-access/route.ts`**
   - Access log insert uses `supabaseAdmin`
   - Visitor count check uses `supabaseAdmin`

3. **`/api/products/track-action/route.ts`**
   - Action insert uses `supabaseAdmin`
   - Access log lookup uses `supabaseAdmin`

### ✅ Migration Updates

Updated migrations to include proper GRANT statements:

1. **`20240101000038_create_product_tracking.sql`**
   - Added `GRANT INSERT ON product_access_logs TO anon`
   - Added `GRANT INSERT ON product_access_actions TO anon`
   - Added `TO public` clause to policies

2. **`20240101000041_create_rfqs_table.sql`**
   - Added `GRANT INSERT ON product_rfqs TO anon`

3. **`20240101000001_rls_policies.sql`**
   - Added `GRANT INSERT ON waitlist TO anon`
   - Added `TO public` clause to policy

### ✅ Documentation

Created **`RLS_PATTERNS.md`** - Comprehensive guide covering:
- The INSERT + SELECT problem
- When to use admin client
- Security considerations
- Migration templates
- Debugging checklist
- Complete code examples

## Deployment Steps

### 1. Immediate Fix (Production)
The code changes already fix the issue! Just deploy:

```bash
# Deploy the updated API routes
git add .
git commit -m "fix: Use admin client for public submissions (RLS 401 fix)"
git push
```

### 2. Apply the New Migration (Required for Policy Fix)

**IMPORTANT**: The code changes (admin client) already fix the immediate issue, but for completeness and to fix any direct database inserts, deploy the new migration:

```bash
# Push migrations to production
supabase db push --linked
```

The new migration file: `20251118000001_grant_insert_permissions_for_public_tables.sql`

This migration adds the missing GRANT statements:
- `GRANT INSERT ON product_rfqs TO anon`
- `GRANT INSERT ON product_access_logs TO anon`
- `GRANT INSERT ON product_access_actions TO anon`
- `GRANT INSERT ON waitlist TO anon`

### 3. Verification

After deploying, verify the grants:

```sql
-- Check grants were applied
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'anon'
  AND privilege_type = 'INSERT'
ORDER BY table_name;
```

Expected output:
```
grantee | table_name             | privilege_type
--------|------------------------|---------------
anon    | product_access_actions | INSERT
anon    | product_access_logs    | INSERT
anon    | product_rfqs           | INSERT
anon    | waitlist               | INSERT
```

## Tables Affected

| Table | API Route | Fixed |
|-------|-----------|-------|
| `product_rfqs` | `/api/products/rfq` | ✅ |
| `product_access_logs` | `/api/products/track-access` | ✅ |
| `product_access_actions` | `/api/products/track-action` | ✅ |
| `product_access_actions` | `/api/products/rfq` (tracking) | ✅ |
| `waitlist` | Client-side only (no issue) | N/A |

## Verification

Test RFQ submission in production - should now work without 401 errors.

```bash
# Check logs for successful RFQ submissions
# No more "42501" errors
```

## Key Takeaway

**For any new endpoint that accepts anonymous submissions:**
1. ✅ Use admin client (service role key)
2. ✅ Add `GRANT INSERT ON table_name TO anon` in migration
3. ✅ Validate all input thoroughly
4. ✅ Set org_id/ownership server-side
5. ✅ Document why admin client is used

See `RLS_PATTERNS.md` for complete guidelines.

