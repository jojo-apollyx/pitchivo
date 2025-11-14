# Simple URL Guide

## What is RealPagePreview?
**RealPagePreview** is just the component that displays the product page. It's the visual layout - nothing complicated. Think of it as the "template" for showing product information.

---

## Three Types of URLs

### 1. **Public URL** (Anyone can see, limited fields)
```
http://localhost:3000/products/6298a29d-12e0-4bf1-8faf-411469afcbf0
```
- **No token needed**
- Shows only public fields (product name, description, basic info)
- Works for anyone browsing your marketplace
- **Use case**: Share on social media, public listings

---

### 2. **Email Link URL** (After clicking email link)
```
http://localhost:3000/products/6298a29d-12e0-4bf1-8faf-411469afcbf0?token=e12fde91527ff88178137c823a81ec4654faa177f82330d78e8cc14cda651058
```
- **Has `?token=...` parameter**
- Token grants `after_click` access level
- Shows public fields + fields marked as "after_click" (like pricing, inventory)
- **Use case**: Send in email campaigns, QR codes at events

---

### 3. **After RFQ URL** (After submitting Request for Quote)
```
http://localhost:3000/products/6298a29d-12e0-4bf1-8faf-411469afcbf0?token=rfq_token_here
```
- **Has `?token=...` parameter** (different token, auto-generated after RFQ)
- Token grants `after_rfq` access level
- Shows ALL fields (public + after_click + after_rfq)
- Files become downloadable
- **Use case**: User submitted RFQ, now they see everything

---

## How to Get Each URL

### Public URL
```typescript
const publicUrl = `/products/${productId}`
// Example: /products/6298a29d-12e0-4bf1-8faf-411469afcbf0
```

### Email Link URL (Generate Token)
```typescript
// In your dashboard, click "Copy Link" for a channel
// It automatically generates a token and returns:
const emailUrl = `/products/${productId}?token=generated_token_here`
```

### After RFQ URL (Auto-Generated)
```typescript
// When user submits RFQ, the API automatically:
// 1. Creates a token with 'after_rfq' access
// 2. Returns upgrade_url in response
// 3. User gets redirected to that URL
const afterRfqUrl = `/products/${productId}?token=rfq_upgrade_token`
```

---

## Why "Product Not Found"?

The product might not be found because:
1. **Product not published** - Check `status = 'published'` in database
2. **Wrong product_id** - Make sure the UUID in URL matches the product
3. **Token expired** - Token might be expired (default 90 days)

---

## Quick Test

1. **Test Public URL**: 
   - Open: `http://localhost:3000/products/YOUR_PRODUCT_ID`
   - Should show product (limited fields)

2. **Test Email URL**:
   - Go to dashboard → Preview & Publish
   - Click "Copy Link" for Email channel
   - Open that URL in another browser
   - Should show more fields (after_click level)

3. **Test After RFQ URL**:
   - Submit an RFQ on the product page
   - You'll be redirected to URL with `after_rfq` token
   - Should show ALL fields + downloadable files

---

## Summary

| URL Type | Format | Access Level | Fields Visible |
|----------|--------|--------------|----------------|
| Public | `/products/{id}` | `public` | Public fields only |
| Email Link | `/products/{id}?token=xxx` | `after_click` | Public + After Click fields |
| After RFQ | `/products/{id}?token=xxx` | `after_rfq` | ALL fields + downloads |

That's it! No magic, just three URL patterns.

