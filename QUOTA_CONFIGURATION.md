# Quota Configuration Guide

## 📍 Single Source of Truth

**All tier quotas are configured in ONE place:**

```
apps/web/lib/constants/pricing.ts
```

## 🎯 How to Adjust Quotas

### 1. Frontend/Application Quotas (JavaScript/TypeScript)

Edit the `PRICING_TIERS` object in `apps/web/lib/constants/pricing.ts`:

```typescript
export const PRICING_TIERS = {
  free: {
    features: {
      emailQuota: 30,              // ← Change this
      qrLinksPerProduct: 3,        // ← Change this
      // ... other features
    }
  },
  basic: {
    features: {
      emailQuota: 400,             // ← Change this
      qrLinksPerProduct: 10,       // ← Change this
      // ... other features
    }
  },
  premium: {
    features: {
      emailQuota: 2000,            // ← Change this
      qrLinksPerProduct: 999999,   // ← Unlimited (don't change)
      // ... other features
    }
  },
  enterprise: {
    features: {
      emailQuota: 999999,          // ← Unlimited (don't change)
      qrLinksPerProduct: 999999,   // ← Unlimited (don't change)
      // ... other features
    }
  }
}
```

### 2. Database Default Values (PostgreSQL)

If you need to update defaults for **new** subscriptions, also update the database function in:

```
supabase/migrations/20240101000051_create_subscriptions.sql
```

Look for the `get_tier_quotas()` function:

```sql
CREATE OR REPLACE FUNCTION get_tier_quotas(tier_name subscription_tier)
RETURNS TABLE(email_quota INTEGER, qr_links_per_product INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE tier_name
      WHEN 'free' THEN 30          -- ← Change this
      WHEN 'basic' THEN 400         -- ← Change this
      WHEN 'premium' THEN 2000      -- ← Change this
      WHEN 'enterprise' THEN 999999 -- ← Unlimited
    END AS email_quota,
    -- ... etc
END;
$$ LANGUAGE plpgsql;
```

⚠️ **Important:** Changing the migration file only affects **new** subscriptions. Existing subscriptions in the database won't be updated automatically.

### 3. Minimum Campaign Size

The minimum number of emails for a campaign is also configurable in `pricing.ts`:

```typescript
export const CAMPAIGN_MIN_EMAILS = 5                    // Absolute minimum
export const CAMPAIGN_MIN_EMAILS_RECOMMENDED = 50       // Recommended minimum
```

## 🔄 What Gets Updated Automatically

When you change `PRICING_TIERS` in `pricing.ts`, these will automatically use the new values:

✅ **Campaign creation page** - Email count limits and validation
✅ **Quota status displays** - Usage bars and remaining counts  
✅ **Upgrade prompts** - Tier comparison modals
✅ **Pricing page** - Feature comparison table
✅ **Default fallbacks** - Error handling and loading states
✅ **Quota utility functions** - All quota checks and validations

## 📊 Example: Increasing Free Tier to 50 Emails

1. **Edit** `apps/web/lib/constants/pricing.ts`:
   ```typescript
   free: {
     features: {
       emailQuota: 50,  // Changed from 30
       // ...
     }
   }
   ```

2. **Update pricing page display** (automatically updated in `FEATURE_COMPARISON` array):
   ```typescript
   {
     name: 'Email Quota (monthly)',
     free: '50',  // Update this to match
     // ...
   }
   ```

3. **Done!** The change will apply across:
   - Campaign setup validations
   - Quota bars and displays
   - Upgrade prompts
   - All quota checks

## 🔧 Files That Reference Quota Config

These files import from `pricing.ts` and will automatically use updated values:

- `apps/web/app/dashboard/campaigns/create/config/page.tsx` - Campaign setup
- `apps/web/lib/utils/quotas.ts` - Quota checking utilities
- `apps/web/lib/hooks/use-subscription.ts` - Subscription hook
- `apps/web/components/ui/quota-bar.tsx` - Quota visualizations
- `apps/web/components/ui/upgrade-prompt.tsx` - Upgrade modals
- `apps/web/app/dashboard/pricing/page.tsx` - Pricing page

## 💾 Updating Existing Subscriptions

If you change quotas and want to update **existing** subscriptions in the database, you need to run a migration:

```sql
-- Example: Update all free tier subscriptions to new quota
UPDATE subscriptions 
SET email_quota = 50,
    custom_quota_override = FALSE
WHERE tier = 'free' 
  AND custom_quota_override = FALSE;
```

⚠️ **Only update subscriptions where `custom_quota_override = FALSE`** to avoid overwriting admin-customized quotas.

## 🎨 UNLIMITED Value

The value `999999` represents "unlimited". This is used by the `isUnlimited()` helper function:

```typescript
export function isUnlimited(value: number): boolean {
  return value >= 999999
}
```

Don't change this value for premium/enterprise tiers unless you want to set an actual limit.

## 📝 Quick Reference

| Tier       | Email Quota | QR Links | Price/mo |
|------------|-------------|----------|----------|
| Free       | 30          | 3        | $0       |
| Basic      | 400         | 10       | $499     |
| Premium    | 2,000       | Unlimited| $1,999   |
| Enterprise | Unlimited   | Unlimited| Custom   |

---

**Remember:** Change values in `pricing.ts` → Everything updates automatically! 🚀

