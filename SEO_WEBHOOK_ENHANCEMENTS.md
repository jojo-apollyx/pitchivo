# SEO & Webhook Enhancements

## 📋 Summary

This document describes the enhancements made to:
1. **Brevo Webhook Logging** - Comprehensive logging for debugging webhook issues
2. **Product Page SEO/AEO** - Enhanced search engine optimization and dynamic sitemap

---

## 🔔 1. Brevo Webhook Enhanced Logging

### What Was Added

Comprehensive logging throughout the webhook processing pipeline to help you debug issues when webhooks don't work as expected.

### Changes Made

**File**: `apps/web/app/api/webhooks/brevo/route.ts`

#### A. Request Logging (POST Handler)
```typescript
console.log('============================================')
console.log('🔔 BREVO WEBHOOK RECEIVED')
console.log('Timestamp:', new Date().toISOString())
console.log('Headers:', {
  'content-type': request.headers.get('content-type'),
  'user-agent': request.headers.get('user-agent'),
  'authorization': request.headers.get('authorization') ? 'Bearer [PRESENT]' : '[MISSING]',
})
console.log('📦 Raw payload:', JSON.stringify(body, null, 2))
console.log(`📊 Processing ${events.length} event(s)`)
```

**Logs show:**
- When webhook was received
- Request headers (useful for debugging auth issues)
- Full payload from Brevo
- Number of events being processed

#### B. Event Processing Logging
```typescript
console.log(`📧 Event Type: ${eventType}`)
console.log(`👤 Recipient: ${email}`)
console.log(`📬 Message ID: ${messageId || 'N/A'}`)
console.log(`📅 Date: ${date || (ts ? new Date(ts * 1000).toISOString() : 'N/A')}`)
console.log(`🔄 Normalized event: ${normalizedEvent}`)
console.log(`✅ Mapped to our event type: ${ourEventType}`)
console.log(`🏷️  All tags:`, allTags)
console.log(`🎯 Campaign ID: ${campaignId}`)
console.log(`📝 Activity type: ${activityType}`)
```

**Logs show:**
- Each step of event processing
- Event type mapping
- Campaign ID extraction
- Tag information

#### C. Database Operation Logging
```typescript
console.log(`💾 Inserting activity record into database...`)
// ... insert operation
if (insertError) {
  console.error('❌ Error inserting activity:', insertError)
  console.error('Insert error details:', JSON.stringify(insertError, null, 2))
} else {
  console.log('✅ Activity record created successfully')
}
```

**Logs show:**
- Database insert operations
- Success/failure status
- Detailed error messages if something fails

#### D. Metrics Update Logging
```typescript
console.log(`📈 Incrementing metric: ${metric}`)
const { data, error } = await supabaseAdmin.rpc('increment_campaign_metric', {
  p_campaign_id: campaignId,
  p_metric: metric,
  p_increment: 1
})

if (error) {
  console.error(`❌ Failed to increment metric ${metric}:`, error)
  console.error('RPC error details:', JSON.stringify(error, null, 2))
} else {
  console.log(`✅ Metric ${metric} incremented successfully`)
  if (data) console.log('RPC response:', data)
}
```

**Logs show:**
- Which metric is being updated
- Success/failure of RPC calls
- Detailed error messages for debugging

#### E. Special Event Logging

Enhanced logging for critical events:

**Unsubscribes:**
```typescript
console.log(`🚫 UNSUBSCRIBE EVENT`)
console.log(`   Campaign: ${campaignId}`)
console.log(`   Email: ${email}`)
console.log(`   Reason: ${event.reason || 'Not specified'}`)
```

**Spam Complaints (Critical!):**
```typescript
console.warn(`⚠️  🚨 SPAM COMPLAINT 🚨`)
console.warn(`   Campaign: ${campaignId}`)
console.warn(`   Email: ${email}`)
console.warn(`   This is a CRITICAL issue that needs immediate attention!`)
console.warn(`   Event details:`, JSON.stringify(event, null, 2))
```

**Hard Bounces:**
```typescript
console.log(`❌ HARD BOUNCE / INVALID EMAIL`)
console.log(`   Campaign: ${campaignId}`)
console.log(`   Email: ${email}`)
console.log(`   Reason: ${event.reason || 'Not specified'}`)
console.log(`   Code: ${event.code || 'N/A'}`)
```

**Blocked Emails:**
```typescript
console.warn(`🛑 EMAIL BLOCKED`)
console.warn(`   Campaign: ${campaignId}`)
console.warn(`   Email: ${email}`)
console.warn(`   Reason: ${event.reason || 'Not specified'}`)
```

**Deferred Emails:**
```typescript
console.log(`⏸️  EMAIL DEFERRED (will retry)`)
console.log(`   Campaign: ${campaignId}`)
console.log(`   Email: ${email}`)
console.log(`   Reason: ${event.reason || 'Not specified'}`)
```

#### F. Performance Logging
```typescript
const duration = Date.now() - startTime
console.log(`\n⏱️ Total processing time: ${duration}ms`)
console.log('✅ WEBHOOK PROCESSING COMPLETE')
```

**Logs show:**
- Total time to process webhook
- Success/failure summary

#### G. Error Logging
```typescript
console.error('============================================')
console.error('❌ ERROR PROCESSING BREVO WEBHOOK')
console.error('Error type:', error.constructor.name)
console.error('Error message:', error.message)
console.error('Stack trace:', error.stack)
console.error(`⏱️ Failed after: ${duration}ms`)
console.error('============================================\n')
```

**Logs show:**
- Detailed error information
- Full stack trace
- Time before failure

#### H. Health Check Logging (GET endpoint)
```typescript
console.log('ℹ️  Brevo webhook verification/health check requested')
console.log('Timestamp:', new Date().toISOString())
console.log('Request URL:', request.url)
console.log('User-Agent:', request.headers.get('user-agent'))
```

### How to Use the Logs

#### 1. **View Logs in Vercel**
- Go to your Vercel dashboard
- Navigate to your project
- Click on "Logs" tab
- Filter by "webhooks/brevo" or search for emoji indicators

#### 2. **Search for Specific Events**
Use these emoji indicators to quickly find log entries:

- `🔔` - Webhook received
- `📦` - Raw payload
- `📧` - Email event details
- `🎯` - Campaign identification
- `💾` - Database operations
- `📈` - Metric updates
- `✅` - Success
- `❌` - Errors
- `⚠️` - Warnings
- `🚨` - Critical issues (spam complaints)
- `🛑` - Blocked emails
- `🚫` - Unsubscribes

#### 3. **Common Debugging Scenarios**

**Scenario 1: Webhook not receiving events**
Look for:
- `🔔 BREVO WEBHOOK RECEIVED` - If missing, check Brevo webhook configuration
- Check if Authorization header shows `[PRESENT]` or `[MISSING]`

**Scenario 2: Events not mapping correctly**
Look for:
- `⚠️  Unknown Brevo event type` - Indicates unmapped event type
- `🔄 Normalized event:` - Shows how event name was normalized
- `Available mappings:` - Shows what event types are supported

**Scenario 3: Campaign not found**
Look for:
- `⚠️  No campaign tag found` - Email not tagged with campaign ID
- `🏷️  All tags:` - Shows what tags were received

**Scenario 4: Database errors**
Look for:
- `❌ Error inserting activity` - Activity creation failed
- `❌ Failed to increment metric` - Metric update failed
- Check error details for RPC issues or permission problems

**Scenario 5: Metrics not updating**
Look for:
- `📈 Incrementing metric:` - Shows which metric is being updated
- `✅ Metric X incremented successfully` - Confirms success
- `ℹ️  No metric mapping for event type` - Event type doesn't map to a metric

---

## 🔍 2. Enhanced Product Page SEO/AEO

### What Was Added

Comprehensive SEO (Search Engine Optimization) and AEO (Answer Engine Optimization) for product pages, plus dynamic sitemap generation.

### Changes Made

#### A. Dynamic Sitemap with Products

**File**: `apps/web/app/sitemap.ts`

**What it does:**
- Automatically includes ALL published products in the sitemap
- Updates product URLs whenever products are added/modified
- Provides Google with fresh product information

**Implementation:**
```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages (home, about, contact, etc.)
  const staticPages = [...]
  
  // Dynamically fetch all published products
  const { data: products } = await supabase
    .from('products')
    .select('product_id, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
  
  // Create sitemap entries for each product
  const productPages = products.map((product) => ({
    url: `${baseUrl}/products/${product.product_id}`,
    lastModified: new Date(product.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8, // High priority for product pages
  }))
  
  return [...staticPages, ...productPages]
}
```

**Benefits:**
- ✅ Google automatically discovers new products
- ✅ Product pages get indexed faster
- ✅ Better ranking in search results
- ✅ Shows when products were last updated

#### B. Enhanced Product Page Metadata

**File**: `apps/web/app/products/[slug]/layout.tsx`

**Added/Enhanced:**

1. **Google Site Verification** (if configured)
```typescript
verification: {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
}
```

2. **Product-Specific Meta Tags for AEO**
```typescript
other: {
  'product:name': productName,
  'product:category': category || '',
  'product:manufacturer': manufacturer || '',
  'product:country': originCountry || '',
  'product:form': form || '',
  'product:grade': grade || '',
  'product:cas_number': casNumber || '',
}
```

3. **Enhanced OpenGraph Tags**
```typescript
'og:type': 'product',
'og:product:availability': 'in stock',
'og:product:condition': 'new',
```

4. **Mobile & App Meta Tags**
```typescript
'application-name': 'Pitchivo',
'apple-mobile-web-app-title': 'Pitchivo',
'format-detection': 'telephone=no',
```

#### C. Existing SEO Features (Already Present)

Your product pages already had excellent SEO:

1. **Structured Data (JSON-LD)** - `ProductStructuredData.tsx`
   - Product schema
   - Breadcrumb schema
   - FAQ schema (for answer engines!)

2. **Comprehensive Metadata** - `layout.tsx`
   - SEO-optimized titles (max 60 chars)
   - Meta descriptions (150-160 chars)
   - Keywords from product data
   - OpenGraph tags for social sharing
   - Twitter cards
   - Canonical URLs

3. **Answer Engine Optimization (AEO)**
   - FAQ schema answers common questions like:
     - "What is [product]?"
     - "Where is [product] manufactured?"
     - "What is the CAS number?"
     - "What are the applications?"
     - "How to request a quote?"
     - "What is the price?"

### SEO Best Practices Already Implemented

#### ✅ Technical SEO
- Canonical URLs prevent duplicate content
- Proper heading hierarchy
- Mobile-friendly meta tags
- Structured data for rich snippets
- Dynamic sitemap with lastModified dates
- robots.txt properly configured

#### ✅ Content SEO
- Descriptive titles with product name + category + manufacturer
- Detailed meta descriptions with key information
- Keywords from product attributes
- Alt text for images (in structured data)
- FAQ schema answers user questions

#### ✅ Social SEO
- OpenGraph tags for Facebook/LinkedIn
- Twitter cards with large images
- Proper product images
- Manufacturer/brand information

#### ✅ AEO (Answer Engine Optimization)
- FAQ schema for voice search and AI assistants
- Clear, factual descriptions
- Structured product information
- Question-answer format for common queries

### How Google Will Index Your Products

1. **Sitemap Discovery**
   - Google reads `https://pitchivo.com/sitemap.xml`
   - Finds all product URLs automatically
   - Sees when each product was last updated

2. **Page Crawling**
   - Google crawls each product page
   - Reads metadata (title, description, keywords)
   - Parses structured data (JSON-LD schemas)

3. **Rich Results**
   - Product schema → Product rich results in search
   - FAQ schema → FAQ accordion in search results
   - Breadcrumb schema → Breadcrumb navigation in search

4. **Search Ranking Factors**
   - Relevant keywords (category, manufacturer, CAS number, etc.)
   - Quality content (descriptions, specifications)
   - Structured data validity
   - Mobile friendliness
   - Page speed
   - User engagement metrics

### Testing Your SEO

#### 1. **Test Sitemap**
```bash
curl https://pitchivo.com/sitemap.xml
```
Should show all static pages + all published products.

#### 2. **Test Structured Data**
- Visit: https://search.google.com/test/rich-results
- Enter a product URL: `https://pitchivo.com/products/[product-id]`
- Should show: Product, Breadcrumb, and FAQ schemas

#### 3. **Test OpenGraph**
- Visit: https://www.opengraph.xyz/
- Enter product URL
- Should show product title, description, and image

#### 4. **Submit to Google Search Console**
- Go to: https://search.google.com/search-console
- Add your property: `pitchivo.com`
- Submit sitemap: `https://pitchivo.com/sitemap.xml`
- Google will start indexing your products

#### 5. **Monitor Indexing**
In Google Search Console:
- Check "Coverage" report - shows indexed pages
- Check "Sitemaps" report - shows sitemap status
- Check "Enhancements" → "Products" - shows product rich results

### Expected Results

#### Short Term (1-2 weeks)
- Products appear in sitemap
- Google starts crawling product pages
- Basic search results for brand/product names

#### Medium Term (1-2 months)
- Product pages indexed
- Rich results (product cards) appear in search
- FAQ snippets show in search results
- Ranking for specific product names + attributes

#### Long Term (3-6 months)
- Ranking for category searches
- Ranking for "best X supplier" queries
- Featured snippets from FAQ schema
- High visibility for branded + category keywords

### SEO Checklist

- ✅ Dynamic sitemap includes all products
- ✅ Product pages have comprehensive metadata
- ✅ Structured data (Product, Breadcrumb, FAQ) implemented
- ✅ robots.txt allows indexing
- ✅ Canonical URLs set correctly
- ✅ Mobile-friendly meta tags
- ✅ OpenGraph tags for social sharing
- ✅ Twitter cards configured
- ✅ AEO optimization with FAQ schema
- ⬜ Submit sitemap to Google Search Console (manual step)
- ⬜ Add Google Site Verification (optional, set env var)
- ⬜ Monitor indexing status
- ⬜ Track search performance

---

## 🚀 Next Steps

### For Brevo Webhook Logging
1. **Monitor logs** in Vercel dashboard after deploying
2. **Send a test email** through a campaign
3. **Check webhook logs** to see event processing
4. **Verify metrics update** in campaign dashboard

### For Product SEO
1. **Deploy these changes** to production
2. **Submit sitemap** to Google Search Console:
   - Visit: https://search.google.com/search-console
   - Add property: `pitchivo.com`
   - Submit sitemap URL: `https://pitchivo.com/sitemap.xml`
3. **Test structured data**:
   - Visit: https://search.google.com/test/rich-results
   - Test a product URL
4. **Request indexing** for important product pages in Search Console
5. **Monitor performance** over next few weeks

### Optional Enhancements
1. **Add Google Site Verification** (for Search Console):
   ```bash
   # In .env.local
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code_here
   ```

2. **Add Google Analytics 4** for tracking:
   - Track product page views
   - Track RFQ conversions
   - Monitor search traffic

3. **Set up Bing Webmaster Tools**:
   - Submit sitemap to Bing too
   - Reach more search engines

4. **Monitor with Lighthouse**:
   - Run Lighthouse audits on product pages
   - Check SEO score (should be 90+)
   - Optimize based on recommendations

---

## 📊 What to Expect

### Webhook Logs Sample
When a webhook event arrives, you'll see logs like:

```
============================================
🔔 BREVO WEBHOOK RECEIVED
Timestamp: 2025-11-18T10:30:45.123Z
Headers: {
  'content-type': 'application/json',
  'user-agent': 'Brevo-Webhooks',
  'authorization': 'Bearer [PRESENT]'
}
📦 Raw payload: {
  "event": "opened",
  "email": "buyer@example.com",
  "tag": "campaign_123e4567-e89b-12d3-a456-426614174000",
  ...
}
📊 Processing 1 event(s)

--- Processing Event 1/1 ---
📧 Event Type: opened
👤 Recipient: buyer@example.com
📬 Message ID: <abc123@brevo.com>
📅 Date: 2025-11-18T10:30:00.000Z
🔄 Normalized event: opened
✅ Mapped to our event type: email_opened
🏷️  All tags: ["campaign_123e4567-e89b-12d3-a456-426614174000"]
🎯 Campaign ID: 123e4567-e89b-12d3-a456-426614174000
📝 Activity type: email_opened
💾 Inserting activity record into database...
✅ Activity record created successfully
📊 Updating campaign metrics...
📈 Incrementing metric: emails_opened
✅ Metric emails_opened incremented successfully
🔧 Handling special events...
✅ Event processed successfully
Result: ✅ SUCCESS {
  success: true,
  campaignId: "123e4567-e89b-12d3-a456-426614174000",
  eventType: "email_opened",
  email: "buyer@example.com",
  activityType: "email_opened"
}

⏱️ Total processing time: 234ms
✅ WEBHOOK PROCESSING COMPLETE
============================================
```

### Sitemap Sample
When Google requests your sitemap (`/sitemap.xml`), it will see:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url>
    <loc>https://pitchivo.com</loc>
    <lastmod>2025-11-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Product pages (dynamically generated) -->
  <url>
    <loc>https://pitchivo.com/products/abc123...</loc>
    <lastmod>2025-11-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://pitchivo.com/products/def456...</loc>
    <lastmod>2025-11-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... more products ... -->
</urlset>
```

---

## 🎉 Summary

### Webhook Enhancements
- ✅ Comprehensive logging at every step
- ✅ Clear emoji indicators for quick scanning
- ✅ Detailed error messages for debugging
- ✅ Performance timing information
- ✅ Special handling for critical events

### SEO Enhancements
- ✅ Dynamic sitemap with all published products
- ✅ Enhanced metadata for better indexing
- ✅ Product-specific meta tags for AEO
- ✅ OpenGraph enhancements for social sharing
- ✅ Mobile & app meta tags
- ✅ Google Site Verification support

Your product pages now have **enterprise-level SEO** and will be **highly discoverable** by Google and other search engines! 🚀

