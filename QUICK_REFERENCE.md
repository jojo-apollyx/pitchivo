# 🚀 Quick Reference: Access Control Use Cases

## Side-by-Side Comparison

| Scenario | URL Example | Token Needed? | Access Level | Expiration | What Happens When Expired? |
|----------|-------------|---------------|--------------|------------|----------------------------|
| **Merchant viewing own product** | `/products/abc?merchant=true` | ❌ No (uses auth session) | `after_rfq` (full) | 7+ days (session) | Auto-refreshes or redirects to login |
| **Email campaign link** | `/products/abc?token=xyz123...` | ✅ Yes | `after_click` | 30-90 days | Falls back to public access, show "expired" message |
| **Public marketplace browse** | `/products/abc` | ❌ No | `public` | Never | Always works (public fields) |
| **QR code at expo** | `/products/abc?token=qr789...` | ✅ Yes | `after_click` | 7-14 days | Falls back to public access after event |
| **After RFQ submission** | `/products/abc?token=rfq456...` | ✅ Yes (auto-generated) | `after_rfq` (full) | 30 days | User can request refresh via email |

---

## What Each User Type Sees

```
┌─────────────────────────────────────────────────────────────────────┐
│  Field Visibility by Access Level                                   │
├──────────────────┬──────────┬──────────────┬──────────────┬─────────┤
│  Field Name      │  Public  │  After Click │   After RFQ  │ Merchant│
├──────────────────┼──────────┼──────────────┼──────────────┼─────────┤
│  Product Name    │    ✅    │      ✅      │      ✅      │    ✅   │
│  Description     │    ✅    │      ✅      │      ✅      │    ✅   │
│  Category        │    ✅    │      ✅      │      ✅      │    ✅   │
│  Image           │    ✅    │      ✅      │      ✅      │    ✅   │
├──────────────────┼──────────┼──────────────┼──────────────┼─────────┤
│  Price           │    ❌    │      ✅      │      ✅      │    ✅   │
│  MOQ             │    ❌    │      ✅      │      ✅      │    ✅   │
│  Lead Time       │    ❌    │      ✅      │      ✅      │    ✅   │
│  Contact Info    │    ❌    │      ✅      │      ✅      │    ✅   │
├──────────────────┼──────────┼──────────────┼──────────────┼─────────┤
│  Supplier Cost   │    ❌    │      ❌      │      ✅      │    ✅   │
│  Margin          │    ❌    │      ❌      │      ✅      │    ✅   │
│  Internal Notes  │    ❌    │      ❌      │      ✅      │    ✅   │
│  Documents       │    ❌    │      ❌      │      ✅      │    ✅   │
└──────────────────┴──────────┴──────────────┴──────────────┴─────────┘

Legend:
✅ = Visible
❌ = Hidden (returns null)
```

---

## Flow Diagrams

### 1️⃣ Merchant Flow (No Token Needed)

```
Merchant logs in
    │
    ↓
Dashboard: /dashboard/products
    │
    ↓ Clicks "View Product"
    │
/products/abc?merchant=true
    │
    ↓ Server checks auth
    │
✅ Authenticated & Org Member
    │
    ↓
Access Level: after_rfq (FULL)
    │
    ↓
Sees: ALL FIELDS (100%)
    │
    ↓ Session expires after 7 days?
    │
🔄 Auto-refreshes (Supabase handles it)
    │
    ↓ Manual refresh needed?
    │
Redirects to /login → Back to dashboard
```

**Key Points:**
- ✅ No token required
- ✅ Session-based authentication
- ✅ Auto-refresh built-in
- ✅ Never falls back to limited access
- ✅ Always sees 100% of fields

---

### 2️⃣ Email Campaign Flow (Token Required)

```
Merchant creates link (ONE TIME)
    │
    ↓
POST /api/products/tokens/generate
{
  channel_id: "email_q1_2025",
  access_level: "after_click",
  expires_in_days: 90
}
    │
    ↓
Token generated: xyz123...
Link: /products/abc?token=xyz123...
    │
    ↓ Send in email campaign
    │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

100 recipients click link
    │
    ↓
/products/abc?token=xyz123...
    │
    ↓ Server validates ONCE per visit
    │
✅ Valid, expires in 85 days
    │
    ↓
Access Level: after_click
    │
    ↓
Sees: PUBLIC + AFTER_CLICK fields (60%)
    │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Day 90: Same link
    │
    ↓
/products/abc?token=xyz123...
    │
    ↓ Server validates
    │
❌ EXPIRED
    │
    ↓ Falls back to public
    │
Access Level: public
    │
    ↓
Sees: PUBLIC fields only (20%)
    │
    ↓ UI shows banner
    │
"Link expired. Request new access?"
    │
    ↓ User clicks "Request Access"
    │
POST /api/products/tokens/refresh
{ email: "user@example.com" }
    │
    ↓ Server checks RFQ history
    │
✅ Found previous RFQ
    │
    ↓
New token generated
Email sent with new link
    │
    ↓
User clicks new link → Full access restored
```

**Key Points:**
- ✅ ONE token for entire campaign (all recipients use same link)
- ✅ 90-day validity window
- ✅ Graceful degradation (not broken, just limited)
- ✅ Easy refresh via email verification

---

### 3️⃣ Marketplace Browse Flow (No Token)

```
User visits marketplace
    │
    ↓
/marketplace
    │
    ↓ Shows product grid
    │
┌──────────────────────────┐
│ Product Card (Public)    │
│ - Thumbnail              │
│ - Name                   │
│ - Category               │
│ [View Details]           │
└──────────────────────────┘
    │
    ↓ Clicks "View Details"
    │
/products/abc (no token)
    │
    ↓ No authentication
    │
Access Level: public (default)
    │
    ↓
Sees: PUBLIC fields only (20%)
    │
    ↓ UI shows
    │
"Want to see pricing? Submit RFQ"
[Submit RFQ Button]
    │
    ↓ User fills form & submits
    │
POST /api/products/rfq
{
  email: "buyer@company.com",
  message: "Interested in bulk order"
}
    │
    ↓ Server processes
    │
1. ✅ RFQ saved
2. ✅ Email sent to merchant
3. ✅ Upgrade token generated automatically
    │
    ↓ Response
    │
{
  success: true,
  upgrade_token: "rfq456...",
  redirect_url: "/products/abc?token=rfq456..."
}
    │
    ↓ Client auto-redirects
    │
/products/abc?token=rfq456...
    │
    ↓ Server validates
    │
✅ Valid RFQ token
    │
    ↓
Access Level: after_rfq (FULL)
    │
    ↓
Sees: ALL FIELDS (100%)
    │
    ↓ User bookmarks this URL
    │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

30 days later: User returns via bookmark
    │
    ↓
/products/abc?token=rfq456...
    │
    ↓ Server validates
    │
✅ Still valid (expires in 30 days)
    │
    ↓
Still sees: ALL FIELDS (100%)
```

**Key Points:**
- ✅ No token needed for browsing
- ✅ Public access by default (no barriers)
- ✅ RFQ submission = automatic upgrade
- ✅ Bookmark-friendly URLs

---

## Token Expiration Behavior Summary

### What Happens When Token Expires?

```
┌───────────────────────────────────────────────────────────┐
│  Before Expiration                                        │
├───────────────────────────────────────────────────────────┤
│  GET /products/abc?token=xyz123                           │
│                                                           │
│  Response:                                                │
│  {                                                        │
│    product_data: { ... all after_click fields ... },     │
│    _access_info: {                                        │
│      level: "after_click",                                │
│      expires_at: "2025-05-14"  ← 10 days left             │
│    }                                                      │
│  }                                                        │
└───────────────────────────────────────────────────────────┘

                        ⏰ TIME PASSES ⏰

┌───────────────────────────────────────────────────────────┐
│  After Expiration                                         │
├───────────────────────────────────────────────────────────┤
│  GET /products/abc?token=xyz123                           │
│                                                           │
│  Response: (NOT 404 ERROR!)                               │
│  {                                                        │
│    product_data: { ... only public fields ... },          │
│    _access_info: {                                        │
│      level: "public",  ← Downgraded                       │
│      previous_level: "after_click",  ← What it was        │
│      expired: true,  ← Flag for UI                        │
│      can_refresh: true  ← Has RFQ history                 │
│    }                                                      │
│  }                                                        │
└───────────────────────────────────────────────────────────┘
```

**The page still works!** Just with limited access.

---

## Merchant vs. Customer Comparison

### Merchant Dashboard Scenario

```
Question: "As a merchant, how do I keep viewing my product?"

Answer: You DON'T use tokens at all!

✅ Correct Way (Merchant):
    1. Log in to your account
    2. Go to dashboard
    3. View product with ?merchant=true
    4. Session lasts 7+ days
    5. Auto-refreshes while active
    6. No expiration worries

❌ Wrong Way (Don't Do This):
    Creating a token for yourself
    → Unnecessary complexity
    → Will expire
    → You already have better auth!
```

### Customer Scenario

```
Question: "What if customer's link expires?"

Answer: Graceful degradation with easy recovery

Scenario A: Email Campaign Link
    Link expires → See public info only
    → Submit RFQ or request refresh
    → Get new 30-day token

Scenario B: After RFQ Submission
    Link expires after 30 days
    → Request new link via email
    → Verify email ownership
    → Get new token automatically

Scenario C: Marketplace Browsing
    No link at all (public access)
    → Always works
    → Submit RFQ to upgrade
    → Get permanent access
```

---

## Implementation Checklist

### For Your Marketplace Page

```typescript
// ✅ DO: Public access for browsing
<ProductGrid>
  {products.map(product => (
    <ProductCard 
      href={`/products/${product.id}`}  // ← No token
      showLimitedInfo={true}             // ← Public fields only
    />
  ))}
</ProductGrid>

// ❌ DON'T: Generate tokens for every product card
// This is unnecessary for public browsing!
```

### For Your Dashboard (Merchant)

```typescript
// ✅ DO: Use authenticated session
const viewProductUrl = `/products/${productId}?merchant=true`

// Server will check:
// 1. Is user authenticated? (session)
// 2. Is user member of product's org?
// 3. If yes → Full access (no token needed)

// ❌ DON'T: Generate tokens for yourself
// You have better authentication already!
```

### For Channel Links (Email/QR)

```typescript
// ✅ DO: Generate ONE token per channel
const { token, url } = await generateToken({
  productId,
  channelId: 'email_campaign_q1',
  accessLevel: 'after_click',
  expiresInDays: 90
})

// Share this URL with all recipients
// url: /products/abc?token=xyz123...

// ❌ DON'T: Generate unique token per recipient
// Unnecessary unless you need individual tracking
```

---

## Quick Decision Tree

```
START: How should user access product?
    │
    ├─► Is user the merchant (owner)?
    │       │
    │       └─► YES: Use ?merchant=true (authenticated session)
    │           No token needed ✅
    │
    ├─► Is it a marketing campaign (email/QR)?
    │       │
    │       └─► YES: Generate ONE token for campaign
    │           Set expiration = campaign duration + buffer
    │           Example: expo (14 days), email (90 days)
    │
    ├─► Is it public marketplace browsing?
    │       │
    │       └─► YES: No token needed
    │           Public access by default
    │           Upgrade via RFQ submission
    │
    └─► Is it after RFQ submission?
            │
            └─► YES: Auto-generate upgrade token
                Access level = after_rfq
                30-day expiration
```

---

## Summary: Your Concerns Addressed

### "What if token expires?"

**For Merchants:**
- ✅ You don't use tokens - use authenticated sessions
- ✅ Sessions auto-refresh
- ✅ Last 7+ days
- ✅ Never expires while active

**For Customers:**
- ✅ Page doesn't break - gracefully degrades to public access
- ✅ Can request new token via email
- ✅ If they submitted RFQ, easy refresh
- ✅ Bookmarked URLs still work (just limited access)

### "Marketplace with all products?"

**Solution:**
- ✅ No tokens needed for browsing!
- ✅ All products have public access by default
- ✅ Users see basic info (name, category, image)
- ✅ To see more → Submit RFQ → Auto-upgrade to full access
- ✅ No expired links to worry about

### "Display all products from all merchants?"

```
Marketplace Page:
    /marketplace (public)
    │
    ├─► Product A from Merchant 1
    │   /products/a (public access)
    │
    ├─► Product B from Merchant 2
    │   /products/b (public access)
    │
    └─► Product C from Merchant 3
        /products/c (public access)

All visible without authentication!
Fields configured as "public" are shown.
```

**No tokens needed** unless you want to give someone special access to a specific product before they submit RFQ (e.g., partner links, email campaigns).

---

## Final Recommendation

**For 99% of marketplace use cases:**

1. **Merchants:** Use authenticated sessions (`?merchant=true`)
   - Never expires while logged in
   - No token management needed

2. **Public browsing:** No tokens
   - Always accessible
   - Shows public fields

3. **Special campaigns:** Use tokens with appropriate expiration
   - Email: 90 days
   - Events: 14 days
   - Partners: 365 days or no expiration

4. **After RFQ:** Auto-generate token
   - 30-day expiration
   - Easy refresh via email

**Result:** Secure, user-friendly, and no broken links!

