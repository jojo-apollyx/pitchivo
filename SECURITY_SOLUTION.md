# 🔒 Secure Access Control Solution

## Problem Summary

**Current Vulnerabilities:**
1. ❌ Full product data sent to browser (all fields visible in DevTools)
2. ❌ Access control enforced client-side only (easily bypassed)
3. ❌ Query parameters (`?ch=email`) can be tampered with
4. ❌ No server-side validation of access permissions

## Solution Architecture

### 1. **Token-Based Access System**

Replace query parameters with cryptographically secure access tokens:

```
❌ BAD:  /products/abc123?ch=email&merchant=true
✅ GOOD: /products/abc123?token=eyJhbGc...secure_jwt_token
```

**Benefits:**
- Tokens are cryptographically signed (can't be forged)
- Each token has a specific access level embedded
- Tokens can expire
- Tokens are tied to specific channels in database

### 2. **Server-Side Field Filtering**

API only returns fields that the user is authorized to see:

```typescript
// ❌ Current (sends everything):
return { ...product }

// ✅ Secure (filters based on token):
return filterProductFields(product, accessLevel)
```

### 3. **Database Schema for Access Tokens**

```sql
CREATE TABLE product_access_tokens (
  token_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(product_id),
  channel_id TEXT NOT NULL,
  access_level TEXT NOT NULL, -- 'public', 'after_click', 'after_rfq'
  token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the token
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. **Access Level Hierarchy**

```
🌐 Public (token_level=0)
  ↓ can upgrade to
✉️ After Click (token_level=1)
  ↓ can upgrade to
🧾 After RFQ (token_level=2)
```

### 5. **Token Generation Flow**

```
Merchant creates channel link
  ↓
System generates secure token with access_level='after_click'
  ↓
Token stored in database
  ↓
Link includes token: /products/abc?token=xyz
  ↓
User visits → Server validates token → Returns filtered fields
```

### 6. **RFQ Upgrade Path**

```
User submits RFQ
  ↓
Server generates new token with access_level='after_rfq'
  ↓
Response includes: { success: true, upgrade_token: 'new_token' }
  ↓
Client redirects to: /products/abc?token=new_token
  ↓
User now sees all fields
```

## Implementation Steps

### Step 1: Create Migration for Access Tokens Table
### Step 2: Add Token Generation API
### Step 3: Update Public Product API to Validate Token & Filter Fields
### Step 4: Update Channel Link Generation
### Step 5: Update RFQ Submission to Issue Upgrade Token
### Step 6: Update Frontend to Use Tokens

## Security Features

✅ **Cryptographically Secure**: Uses crypto.randomBytes + SHA-256
✅ **Server-Side Validation**: All checks happen on the server
✅ **Database-Backed**: Tokens are stored and validated against DB
✅ **Rate-Limited**: Can add rate limiting per token
✅ **Auditable**: All access logged with token_id
✅ **Revocable**: Tokens can be deleted from database
✅ **Expirable**: Optional expiration timestamps
✅ **Non-Tamperable**: Changing token in URL invalidates it

## API Endpoints

### POST /api/products/tokens/generate
Generate a new access token for a channel

**Request:**
```json
{
  "product_id": "uuid",
  "channel_id": "email_campaign_1",
  "access_level": "after_click",
  "expires_in_days": 30
}
```

**Response:**
```json
{
  "token": "secure_random_token_here",
  "url": "https://app.com/products/abc?token=...",
  "access_level": "after_click",
  "expires_at": "2025-12-14T00:00:00Z"
}
```

### GET /api/products/public/[slug]?token=xyz
Get product data (filtered by token's access level)

**Response (token with after_click access):**
```json
{
  "product_id": "uuid",
  "product_name": "Product Name",
  "product_data": {
    "product_name": "Name",  // public field
    "description": "Desc",    // public field
    "price": "100",           // after_click field (visible)
    "supplier_cost": null     // after_rfq field (HIDDEN)
  },
  "access_level": "after_click"
}
```

### POST /api/products/rfq (upgraded)
Submit RFQ and receive upgrade token

**Response:**
```json
{
  "success": true,
  "rfq_id": "uuid",
  "upgrade_token": "new_secure_token_with_after_rfq_access",
  "redirect_url": "/products/abc?token=new_secure_token..."
}
```

## Client-Side Changes

```typescript
// ❌ Old way (insecure):
const url = `/products/${productId}?ch=email&merchant=true`

// ✅ New way (secure):
const { token, url } = await generateAccessToken(productId, channelId)
// url = `/products/${productId}?token=secure_cryptographic_token`
```

## Migration Strategy

### Phase 1: Backward Compatible (Week 1)
- Add token system alongside existing query param system
- Both systems work in parallel
- Log warnings for non-token access

### Phase 2: Deprecation (Week 2-3)
- Show warnings to merchants using old links
- Provide migration tool to regenerate links with tokens

### Phase 3: Enforcement (Week 4+)
- Remove query param system
- Require tokens for all access (except truly public products)

## Additional Security Measures

### 1. **Rate Limiting**
```typescript
// Limit requests per token to prevent abuse
if (await isRateLimited(tokenHash)) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### 2. **IP Binding (Optional)**
```typescript
// Optionally bind token to first IP that uses it
if (token.bound_ip && request.ip !== token.bound_ip) {
  return NextResponse.json({ error: 'Token bound to different IP' }, { status: 403 })
}
```

### 3. **Device Fingerprinting (Optional)**
- Store user agent with first token use
- Flag suspicious activity if device changes

### 4. **Token Refresh**
- Short-lived tokens (24h) with refresh mechanism
- Reduces window of exposure if token is leaked

## Testing Checklist

- [ ] Token generation works
- [ ] Public access (no token) only shows public fields
- [ ] after_click token shows public + after_click fields
- [ ] after_rfq token shows all fields
- [ ] Invalid token returns 403
- [ ] Expired token returns 401
- [ ] Tampered token detected and rejected
- [ ] RFQ upgrade path works
- [ ] Analytics track token usage
- [ ] Channel attribution works with tokens

## Monitoring & Analytics

```sql
-- Track which tokens are most used
SELECT 
  channel_id,
  access_level,
  COUNT(*) as total_uses,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM product_access_logs
WHERE token_id IS NOT NULL
GROUP BY channel_id, access_level;
```

## Cost Considerations

- Database: ~1KB per token (negligible)
- API calls: No increase (same endpoints)
- Complexity: Medium (one-time implementation)
- Maintenance: Low (set and forget)

## Comparison: Before vs After

| Aspect | Before (Insecure) | After (Secure) |
|--------|-------------------|----------------|
| **Access Control** | Client-side | ✅ Server-side |
| **Data Exposure** | All fields sent | ✅ Filtered by permission |
| **Tampering** | Easy (query params) | ✅ Impossible (crypto tokens) |
| **Auditability** | Limited | ✅ Full audit trail |
| **Revocable** | No | ✅ Yes (delete token) |
| **Expirable** | No | ✅ Yes (TTL) |
| **Channel Attribution** | Unreliable | ✅ Guaranteed |

## Implementation Timeline

- **Day 1**: Database migration + token generation API
- **Day 2**: Update public product API with filtering
- **Day 3**: Update channel link generation UI
- **Day 4**: Update RFQ flow with upgrade tokens
- **Day 5**: Testing & bug fixes
- **Week 2**: Roll out to production with monitoring

## Conclusion

This solution transforms your access control from **client-side suggestion** to **server-enforced security**. Users can no longer bypass restrictions by inspecting network requests or modifying JavaScript.

**Key Principle**: *Never trust the client. Always validate and filter on the server.*

