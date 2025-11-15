# Email Placeholder System Documentation

## Overview

The admin campaign email editor now supports dynamic placeholders that are automatically replaced with actual values when emails are sent.

## Available Placeholders

### 1. `{{product_link}}`
**Description:** Full URL to the product page  
**Example Output:** `https://pitchivo.com/products/abc123-uuid`  
**Use Case:** Include a direct link for buyers to view the product

```
Check out our product here: {{product_link}}
```

### 2. `{{product_name}}`
**Description:** Name of the product in the campaign  
**Example Output:** `Premium Collagen Peptides`  
**Use Case:** Reference the product by name in the email

```
We're excited to introduce {{product_name}} to the market.
```

### 3. `{{buyer_name}}`
**Description:** Extracted from recipient's email domain  
**Example Output:** `Vitalproteins` (from buyer@vitalproteins.com)  
**Use Case:** Personalize the email with the buyer's company name

```
Hi {{buyer_name}},

We noticed your company sources premium ingredients...
```

### 4. `{{org_name}}`
**Description:** Sender's organization name  
**Example Output:** `ABC Ingredients Ltd`  
**Use Case:** Sign off with your company name

```
Best regards,
The {{org_name}} Team
```

## Usage in Email Editor

### Visual Guide

The email editor includes a highlighted instruction box showing all available placeholders:

```
📝 Available Placeholders:

{{product_link}}  → Full URL to product page
{{product_name}}  → Product name
{{buyer_name}}    → Buyer company name
{{org_name}}      → Your organization name

Placeholders will be automatically replaced when email is sent.
```

### Example Email Template

**Subject:**
```
Introducing {{product_name}} - Premium Quality for {{buyer_name}}
```

**Content:**
```
Hi {{buyer_name}},

I noticed your company sources ingredients for health and wellness 
products. We've recently launched {{product_name}}, which might be 
perfect for your formulations.

Key Benefits:
• Premium quality and purity
• Full documentation available
• Competitive pricing

View full details and specifications:
{{product_link}}

Feel free to reach out if you have any questions.

Best regards,
The {{org_name}} Team
```

### Processed Output Example

When sent to `buyer@vitalproteins.com` for a collagen product campaign:

**Subject:**
```
Introducing Premium Collagen Peptides - Premium Quality for Vitalproteins
```

**Content:**
```
Hi Vitalproteins,

I noticed your company sources ingredients for health and wellness 
products. We've recently launched Premium Collagen Peptides, which 
might be perfect for your formulations.

Key Benefits:
• Premium quality and purity
• Full documentation available
• Competitive pricing

View full details and specifications:
https://pitchivo.com/products/abc123-def456-uuid

Feel free to reach out if you have any questions.

Best regards,
The ABC Ingredients Ltd Team
```

## Implementation Details

### Frontend (Admin Page)

**File:** `apps/web/app/admin/campaigns/page.tsx`

- Email editor includes placeholder instructions
- Visual guide with syntax highlighting
- Example usage in placeholder text
- Clear indication that replacement is automatic

### Backend (API)

**File:** `apps/web/app/api/admin/campaigns/send/route.ts`

#### Placeholder Resolution Process:

1. **Fetch Campaign Data**
   ```typescript
   const { data: campaign } = await supabaseAdmin
     .from('campaigns')
     .select(`
       *,
       products (
         product_id,
         product_name,
         org_id,
         organizations (
           name,
           slug
         )
       )
     `)
     .eq('campaign_id', campaignId)
     .single()
   ```

2. **Build Placeholder Map**
   ```typescript
   const placeholders = {
     '{{product_link}}': `${APP_URL}/products/${product.product_id}`,
     '{{product_name}}': campaign.products?.product_name,
     '{{buyer_name}}': extractCompanyFromEmail(to),
     '{{org_name}}': campaign.products?.organizations?.name
   }
   ```

3. **Replace Placeholders**
   - Replaces in both subject and content
   - Uses regex for accurate matching
   - Handles multiple occurrences
   - Escapes special characters in placeholder syntax

4. **Send Processed Email**
   - HTML email with replaced values
   - Links are clickable with proper styling
   - Plain text fallback included

## Advanced Features

### Case-Insensitive Matching
Placeholders work regardless of case:
- `{{product_link}}` ✅
- `{{PRODUCT_LINK}}` ✅
- `{{Product_Link}}` ✅

### Multiple Occurrences
You can use the same placeholder multiple times:
```
Check out {{product_name}}!

{{product_name}} is perfect for your needs.

Learn more: {{product_link}}
Or visit: {{product_link}}
```

### Subject Line Support
Placeholders work in subject lines too:
```
Subject: {{org_name}} Introduces {{product_name}}
```

### Buyer Name Extraction
The `{{buyer_name}}` is intelligently extracted:
- `buyer@vitalproteins.com` → `Vitalproteins`
- `john@nestlehealthscience.com` → `Nestlehealthscience`
- `contact@gnc.com` → `Gnc`
- Falls back to "Valued Partner" if extraction fails

## Error Handling

### Missing Campaign Data
If campaign or product data is not found:
- Returns 404 error
- Does not send email
- Provides clear error message

### Empty Placeholders
If a placeholder value is not available:
- `{{product_link}}`: Empty string
- `{{product_name}}`: "Our Product"
- `{{buyer_name}}`: "Valued Partner"
- `{{org_name}}`: "Pitchivo"

### Malformed Placeholders
Invalid syntax is left unchanged:
- `{product_link}` (single braces) → Not replaced
- `{{product link}}` (space) → Not replaced
- `{{productlink}}` (no underscore) → Not replaced

## Security Considerations

### XSS Prevention
- Email content is escaped in HTML template
- Links are validated
- No user input in HTML attributes

### SQL Injection Prevention
- Uses parameterized queries
- Supabase handles escaping
- No raw SQL concatenation

### Rate Limiting
Consider implementing:
- Max emails per admin per minute
- Max emails per campaign per hour
- Total daily send limit

## Testing Examples

### Test 1: Basic Replacement
**Input:**
```
Subject: Hello {{buyer_name}}
Content: Visit {{product_link}}
```

**Expected Output:**
```
Subject: Hello Vitalproteins
Content: Visit https://pitchivo.com/products/abc123
```

### Test 2: Multiple Placeholders
**Input:**
```
{{org_name}} presents {{product_name}} for {{buyer_name}}
```

**Expected Output:**
```
ABC Ingredients Ltd presents Premium Collagen Peptides for Vitalproteins
```

### Test 3: Clickable Links
**Input:**
```
<a href="{{product_link}}">View Product</a>
```

**Expected Output:**
```
<a href="https://pitchivo.com/products/abc123">View Product</a>
```

## Best Practices

### ✅ Do:
- Use placeholders for personalization
- Test with real recipient emails first
- Include clear call-to-action with `{{product_link}}`
- Use `{{buyer_name}}` in greeting
- Keep subject line concise even with placeholders

### ❌ Don't:
- Don't use placeholders in tracking pixels
- Don't nest placeholders: `{{{{product_name}}}}`
- Don't rely solely on placeholders for critical info
- Don't use placeholders in unsubscribe links

## Future Enhancements

Potential additions:
- `{{first_name}}` - Contact's first name
- `{{last_name}}` - Contact's last name
- `{{company}}` - Full company name
- `{{country}}` - Buyer's country
- `{{industry}}` - Buyer's industry
- `{{custom_field_1}}` - User-defined fields
- Conditional blocks: `{{#if premium}}...{{/if}}`
- Date formatting: `{{today:format}}`

## Summary

The placeholder system provides:
- ✅ 4 dynamic placeholders
- ✅ Visual editor guide
- ✅ Automatic replacement
- ✅ Subject line support
- ✅ Multiple occurrence handling
- ✅ Intelligent buyer name extraction
- ✅ Fallback values
- ✅ Security considerations

Admin users can now create personalized, dynamic campaign emails with minimal effort!

