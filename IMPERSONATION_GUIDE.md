# Impersonation System Guide

## 🎯 Overview

The impersonation system allows admins to view and act as any user/organization with **automatic** context handling, access control, and audit logging.

**Key Features:**
- ✅ Centralized in one place (`lib/impersonation.ts`)
- ✅ Automatic logging of ALL impersonation actions
- ✅ Works automatically with RLS policies
- ✅ Type-safe context helpers
- ✅ Zero boilerplate in API routes

---

## 📚 Core Functions

### 1. `getImpersonationContext()`
Returns complete impersonation context with validation and logging.

```typescript
const context = await getImpersonationContext()
// Returns:
// {
//   isImpersonating: boolean
//   actualUserId: string      // The admin's ID
//   effectiveUserId: string   // The impersonated user's ID (or admin's if not impersonating)
//   effectiveOrgId: string    // The effective organization ID
//   isAdmin: boolean
// }
```

### 2. `getEffectiveContext()`
Simplified helper that throws if unauthorized. Use in most API routes.

```typescript
const { userId, organizationId, isImpersonating } = await getEffectiveContext()
```

### 3. `logApiAccess(endpoint, method, action, metadata)`
Logs ALL API calls with impersonation context.

```typescript
await logApiAccess('/api/products', 'GET', 'list_products', { 
  productCount: 10 
})
```

### 4. `requireAdminOrImpersonating()`
For admin-only endpoints. Validates actual user is admin.

```typescript
const context = await requireAdminOrImpersonating()
```

### 5. `getOrgScopedQuery()`
Helper for organization-scoped queries.

```typescript
const { organizationId } = await getOrgScopedQuery()
```

---

## 🚀 Usage in Dashboard Pages

### Simple Pattern for All Pages

Instead of manually reading cookies and calling multiple functions, use the consolidated helper:

```typescript
// app/dashboard/page.tsx
import { getEffectiveUserAndProfile } from '@/lib/auth'

export default async function DashboardPage() {
  // One call handles everything: auth, cookie reading, impersonation
  const { user, profile, organization } = await getEffectiveUserAndProfile()
  
  // Use the effective values (automatically impersonated if applicable)
  const userName = profile?.full_name || profile?.email
  const orgName = organization?.name
  
  return <div>Welcome {userName} from {orgName}</div>
}
```

**That's it!** No cookie reading, no manual impersonation logic - it's all handled automatically.

---

## 🚀 Usage in API Routes

### Pattern 1: User Data (Organization-Scoped)

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveContext, logApiAccess } from '@/lib/impersonation'

export async function GET() {
  try {
    // 1. Get effective context (handles impersonation automatically)
    const context = await getEffectiveContext()
    
    // 2. Log API access (includes impersonation info)
    await logApiAccess('/api/products', 'GET', 'list_products', {
      organizationId: context.organizationId,
    })
    
    // 3. Query with effective organization
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', context.organizationId) // Auto-scoped!
    
    return NextResponse.json({ products: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Pattern 2: Creating Data

```typescript
export async function POST(request: Request) {
  try {
    const context = await getEffectiveContext()
    const body = await request.json()
    
    await logApiAccess('/api/products', 'POST', 'create_product', {
      name: body.name,
    })
    
    const supabase = await createClient()
    const { data } = await supabase
      .from('products')
      .insert({
        ...body,
        organization_id: context.organizationId, // Auto-scoped!
        created_by: context.userId, // Impersonated user if applicable
      })
      .select()
      .single()
    
    return NextResponse.json({ product: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Pattern 3: Admin-Only Operations

```typescript
// app/api/admin/users/route.ts
import { requireAdminOrImpersonating, logApiAccess } from '@/lib/impersonation'

export async function GET() {
  try {
    // Validates actual user is admin (even when impersonating)
    const context = await requireAdminOrImpersonating()
    
    await logApiAccess('/api/admin/users', 'GET', 'list_all_users')
    
    // Admin can access all data
    const supabase = await createClient()
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
    
    return NextResponse.json({ users: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    )
  }
}
```

---

## 🔍 Logging Examples

### Normal Request
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "endpoint": "/api/products",
  "method": "GET",
  "action": "list_products",
  "user": {
    "actual": "user-123",
    "effective": "user-123",
    "isImpersonating": false
  },
  "organization": "org-456",
  "metadata": { "productCount": 10 }
}
```

### Impersonated Request
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "endpoint": "/api/products",
  "method": "POST",
  "action": "create_product",
  "user": {
    "actual": "admin-789",        // Admin doing the impersonation
    "effective": "user-123",      // User being impersonated
    "isImpersonating": true
  },
  "organization": "org-456",
  "metadata": { "productName": "Widget" }
}
```

---

## 🛡️ Access Control Patterns

### 1. User can only access their org's data
```typescript
const context = await getEffectiveContext()
// Query automatically scoped to context.organizationId
```

### 2. Admin can access everything
```typescript
const context = await requireAdminOrImpersonating()
// Query without org filter - admin sees all
```

### 3. Mixed (user sees their org, admin sees selected org when impersonating)
```typescript
const context = await getEffectiveContext()
// When admin impersonates: context.organizationId = impersonated org
// Query scoped to context.organizationId works for both cases
```

---

## 📝 RLS Policy Updates

Update your RLS policies to work with impersonation:

```sql
-- Option 1: Trust application-level context (recommended)
CREATE POLICY "Users can access own org data"
ON products
FOR SELECT
USING (
  organization_id = (
    SELECT organization_id 
    FROM user_profiles 
    WHERE id = auth.uid()
  )
);

-- Option 2: Allow admins to bypass RLS
CREATE POLICY "Admins can access all data"
ON products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_pitchivo_admin = true
  )
);
```

---

## ✅ Checklist for New API Routes

When creating a new API route:

1. ✅ Import `getEffectiveContext` or `requireAdminOrImpersonating`
2. ✅ Call it at the start of your handler
3. ✅ Add `logApiAccess()` call
4. ✅ Use `context.organizationId` for scoping queries
5. ✅ Use `context.userId` for created_by fields
6. ✅ Handle errors properly (return 403 for Forbidden)

---

## 🔄 Migration Guide for Existing Routes

**Before:**
```typescript
export async function GET() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  
  const { data } = await supabase
    .from('products')
    .eq('organization_id', profile.organization_id)
  
  return NextResponse.json({ products: data })
}
```

**After:**
```typescript
export async function GET() {
  const context = await getEffectiveContext()
  
  await logApiAccess('/api/products', 'GET', 'list_products')
  
  const { data } = await supabase
    .from('products')
    .eq('organization_id', context.organizationId) // Auto-handles impersonation!
  
  return NextResponse.json({ products: data })
}
```

---

## 📊 Audit Log Storage (TODO)

Future enhancement: Store logs in database

```typescript
// In logApiAccess(), add:
await supabase.from('audit_logs').insert({
  timestamp: new Date().toISOString(),
  endpoint,
  method,
  action,
  actual_user_id: context.actualUserId,
  effective_user_id: context.effectiveUserId,
  is_impersonating: context.isImpersonating,
  organization_id: context.effectiveOrgId,
  metadata,
})
```

---

## 🎓 Summary

**One import, automatic impersonation support:**

```typescript
import { getEffectiveContext, logApiAccess } from '@/lib/impersonation'

export async function GET() {
  const context = await getEffectiveContext() // That's it!
  await logApiAccess(...)
  // Use context.organizationId and context.userId everywhere
}
```

**Benefits:**
- ✅ No manual cookie reading
- ✅ No manual admin checking  
- ✅ Automatic validation
- ✅ Automatic logging
- ✅ Type-safe context
- ✅ Works with RLS
- ✅ Consistent across all APIs

