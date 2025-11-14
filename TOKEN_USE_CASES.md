# 🎯 Token System Use Cases & Flows

## Table of Contents
1. [Token Expiration & Merchant Access](#token-expiration--merchant-access)
2. [Use Case 1: Merchant Viewing Own Products](#use-case-1-merchant-viewing-own-products)
3. [Use Case 2: Email Campaign Link](#use-case-2-email-campaign-link)
4. [Use Case 3: Marketplace Browse (All Products)](#use-case-3-marketplace-browse-all-products)
5. [Use Case 4: QR Code at Expo](#use-case-4-qr-code-at-expo)
6. [Use Case 5: RFQ Upgrade Path](#use-case-5-rfq-upgrade-path)
7. [Token Refresh Strategy](#token-refresh-strategy)

---

## Token Expiration & Merchant Access

### ✅ **Merchants Don't Need Tokens**

**Important:** Merchants are authenticated users and don't use tokens to view their own products.

```
┌─────────────────────────────────────────┐
│  Merchant Access (Authenticated)        │
├─────────────────────────────────────────┤
│                                         │
│  Merchant logs in                       │
│    ↓                                    │
│  Session stored in cookies              │
│    ↓                                    │
│  Visits: /products/abc?merchant=true    │
│    ↓                                    │
│  Server checks: auth.getUser()          │
│    ↓                                    │
│  ✅ User authenticated & is member      │
│    ↓                                    │
│  Access Level = "after_rfq" (full)      │
│    ↓                                    │
│  Returns ALL fields (unfiltered)        │
│                                         │
│  ⏰ Expiration: Session-based (days)    │
│  🔄 Refresh: Automatic (Supabase)       │
└─────────────────────────────────────────┘
```

**Key Point:** Merchant authentication is separate from token system. Their session doesn't expire quickly (typically 7+ days with refresh tokens).

---

## Use Case 1: Merchant Viewing Own Products

### Scenario
You (merchant) want to view your product page as it appears to customers.

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Merchant Dashboard                                          │
│  /dashboard/products/abc/preview-publish                     │
└──────────────────────────────────────────────────────────────┘
                    │
                    ├─── "View as Public" button
                    │
                    ↓
        ┌───────────────────────┐
        │ /products/abc         │  ← No token, no merchant flag
        │ Access: PUBLIC        │  ← Only sees public fields
        └───────────────────────┘
                    
                    ├─── "View as Merchant" button
                    │
                    ↓
        ┌────────────────────────────┐
        │ /products/abc?merchant=true│
        │ Access: AFTER_RFQ (full)   │  ← Sees ALL fields
        └────────────────────────────┘
                    │
                    ↓ (Server validates)
            ┌───────────────────┐
            │ auth.getUser()    │
            │ ✅ Authenticated  │
            │ ✅ Org member     │
            └───────────────────┘
```

**No Token Needed:** Merchant uses their authenticated session.

**Expiration:** 
- Session expires after 7 days (Supabase default)
- Auto-refreshes when active
- If expired, redirected to login

---

## Use Case 2: Email Campaign Link

### Scenario
You send a marketing email with a tracking link. Recipients click it and should see pricing info (but not supplier cost).

### Token Generation (One-Time)

```
┌─────────────────────────────────────────────────────────┐
│  Merchant Dashboard: Create Channel Link                │
└─────────────────────────────────────────────────────────┘
                    │
                    ↓
    ┌─────────────────────────────────────────┐
    │ POST /api/products/tokens/generate      │
    │ {                                       │
    │   product_id: "abc",                    │
    │   channel_id: "email_campaign_q1_2025", │
    │   access_level: "after_click",          │
    │   expires_in_days: 90                   │  ← Link valid for 90 days
    │ }                                       │
    └─────────────────────────────────────────┘
                    │
                    ↓
    ┌────────────────────────────────────────────────────┐
    │ Generated Link:                                    │
    │ https://app.com/products/abc?token=a1b2c3d4...     │
    │                                                    │
    │ Token Properties:                                  │
    │ - Cryptographically secure (64 chars)              │
    │ - Stored as SHA-256 hash in DB                     │
    │ - Access level: after_click                        │
    │ - Expires: 2025-05-14                              │
    └────────────────────────────────────────────────────┘
```

### User Journey

```
Day 1: User clicks link from email
    ↓
/products/abc?token=a1b2c3d4...
    ↓
Server validates token:
    ✅ Valid
    ✅ Not expired (89 days left)
    ✅ Access level: after_click
    ↓
Returns product with after_click fields:
    ✅ Product name
    ✅ Description
    ✅ Price (visible)
    ❌ Supplier cost (hidden)

─────────────────────────────────────────

Day 45: Same user returns (bookmarked)
    ↓
/products/abc?token=a1b2c3d4...
    ↓
Server validates token:
    ✅ Valid
    ✅ Not expired (45 days left)
    ✅ Access level: after_click
    ↓
Still works! Same access.

─────────────────────────────────────────

Day 91: User tries to access
    ↓
/products/abc?token=a1b2c3d4...
    ↓
Server validates token:
    ❌ EXPIRED
    ↓
Falls back to public access:
    ✅ Product name
    ✅ Description
    ❌ Price (now hidden)
    ❌ Supplier cost (hidden)
    
Option: Show message "This link has expired. 
        Request a new link from the merchant."
```

**Why Expire?**
- Security: Limits exposure if link is leaked
- Control: Merchant can revoke old campaigns
- Analytics: Track which campaigns are still active

**For Merchants:** You can always generate a new link with the same settings!

---

## Use Case 3: Marketplace Browse (All Products)

### Scenario
Public marketplace page where users can browse products from all merchants without clicking specific links.

### Solution: No Tokens Needed for Browse!

```
┌─────────────────────────────────────────────────────┐
│  Marketplace Homepage                               │
│  /marketplace                                       │
└─────────────────────────────────────────────────────┘
                    │
                    ↓
        ┌───────────────────────────┐
        │ Show product cards        │
        │ - Thumbnail               │
        │ - Product name            │
        │ - Category                │
        │ - "View Details" button   │
        └───────────────────────────┘
                    │
                    ↓ User clicks "View Details"
                    │
        ┌────────────────────────────────┐
        │ /products/abc                  │  ← No token
        │ Access: PUBLIC (default)       │
        └────────────────────────────────┘
                    │
                    ↓
        Shows public fields only:
        ✅ Product name
        ✅ Description
        ✅ Image
        ❌ Price (hidden)
        ❌ Contact info (hidden)
        
        [Show interest? Submit RFQ →]
                    │
                    ↓ User submits RFQ
                    │
        ┌─────────────────────────────────────┐
        │ POST /api/products/rfq              │
        │ Response:                           │
        │ {                                   │
        │   success: true,                    │
        │   upgrade_token: "x1y2z3..."        │  ← NEW TOKEN!
        │ }                                   │
        └─────────────────────────────────────┘
                    │
                    ↓ Auto-redirect
                    │
        ┌─────────────────────────────────────┐
        │ /products/abc?token=x1y2z3...       │
        │ Access: AFTER_RFQ (full)            │
        └─────────────────────────────────────┘
                    │
                    ↓
        Shows ALL fields:
        ✅ Product name
        ✅ Description
        ✅ Price
        ✅ Contact info
        ✅ Downloads enabled
```

### Key Design Decisions

**Option A: Public Browse (Recommended)**
```
No token required for browsing marketplace
↓
Users see basic info (public fields)
↓
If interested → Submit RFQ → Get upgrade token
↓
Now see full details with token
```

**Option B: Token Per Product**
```
Each product card has a "View Details" that generates a token
↓
User gets temporary token for that specific product
↓
But this is unnecessary complexity for public browse!
```

**Recommendation:** Use Option A (Public Browse)

---

## Use Case 4: QR Code at Expo

### Scenario
You print QR codes for trade show booth. Visitors scan to see product details.

### Setup (Before Expo)

```
┌─────────────────────────────────────────────────────┐
│  Merchant Dashboard                                 │
│  Generate QR Code for Expo                          │
└─────────────────────────────────────────────────────┘
                    │
                    ↓
    POST /api/products/tokens/generate
    {
      product_id: "abc",
      channel_id: "expo_vegas_2025",
      access_level: "after_click",
      expires_in_days: 14  ← Expires after expo ends
    }
                    │
                    ↓
    Generated: /products/abc?token=qr123...
                    │
                    ↓
    Convert to QR code → Print on banner
```

### During Expo

```
Day 1-3: Active Expo
    │
    ↓ Visitor scans QR
    │
/products/abc?token=qr123...
    │
    ↓
Server:
    ✅ Token valid
    ✅ Access: after_click
    ↓
Shows pricing & contact form
Visitor submits RFQ → Gets upgrade token
```

### After Expo

```
Day 15: Expo ended, token expired
    │
    ↓ Someone finds the QR online
    │
/products/abc?token=qr123...
    │
    ↓
Server:
    ❌ Token expired
    ↓
Falls back to public access
Shows basic info + "Contact us for details"
```

**Why This Works:**
- During expo: Full engagement (with token)
- After expo: Limited info (public only)
- Prevents old expo materials from granting access indefinitely

---

## Use Case 5: RFQ Upgrade Path

### Scenario
User submits RFQ and should immediately see all product details.

### Flow

```
User viewing product with public access
    ↓
/products/abc (no token)
Shows: Name, description only
    ↓
User clicks "Request Quote"
    ↓
Fills RFQ form:
    - Name
    - Email
    - Company
    - Message
    ↓
POST /api/products/rfq
{
  product_id: "abc",
  email: "buyer@company.com",
  message: "Interested in bulk order"
}
    ↓
Server:
    1. Creates RFQ record
    2. Sends email to merchant
    3. ✨ Generates upgrade token ✨
    
    createRfqUpgradeToken({
      productId: "abc",
      orgId: "merchant-org",
      rfqId: "rfq-12345",
      accessLevel: "after_rfq",
      expiresInDays: 30
    })
    ↓
Response:
{
  success: true,
  rfq_id: "rfq-12345",
  upgrade_token: "upgrade123...",
  redirect_url: "/products/abc?token=upgrade123..."
}
    ↓
Client auto-redirects:
/products/abc?token=upgrade123...
    ↓
Server validates token:
    ✅ Valid
    ✅ Access: after_rfq
    ↓
Shows EVERYTHING:
    ✅ Product name
    ✅ Description
    ✅ Pricing
    ✅ Technical specs
    ✅ Downloads available
    ✅ Direct contact info
    
User can bookmark this URL!
Valid for 30 days.
```

---

## Token Refresh Strategy

### Problem
What if user bookmarks a page with an expired token?

### Solution: Smart Fallback + Re-authentication Options

```
┌────────────────────────────────────────────────────┐
│  Token Expiration Handling Flow                    │
└────────────────────────────────────────────────────┘

User visits: /products/abc?token=expired123
    │
    ↓
Server validates token:
    │
    ├─► Token Valid
    │   └─► Return filtered data (normal flow)
    │
    ├─► Token Expired
    │   │
    │   ├─► Check if user has submitted RFQ before
    │   │   │
    │   │   ├─► Yes, has RFQ
    │   │   │   └─► Option 1: Show banner
    │   │   │       "Your access link expired.
    │   │   │        Click here to request new access."
    │   │   │       [Button: Verify Email & Get New Link]
    │   │   │
    │   │   └─► No RFQ
    │   │       └─► Fall back to public access
    │   │           Show: "Submit RFQ for full access"
    │   │
    │   └─► Return public data (fallback)
    │
    └─► Token Invalid (tampered)
        └─► 403 Error: "Invalid access link"
```

### Option: Email-Based Token Refresh

```
User has expired token
    ↓
Clicks "Request New Access"
    ↓
POST /api/products/tokens/refresh
{
  product_id: "abc",
  email: "buyer@company.com"  ← Email used in RFQ
}
    ↓
Server:
    1. Finds previous RFQ by email
    2. Verifies RFQ exists
    3. Generates new token
    4. Sends email with new link
    ↓
Email sent:
"Your new access link:
https://app.com/products/abc?token=new456..."
    ↓
User clicks → Full access restored
```

---

## Token Lifecycle Summary

### For Different User Types

| User Type | Token Needed? | Expiration | Refresh Method |
|-----------|--------------|------------|----------------|
| **Merchant** | ❌ No | Session-based (7+ days) | Auto-refresh by Supabase |
| **Email Recipient** | ✅ Yes | 30-90 days | Request new link via email |
| **Expo Visitor** | ✅ Yes | 7-14 days | Submit RFQ for upgrade |
| **RFQ Submitter** | ✅ Yes (upgrade) | 30 days | Email-based refresh |
| **Marketplace Browser** | ❌ No (public) | N/A | Submit RFQ to upgrade |

### Best Practices

**For Merchants:**
1. **Don't use tokens for yourself** - use `?merchant=true` with your authenticated session
2. **Set appropriate expiration** based on campaign type:
   - Event/Expo: Short (7-14 days)
   - Email campaign: Medium (30-90 days)
   - Partner link: Long (365 days) or no expiration
3. **Monitor token usage** in analytics dashboard
4. **Revoke tokens** if needed (compromised links)

**For Public Access (Marketplace):**
1. **No token required** for browsing
2. **Public fields only** visible by default
3. **RFQ submission** is the upgrade path
4. **Automatic upgrade token** issued after RFQ

**For Token Expiration:**
1. **Graceful degradation** - fall back to public access
2. **Clear messaging** - explain why fields are hidden
3. **Easy re-authentication** - email-based token refresh
4. **Don't break bookmarks** - page still loads, just with limited access

---

## Implementation: Smart Access Detection

### Recommended API Response Pattern

```typescript
// /api/products/public/[slug]

GET /products/abc?token=xyz

Response:
{
  product_id: "abc",
  product_name: "Vitamin C Supplement",
  product_data: {
    // Filtered based on access level
  },
  _access_info: {
    level: "after_click",           // Current access level
    source: "token",                 // How access was determined
    can_upgrade: true,               // Can submit RFQ to upgrade?
    upgrade_available: "after_rfq",  // What level can upgrade to
    expires_at: "2025-05-14",        // When current access expires
  },
  _ui_hints: {
    show_rfq_button: true,          // Should show RFQ button?
    show_locked_fields: true,        // Show "🔒" on hidden fields?
    locked_field_count: 5,           // How many fields are hidden
  }
}
```

This gives the client everything needed to show appropriate UI without exposing restricted data!

---

## Visual Summary: Access Levels Over Time

```
Public User Journey:
─────────────────────────────────────────────────────────

Day 1: Browse marketplace
    Access: PUBLIC (no token)
    Sees: 20% of fields
    
Day 1: Submits RFQ
    Access: AFTER_RFQ (upgrade token issued)
    Sees: 100% of fields
    Token expires: Day 31
    
Day 25: Returns via bookmark
    Access: AFTER_RFQ (token still valid)
    Sees: 100% of fields
    
Day 35: Returns via bookmark
    Access: PUBLIC (token expired, falls back)
    Sees: 20% of fields
    UI: "Your access expired. Request new link?"
    
Day 35: Requests new link via email
    Access: AFTER_RFQ (new token issued)
    Sees: 100% of fields
    Token expires: Day 65


Merchant Journey:
─────────────────────────────────────────────────────────

Always: Logged in session
    Access: AFTER_RFQ (authenticated)
    Sees: 100% of fields
    No token needed
    Expires: Session-based (7 days, auto-refreshes)
```

---

## FAQ

**Q: What if I want my channel links to never expire?**
A: Set `expires_in_days: null` when generating token. But consider security implications!

**Q: Can I manually revoke a token?**
A: Yes! Call `revokeAccessToken(tokenId)` or update `is_revoked = true` in database.

**Q: What if someone shares a token link publicly?**
A: 
- Token is still secure (can't be forged)
- You can revoke it if detected
- Set short expiration for sensitive campaigns
- Consider IP binding for extra security

**Q: How do I track which channel a user came from?**
A: Token includes `channel_id`. All access logs record the `token_id`, which links to the channel.

**Q: Marketplace needs all products public - do I need tokens?**
A: No! Just access `/products/abc` without token. Public fields are always accessible without authentication.

---

## Conclusion

**The system is flexible:**
- Merchants: Use authenticated sessions (no tokens)
- Targeted campaigns: Use tokens with expiration
- Public browse: No tokens needed
- Upgrade path: RFQ → automatic token generation

**Tokens expire but access doesn't disappear** - it gracefully degrades to public access with options to re-authenticate.

