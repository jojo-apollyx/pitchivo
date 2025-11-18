# Row Level Security (RLS) Patterns & Best Practices

## The Problem: INSERT + SELECT Pattern Failure

When using Supabase with RLS enabled, a common pattern fails for anonymous/public submissions:

```typescript
// ❌ THIS FAILS FOR ANONYMOUS USERS
const { data, error } = await supabase
  .from('table_name')
  .insert({ ... })
  .select()  // ← Fails here with 401 error
  .single()
```

### Why It Fails

PostgreSQL RLS policies work in **two steps**:

1. **INSERT** - The policy allows the anonymous user to insert the row ✅
2. **SELECT** - Tries to return the inserted row, but SELECT policy requires authentication ❌

**Error**: `401 Unauthorized` with PostgreSQL error code `42501` (insufficient privilege)

### Real-World Example

```typescript
// Table: product_rfqs
// INSERT Policy: "Anyone can submit RFQs" (WITH CHECK true) ✅
// SELECT Policy: "Users can view their organization's RFQs" (requires auth.uid()) ❌

// Anonymous user submits RFQ
const { data, error } = await supabase
  .from('product_rfqs')
  .insert({
    product_id: '...',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Interested in your product'
  })
  .select('rfq_id')  // ❌ 401 Error: Can't SELECT because user is not authenticated
  .single()
```

## The Solution: Use Admin Client for Public Submissions

For **any endpoint that accepts anonymous/public submissions**, use the **service role key** (admin client) to bypass RLS:

### ✅ Correct Pattern

```typescript
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create admin client at the top of your API route
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  // Use regular client for reads (respects RLS)
  const supabase = await createClient()
  
  // Get related data with RLS
  const { data: product } = await supabase
    .from('products')
    .select('org_id')
    .eq('product_id', productId)
    .single()

  // Use admin client for public inserts (bypasses RLS)
  const { data, error } = await supabaseAdmin
    .from('product_rfqs')
    .insert({
      product_id: productId,
      org_id: product.org_id,
      name: 'John Doe',
      email: 'john@example.com',
    })
    .select('rfq_id')  // ✅ Works! Admin client bypasses RLS
    .single()

  return NextResponse.json({ rfq_id: data.rfq_id })
}
```

## When to Use Admin Client

Use the **admin client** (service role) for:

### ✅ Public Submissions (Required)
- **RFQ submissions** (`/api/products/rfq`)
- **Product access tracking** (`/api/products/track-access`)
- **Product action tracking** (`/api/products/track-action`)
- **Waitlist signups** (if server-side)
- **Contact form submissions**
- **Newsletter signups**
- **Any anonymous user data collection**

### ✅ System Operations (Recommended)
- **Webhook handlers** (Brevo, Stripe, etc.)
- **Cron jobs** / scheduled tasks
- **Background jobs**
- **Admin operations** that need to bypass RLS

### ❌ User-Specific Operations (Don't Use)
- Reading user's own data
- Updating user's own profile
- Organization-specific queries
- Any operation that should respect RLS

## Tables Requiring Admin Client Pattern

Based on your current RLS policies, these tables accept public INSERTs and **MUST** use admin client:

| Table | Public INSERT Policy | Reason |
|-------|---------------------|--------|
| `product_rfqs` | "Anyone can submit RFQs" | Public RFQ submissions from product pages |
| `product_access_logs` | "Public can insert access logs" | Anonymous visitor tracking |
| `product_access_actions` | "Public can insert access actions" | Anonymous user action tracking |
| `waitlist` | "Anyone can join waitlist" | Public waitlist signups (if server-side) |

## Migration Requirements

For tables with public INSERT policies, you **MUST** grant table-level permissions:

```sql
-- Enable RLS
ALTER TABLE product_rfqs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Grant INSERT permission to anon role
-- RLS policies only work AFTER table-level grants are in place
GRANT INSERT ON product_rfqs TO anon;
GRANT INSERT ON product_rfqs TO authenticated;

-- Create INSERT policy (this alone is NOT enough!)
CREATE POLICY "Anyone can submit RFQs"
  ON product_rfqs
  FOR INSERT
  TO public
  WITH CHECK (true);
```

### PostgreSQL RLS Layer Check

```
┌─────────────────────────────────────────┐
│  1. Table-level GRANT                   │
│     ↓ Must have this first!             │
│  GRANT INSERT ON table TO anon;         │
│                                         │
│  2. Row-level Policy                    │
│     ↓ Only checked after GRANT passes   │
│  CREATE POLICY ... FOR INSERT           │
│  WITH CHECK (true);                     │
└─────────────────────────────────────────┘
```

## Complete Example: RFQ Endpoint

```typescript
// File: apps/web/app/api/products/rfq/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create admin Supabase client for RFQ inserts (public submissions need admin access)
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()

    // Get product using regular client (respects RLS - products have public SELECT)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('org_id, product_name')
      .eq('product_id', body.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Store RFQ using admin client (bypasses RLS)
    // Use admin client because this is a public submission (unauthenticated user)
    const { data: rfqData, error: rfqError } = await supabaseAdmin
      .from('product_rfqs')
      .insert({
        product_id: body.product_id,
        org_id: product.org_id,
        name: body.name,
        email: body.email,
        company: body.company,
        message: body.message,
        status: 'new',
        submitted_at: new Date().toISOString(),
      })
      .select('rfq_id')  // ✅ Works because admin client bypasses RLS
      .single()

    if (rfqError) {
      console.error('Error storing RFQ:', rfqError)
      return NextResponse.json(
        { error: 'Failed to store RFQ', details: rfqError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      rfq_id: rfqData.rfq_id
    })
  } catch (error) {
    console.error('RFQ submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

## Debugging RLS Issues

### 1. Check if RLS is Enabled

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'product_rfqs';
```

### 2. Check Table-Level Grants

```sql
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'product_rfqs'
  AND grantee IN ('anon', 'authenticated', 'public')
ORDER BY grantee, privilege_type;
```

Expected output:
```
grantee        | privilege_type | is_grantable
---------------|----------------|-------------
anon           | INSERT         | NO
authenticated  | INSERT         | NO
```

### 3. Check RLS Policies

```sql
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'product_rfqs'
ORDER BY cmd, policyname;
```

Expected output:
```
policyname              | cmd    | roles
------------------------|--------|--------
Anyone can submit RFQs  | INSERT | {public}
```

### 4. Common Errors

#### Error: 401 with code 42501
```
"code": "42501",
"message": "new row violates row-level security policy"
```

**Causes**:
1. Missing table-level GRANT (most common)
2. INSERT policy doesn't exist or is wrong
3. Trying to SELECT after INSERT without SELECT policy

**Fix**: Use admin client OR add proper GRANT + SELECT policy

#### Error: Policy exists but wrong command type

Check in Supabase UI - policy might show INSERT but actually be SELECT.

**Fix**: Drop and recreate policy:
```sql
DROP POLICY IF EXISTS "Anyone can submit RFQs" ON product_rfqs;

CREATE POLICY "Anyone can submit RFQs"
  ON product_rfqs
  FOR INSERT
  TO public
  WITH CHECK (true);
```

## Security Considerations

### ✅ Safe to Use Admin Client When:
- The data is public submissions (RFQs, contact forms, tracking)
- You validate input thoroughly
- You control what org_id/user_id is set (don't trust client)
- The operation doesn't expose sensitive data

### ❌ Don't Use Admin Client When:
- Reading user-specific data (use RLS instead)
- Operations that should respect organization boundaries
- You're unsure about data access patterns

### Best Practice: Hybrid Approach

```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()  // For reads
  const supabaseAdmin = ... // For public writes

  // ✅ Use regular client for reads (respects RLS)
  const { data: product } = await supabase
    .from('products')
    .select('org_id')
    .eq('product_id', productId)
    .single()

  // ✅ Use admin client for public inserts
  const { data: rfq } = await supabaseAdmin
    .from('product_rfqs')
    .insert({
      product_id: productId,
      org_id: product.org_id,  // ← Server-controlled, not from client
      ...validatedData
    })
    .select()
    .single()
}
```

## Checklist for New Public Endpoints

When creating a new endpoint that accepts anonymous submissions:

- [ ] Use admin client pattern (service role key)
- [ ] Add table-level GRANT in migration
- [ ] Create INSERT policy with `WITH CHECK (true)`
- [ ] Validate all input thoroughly
- [ ] Set org_id/ownership server-side (don't trust client)
- [ ] Test with anonymous user (no auth token)
- [ ] Document why admin client is used (code comment)
- [ ] Add to this documentation if it's a new pattern

## Migration Template

```sql
-- ============================================================================
-- TABLE_NAME: Public INSERT Policy
-- ============================================================================
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Grant table-level permissions (CRITICAL - must come before policy)
GRANT INSERT ON table_name TO anon;
GRANT INSERT ON table_name TO authenticated;

-- Create INSERT policy
CREATE POLICY "Anyone can submit to table_name"
  ON table_name
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Verify the policy was created correctly
DO $$
DECLARE
  policy_count INTEGER;
  policy_cmd TEXT;
BEGIN
  SELECT COUNT(*), MAX(cmd) INTO policy_count, policy_cmd
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'table_name'
    AND policyname = 'Anyone can submit to table_name';
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'Failed to create policy';
  ELSIF policy_cmd != 'INSERT' THEN
    RAISE EXCEPTION 'Policy has wrong command type: % (expected INSERT)', policy_cmd;
  ELSE
    RAISE NOTICE '✓ Successfully created INSERT policy for table_name';
  END IF;
END $$;
```

## Summary

**The Golden Rule**: If a table allows public INSERT but restricted SELECT, **always use admin client** in your API routes.

This is not a workaround - it's the correct pattern for public data collection in Supabase.

