# 🛠️ Implementation Guide: Secure Access Control

## Overview

This guide shows you how to implement the secure token-based access control system to replace the insecure query parameter approach.

---

## What's Been Created

### 1. Database Schema
- **File:** `supabase/migrations/20240101000040_create_access_tokens.sql`
- **Table:** `product_access_tokens` - Stores cryptographically secure tokens
- **Features:**
  - SHA-256 hashed tokens (never stores plain tokens)
  - Access levels: public, after_click, after_rfq
  - Expiration support
  - Usage tracking
  - RLS policies for security

### 2. Core Libraries
- **File:** `apps/web/lib/api/access-tokens.ts`
  - Token generation: `createAccessToken()`
  - Token validation: `validateAccessToken()`
  - Token refresh: `createRfqUpgradeToken()`
  - Access level determination: `determineAccessLevel()`

- **File:** `apps/web/lib/api/field-filtering.ts`
  - Server-side filtering: `filterProductObject()`
  - Field visibility: `canViewField()`
  - Hidden field tracking: `getHiddenFields()`

### 3. API Endpoints

#### a) Token Generation (for merchants)
```
POST /api/products/tokens/generate
```
Generate secure tokens for marketing channels.

#### b) Token Refresh (for customers)
```
POST /api/products/tokens/refresh
```
Allow users with expired tokens to request new access.

#### c) Updated Public Product API
```
GET /api/products/public/[slug]?token=xyz
```
Now validates tokens and filters product data server-side.

### 4. Documentation
- `SECURITY_SOLUTION.md` - Detailed security architecture
- `TOKEN_USE_CASES.md` - Real-world scenarios and flows
- `QUICK_REFERENCE.md` - Side-by-side comparisons
- `IMPLEMENTATION_GUIDE.md` - This file!

---

## Step-by-Step Implementation

### Step 1: Run Database Migration

```bash
# Apply the migration
# (Supabase will automatically run new migrations)

# Or manually in Supabase SQL editor:
# Copy contents of: supabase/migrations/20240101000040_create_access_tokens.sql
# Run in SQL editor
```

**Verify:**
```sql
-- Check table was created
SELECT * FROM product_access_tokens LIMIT 1;

-- Check views were created
SELECT * FROM active_access_tokens LIMIT 1;
```

---

### Step 2: Update Channel Link Generation

**Location:** `apps/web/app/dashboard/products/[productId]/preview-publish/page.tsx`

**Current code (insecure):**
```typescript
const getPublicProductUrl = (channel?: ChannelLink): string => {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const productSlug = productId
  const url = `${baseUrl}/products/${productSlug}`
  if (channel?.enabled && channel.parameter) {
    return `${url}?${channel.parameter}&merchant=true`  // ❌ Insecure!
  }
  return `${url}?merchant=true`
}
```

**New code (secure):**
```typescript
const generateSecureChannelUrl = async (channel: ChannelLink): Promise<string> => {
  try {
    // Call API to generate secure token
    const response = await fetch('/api/products/tokens/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        channel_id: channel.id,
        channel_name: channel.name,
        access_level: 'after_click',  // Or based on your configuration
        expires_in_days: 90  // Adjust as needed
      })
    })
    
    const data = await response.json()
    if (data.success) {
      return data.url  // Secure URL with token
    }
    throw new Error(data.error || 'Failed to generate token')
  } catch (error) {
    console.error('Error generating secure URL:', error)
    toast.error('Failed to generate secure link')
    return ''
  }
}

// Usage in your UI:
const handleGenerateLink = async (channel: ChannelLink) => {
  setIsGenerating(true)
  const secureUrl = await generateSecureChannelUrl(channel)
  setGeneratedUrl(secureUrl)
  setIsGenerating(false)
}
```

---

### Step 3: Update Public Product Page

**Location:** `apps/web/app/products/[slug]/page.tsx`

The API already handles token validation. Just make sure your client respects the filtered data:

```typescript
// In your product page component:
const { data: productData } = useProduct(productId)

// The API now returns:
// - Filtered product_data (only accessible fields)
// - _access_info (current access level)
// - _filtered (true if fields were hidden)

// UI can show locked field indicators:
{productData._access_info.level !== 'after_rfq' && (
  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
    <p>🔒 Some fields are hidden. Submit an RFQ to see all details.</p>
  </div>
)}
```

---

### Step 4: Update RFQ Submission

**Location:** `apps/web/app/api/products/rfq/route.ts`

Add token generation after successful RFQ submission:

```typescript
import { createRfqUpgradeToken } from '@/lib/api/access-tokens'

export async function POST(request: NextRequest) {
  try {
    // ... existing RFQ submission code ...
    
    // After successful RFQ save:
    const { data: rfq, error } = await supabase
      .from('product_rfqs')
      .insert({
        product_id,
        org_id,
        email,
        message,
        // ... other fields
      })
      .select()
      .single()
    
    if (error) throw error
    
    // ✨ NEW: Generate upgrade token
    const tokenResult = await createRfqUpgradeToken(
      product_id,
      org_id,
      rfq.rfq_id,
      supabase
    )
    
    if (!tokenResult.success) {
      console.error('Failed to generate upgrade token:', tokenResult.error)
      // Don't fail the RFQ, just log the error
    }
    
    // Return with upgrade token
    return NextResponse.json({
      success: true,
      rfq_id: rfq.rfq_id,
      upgrade_token: tokenResult.token,  // ← Client will use this
      redirect_url: tokenResult.url,      // ← Auto-redirect URL
    })
    
  } catch (error) {
    // ... error handling
  }
}
```

**Client-side (handle response):**
```typescript
// In your RFQ dialog/form:
const handleSubmitRfq = async (formData) => {
  try {
    const response = await fetch('/api/products/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    const data = await response.json()
    
    if (data.success && data.redirect_url) {
      toast.success('RFQ submitted! Redirecting to full product details...')
      
      // Auto-redirect to product with upgrade token
      setTimeout(() => {
        window.location.href = data.redirect_url
      }, 1500)
    }
  } catch (error) {
    toast.error('Failed to submit RFQ')
  }
}
```

---

### Step 5: Add Token Expiration UI

**Show expiration warning:**

```typescript
// In your product page:
const AccessLevelBanner = ({ accessInfo }: { accessInfo: any }) => {
  if (accessInfo.source === 'merchant') {
    return null  // Don't show for merchants
  }
  
  if (accessInfo.source === 'token' && accessInfo.expires_at) {
    const daysLeft = Math.floor(
      (new Date(accessInfo.expires_at).getTime() - Date.now()) / 
      (1000 * 60 * 60 * 24)
    )
    
    if (daysLeft < 7 && daysLeft > 0) {
      return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
          <p className="text-sm text-amber-800">
            ⏰ Your access link expires in {daysLeft} days.
            <button 
              onClick={() => requestTokenRefresh()}
              className="ml-2 underline font-medium"
            >
              Request extended access
            </button>
          </p>
        </div>
      )
    }
  }
  
  return null
}
```

**Handle expired tokens:**

```typescript
const ExpiredTokenBanner = ({ productId, userEmail }: any) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch('/api/products/tokens/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          email: userEmail  // Could prompt user to enter email
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Check your email for a new access link!')
      } else {
        toast.error(data.error || 'Failed to refresh access')
      }
    } catch (error) {
      toast.error('Failed to refresh token')
    } finally {
      setIsRefreshing(false)
    }
  }
  
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
      <p className="text-sm text-red-800">
        🔒 Your access link has expired. Some details are now hidden.
      </p>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        {isRefreshing ? 'Requesting...' : 'Request New Access Link'}
      </button>
    </div>
  )
}
```

---

### Step 6: Update Analytics Tracking

**Update access log to include token_id:**

```typescript
// In track-access API:
const response = await fetch('/api/products/track-access', {
  method: 'POST',
  body: JSON.stringify({
    product_id: productId,
    access_method: accessMethod,
    channel_id: channelId,
    channel_name: channelName,
    token_id: tokenInfo?.tokenId,  // ← Add this
    // ... other fields
  })
})
```

This allows analytics to track:
- Which tokens are most used
- Conversion rates per token/channel
- Token expiration impact

---

## Testing Checklist

### ✅ Test 1: Merchant Access (No Token)
```
1. Log in as merchant
2. Navigate to: /products/abc?merchant=true
3. ✅ Should see ALL fields (unfiltered)
4. Open DevTools Network → Check API response
5. ✅ Response includes all product_data fields
6. ✅ _access_info.level = "after_rfq"
7. ✅ _access_info.source = "merchant"
```

### ✅ Test 2: Public Access (No Token)
```
1. Open incognito/private window
2. Navigate to: /products/abc (no query params)
3. ✅ Should see only PUBLIC fields
4. Check Network tab
5. ✅ Response has filtered product_data
6. ✅ Restricted fields are null
7. ✅ _access_info.level = "public"
```

### ✅ Test 3: Channel Token (After Click)
```
1. Generate token via dashboard
2. Copy URL: /products/abc?token=xyz123...
3. Open in incognito window
4. ✅ Should see PUBLIC + AFTER_CLICK fields
5. ✅ Price visible, supplier cost hidden
6. ✅ _access_info.level = "after_click"
7. ✅ _access_info.source = "token"
```

### ✅ Test 4: RFQ Upgrade Token
```
1. Visit product (public access)
2. Submit RFQ form
3. ✅ Auto-redirected to /products/abc?token=rfq456...
4. ✅ Now see ALL fields
5. ✅ _access_info.level = "after_rfq"
6. Bookmark the URL
7. Revisit later → ✅ Still works (until expiration)
```

### ✅ Test 5: Expired Token
```
1. Manually set token expiration in database:
   UPDATE product_access_tokens 
   SET expires_at = NOW() - INTERVAL '1 day'
   WHERE token_hash = 'xxx';
   
2. Visit: /products/abc?token=expired_token
3. ✅ Page loads (not 404)
4. ✅ Falls back to public access
5. ✅ Shows "expired" banner/message
6. ✅ _access_info.expired = true
```

### ✅ Test 6: Invalid Token
```
1. Visit: /products/abc?token=invalid_random_string
2. ✅ Page loads (not 404)
3. ✅ Falls back to public access
4. ✅ No error shown to user
5. ✅ _access_info.level = "public"
```

### ✅ Test 7: Token Refresh
```
1. Use expired RFQ token
2. Click "Request New Access"
3. Enter email used in RFQ
4. ✅ New token generated
5. ✅ Email sent (if email service configured)
6. Visit new URL
7. ✅ Full access restored
```

---

## Security Verification

### 1. Check No Plain Tokens in Database
```sql
-- This should return TRUE (tokens are hashed)
SELECT 
  LENGTH(token_hash) = 64 as is_sha256,
  token_hash NOT LIKE '%abc%' as not_plain_text
FROM product_access_tokens
LIMIT 1;
```

### 2. Verify Server-Side Filtering
```
1. Open DevTools → Network tab
2. Visit product with public access
3. Find API request to /api/products/public/[slug]
4. Check response JSON
5. ✅ Restricted fields should be null (not present at all would be better, but null is acceptable)
6. ✅ Client never receives actual restricted values
```

### 3. Test Tampering
```
1. Get a valid token URL
2. Change one character in the token
3. Visit modified URL
4. ✅ Should fall back to public access
5. ✅ No error message exposing security details
```

### 4. Test Cross-Product Tokens
```
1. Generate token for Product A
2. Try to use it on Product B
   /products/B?token=product_A_token
3. ✅ Should fail validation
4. ✅ Falls back to public access
```

---

## Migration Strategy

### Phase 1: Parallel Operation (Week 1)
- ✅ Deploy new token system
- ✅ Old query param links still work (backward compatible)
- ✅ Both systems log to analytics
- ✅ Monitor for errors

### Phase 2: Migrate Existing Links (Week 2-3)
```typescript
// Script to migrate old channel links:
async function migrateOldLinks() {
  // 1. Find all products with old channel_links in product_data
  const products = await supabase
    .from('products')
    .select('*')
    .neq('product_data->channel_links', null)
  
  for (const product of products) {
    const oldChannels = product.product_data.channel_links || []
    
    for (const channel of oldChannels) {
      // 2. Generate new secure token for each channel
      await createAccessToken({
        productId: product.product_id,
        orgId: product.org_id,
        channelId: channel.id,
        channelName: channel.name,
        accessLevel: 'after_click',
        expiresInDays: 90,
        notes: `Migrated from old system`
      }, supabase)
    }
  }
}
```

### Phase 3: Deprecation Warning (Week 4)
- Show warning to merchants using old links
- Provide tool to regenerate all links
- Send notification emails

### Phase 4: Enforcement (Week 5+)
- Remove backward compatibility
- Old query params (`?ch=email`) no longer work
- All access requires tokens or authentication

---

## Performance Considerations

### Token Validation Caching
```typescript
// Add Redis/in-memory caching for token validation
const tokenCache = new Map()

async function validateTokenCached(token: string, supabase: any) {
  const cacheKey = `token:${hashToken(token)}`
  
  // Check cache first
  if (tokenCache.has(cacheKey)) {
    const cached = tokenCache.get(cacheKey)
    if (cached.expiresAt > Date.now()) {
      return cached.validation
    }
  }
  
  // Not in cache, validate normally
  const validation = await validateAccessToken(token, supabase)
  
  // Cache for 5 minutes
  tokenCache.set(cacheKey, {
    validation,
    expiresAt: Date.now() + 5 * 60 * 1000
  })
  
  return validation
}
```

---

## Troubleshooting

### Issue: "Token not working"
```
1. Check token exists in database:
   SELECT * FROM product_access_tokens 
   WHERE token_hash = 'xxx' AND is_revoked = FALSE;

2. Check expiration:
   SELECT expires_at, expires_at > NOW() as is_valid
   FROM product_access_tokens
   WHERE token_hash = 'xxx';

3. Check product_id matches:
   Token must be for the correct product
```

### Issue: "Merchant can't see all fields"
```
1. Verify merchant authentication:
   - Is ?merchant=true in URL?
   - Is user logged in?
   - Check browser cookies

2. Verify org membership:
   SELECT * FROM organization_members
   WHERE user_id = 'xxx' AND org_id = 'yyy';
```

### Issue: "RFQ doesn't upgrade access"
```
1. Check RFQ API response includes upgrade_token
2. Verify client redirects to new URL
3. Check token was created in database
4. Verify token validation succeeds
```

---

## Support

For questions or issues:
1. Check `SECURITY_SOLUTION.md` for architecture details
2. Check `TOKEN_USE_CASES.md` for flow examples
3. Check `QUICK_REFERENCE.md` for quick answers
4. Check database migration file for schema details

---

## Summary

**You've implemented:**
✅ Cryptographically secure tokens (SHA-256)
✅ Server-side access control (no client-side bypass)
✅ Graceful token expiration (falls back, doesn't break)
✅ Multiple access levels (public, after_click, after_rfq)
✅ Token refresh mechanism (email-based)
✅ Full audit trail (token usage tracking)
✅ Merchant-friendly (no tokens needed for own products)
✅ Marketplace-ready (public browse without tokens)

**Security improvements:**
- ❌ Before: All data sent to client, JS-based filtering
- ✅ After: Server filters data, only sends accessible fields
- ❌ Before: Easy to tamper with query params
- ✅ After: Cryptographically secure tokens
- ❌ Before: No expiration or revocation
- ✅ After: Full lifecycle management

**Your system is now secure!** 🎉

