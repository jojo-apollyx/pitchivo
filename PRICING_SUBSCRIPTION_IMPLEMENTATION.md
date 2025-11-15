# Pricing & Subscription System Implementation Guide

## 🎯 Overview

Complete pricing and subscription system with Stripe integration, quota management, feature gates, and admin controls.

## 💰 Pricing Tiers

| Tier | Monthly Price | Product Listing | Email Quota | QR / Custom Links | Notes |
|------|---------------|-----------------|-------------|-------------------|-------|
| **Free** | $0 | Unlimited | 30 / month | 3 each | For early users; exposed to AI & browseable |
| **Basic** | $499 | Unlimited | 400 / month | 10 each | For small exporters & startups |
| **Premium** | $1,999 | Unlimited | 2,000 / month | Unlimited | For established exporters & marketing teams |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Custom API access, dataset integration, SLA |

## 📁 Files Created

### 1. Database Schema ✅
**File**: `supabase/migrations/20240101000051_create_subscriptions.sql`

**Tables Created**:
- `subscriptions` - Organization subscription details
- `quota_usage` - Track usage per billing period
- `product_links` - Track QR/custom links per product

**Functions Created**:
- `get_tier_quotas(tier)` - Get quota limits for tier
- `initialize_subscription()` - Auto-create free subscription
- `get_current_quota_usage(org_id)` - Get current usage stats

**Trigger**: Auto-create free subscription when organization is created

### 2. Pricing Configuration ✅
**File**: `apps/web/lib/constants/pricing.ts`

**Exports**:
- `PRICING_TIERS` - Complete tier configuration
- `FEATURE_COMPARISON` - Feature matrix for pricing page
- `getTierConfig()` - Get tier details
- `hasFeature()` - Check feature availability
- `formatPrice()` - Format currency
- `formatQuota()` - Format quota display

## 🚀 Implementation Roadmap

### Phase 1: Core Infrastructure (Next Steps)

#### 1. Quota Utilities
**File**: `apps/web/lib/utils/quotas.ts`

```typescript
export async function checkEmailQuota(orgId: string, count: number): Promise<boolean>
export async function incrementEmailUsage(orgId: string, count: number): Promise<void>
export async function checkQRLinksQuota(productId: string): Promise<boolean>
export async function getQuotaStatus(orgId: string): Promise<QuotaStatus>
```

#### 2. Feature Gates Hook
**File**: `apps/web/lib/hooks/use-subscription.ts`

```typescript
export function useSubscription() {
  return {
    tier: 'free' | 'basic' | 'premium' | 'enterprise',
    status: 'active' | 'past_due' | 'canceled',
    canSendEmails: (count: number) => boolean,
    canAddQRLink: (productId: string) => boolean,
    hasFeature: (feature: string) => boolean,
    quotaUsage: QuotaStatus,
    subscription: Subscription
  }
}
```

#### 3. Pricing Page
**File**: `apps/web/app/dashboard/pricing/page.tsx`

**Features**:
- Tier comparison cards
- Feature matrix table
- Current plan indicator
- Upgrade/downgrade buttons
- Contact sales for enterprise

#### 4. Billing Management Page
**File**: `apps/web/app/dashboard/billing/page.tsx`

**Features**:
- Current subscription details
- Usage statistics with progress bars
- Payment method management
- Invoices history
- Cancel subscription

### Phase 2: Stripe Integration

#### 5. Stripe Checkout API
**File**: `apps/web/app/api/stripe/create-checkout/route.ts`

```typescript
POST /api/stripe/create-checkout
Body: { priceId: string, tier: string }
Response: { sessionId: string, url: string }
```

#### 6. Stripe Customer Portal
**File**: `apps/web/app/api/stripe/create-portal/route.ts`

```typescript
POST /api/stripe/create-portal
Response: { url: string }
```

#### 7. Stripe Webhook Handler
**File**: `apps/web/app/api/webhooks/stripe/route.ts`

**Handled Events**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

### Phase 3: Quota Enforcement

#### 8. Campaign Email Quota Check
**Update**: `apps/web/app/dashboard/campaigns/create/config/page.tsx`

```typescript
// Before allowing email count selection
const { canSendEmails, quotaUsage } = useSubscription()

if (!canSendEmails(emailCount)) {
  showUpgradePrompt()
}
```

#### 9. QR Link Quota Check
**Update**: Product creation/edit pages

```typescript
// Before adding QR/custom link
const { canAddQRLink } = useSubscription()

if (!canAddQRLink(productId)) {
  showUpgradePrompt()
}
```

### Phase 4: Admin Controls

#### 10. Admin Subscription Management
**File**: `apps/web/app/admin/subscriptions/page.tsx`

**Features**:
- View all subscriptions
- Filter by tier/status
- Override quota limits
- Manual tier changes
- Subscription statistics

#### 11. Admin Override API
**File**: `apps/web/app/api/admin/subscriptions/override/route.ts`

```typescript
POST /api/admin/subscriptions/override
Body: {
  orgId: string,
  emailQuota: number,
  qrLinksPerProduct: number
}
```

## 🔧 Stripe Setup Instructions

### 1. Create Products in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. Create products:

**Basic Plan**:
- Name: "Pitchivo Basic"
- Description: "For small exporters & startups"
- Price: $499/month
- Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_BASIC`

**Premium Plan**:
- Name: "Pitchivo Premium"
- Description: "For established exporters & marketing teams"
- Price: $1,999/month
- Copy Price ID → `NEXT_PUBLIC_STRIPE_PRICE_PREMIUM`

### 2. Get API Keys

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

### 3. Set up Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook signing secret → `STRIPE_WEBHOOK_SECRET`

### 4. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_BASIC=price_...
NEXT_PUBLIC_STRIPE_PRICE_PREMIUM=price_...
```

## 📊 Database Schema Details

### subscriptions Table

```sql
CREATE TABLE subscriptions (
  subscription_id UUID PRIMARY KEY,
  org_id UUID UNIQUE REFERENCES organizations(id),
  
  -- Stripe
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  
  -- Subscription
  tier subscription_tier DEFAULT 'free',
  status subscription_status DEFAULT 'active',
  
  -- Billing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Quotas (with admin override capability)
  email_quota INTEGER DEFAULT 30,
  qr_links_per_product INTEGER DEFAULT 3,
  custom_quota_override BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### quota_usage Table

```sql
CREATE TABLE quota_usage (
  usage_id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  
  -- Period
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  
  -- Usage
  emails_sent INTEGER DEFAULT 0,
  
  UNIQUE(org_id, period_start, period_end)
);
```

### product_links Table

```sql
CREATE TABLE product_links (
  link_id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(product_id),
  org_id UUID REFERENCES organizations(id),
  
  link_type TEXT CHECK (link_type IN ('qr', 'custom')),
  link_url TEXT NOT NULL,
  link_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🎨 UI Components Needed

### 1. Pricing Tier Card
```tsx
<PricingCard
  tier="premium"
  current={currentTier === 'premium'}
  onSubscribe={() => handleSubscribe('premium')}
/>
```

### 2. Quota Usage Bar
```tsx
<QuotaBar
  used={245}
  total={2000}
  label="Email Quota"
  type="emails"
/>
```

### 3. Upgrade Prompt Modal
```tsx
<UpgradeModal
  feature="Send more than 30 emails"
  recommendedTier="basic"
  onUpgrade={() => navigate('/dashboard/pricing')}
/>
```

### 4. Feature Gate Wrapper
```tsx
<FeatureGate feature="unlimited_qr_links" fallback={<UpgradePrompt />}>
  <AddQRLinkButton />
</FeatureGate>
```

## 🔒 Feature Gates Implementation

### Campaign Creation
```typescript
// Step 3: Configure Sending
const { canSendEmails, quotaUsage } = useSubscription()

// Validate email count
if (emailCount > quotaUsage.emailsRemaining) {
  return (
    <UpgradePrompt
      message={`You need ${emailCount} emails but only have ${quotaUsage.emailsRemaining} remaining`}
      recommendedTier="basic"
    />
  )
}
```

### Product Links
```typescript
// Before adding QR/custom link
const { canAddQRLink } = useSubscription()
const linkCount = await getProductLinkCount(productId)

if (linkCount >= subscription.qr_links_per_product) {
  return (
    <UpgradePrompt
      message="You've reached your QR/custom link limit"
      recommendedTier="premium"
    />
  )
}
```

## 🔄 Upgrade/Downgrade Flow

### Upgrade Flow
```
User clicks "Upgrade" on pricing page
       ↓
Create Stripe Checkout Session
       ↓
Redirect to Stripe hosted checkout
       ↓
User completes payment
       ↓
Stripe webhook → Update subscription
       ↓
Redirect back to app
       ↓
Show success message
```

### Downgrade Flow
```
User clicks "Downgrade" or "Cancel"
       ↓
Confirm modal with impact explanation
       ↓
Set cancel_at_period_end = true
       ↓
Continue service until period ends
       ↓
At period end: Downgrade to free
```

## 👨‍💼 Admin Controls

### Subscription Override

```tsx
// Admin can override any subscription
<AdminOverrideForm
  orgId={selectedOrg.id}
  currentQuotas={{
    emailQuota: 400,
    qrLinksPerProduct: 10
  }}
  onSave={(newQuotas) => {
    // Update subscription with custom quotas
    updateSubscription(orgId, {
      ...newQuotas,
      custom_quota_override: true
    })
  }}
/>
```

### Subscription Statistics

```tsx
<AdminStats>
  <StatCard
    label="Active Subscriptions"
    value={totalActive}
    breakdown={{
      free: 150,
      basic: 45,
      premium: 12,
      enterprise: 3
    }}
  />
  <StatCard
    label="Monthly Recurring Revenue"
    value="$47,363"
    trend="+12%"
  />
</AdminStats>
```

## 📈 Quota Tracking

### Real-time Usage Updates

```typescript
// When sending campaign email
await incrementEmailUsage(orgId, emailCount)

// Check before sending
const canSend = await checkEmailQuota(orgId, emailCount)
if (!canSend) {
  throw new Error('Email quota exceeded')
}

// Get current status
const status = await getQuotaStatus(orgId)
// {
//   emailsSent: 245,
//   emailQuota: 400,
//   emailsRemaining: 155,
//   qrLinksCount: 23,
//   qrLinksQuota: 999999
// }
```

### Quota Reset

Quotas reset automatically at the start of each billing period based on `current_period_start` and `current_period_end`.

## 🚨 Error Handling

### Quota Exceeded
```typescript
if (quotaExceeded) {
  return {
    error: 'QUOTA_EXCEEDED',
    message: 'You have exceeded your monthly email quota',
    current: 400,
    requested: 500,
    upgradeUrl: '/dashboard/pricing'
  }
}
```

### Payment Failed
```typescript
// Stripe webhook: invoice.payment_failed
await updateSubscription(orgId, {
  status: 'past_due'
})

await sendEmail({
  to: orgEmail,
  subject: 'Payment Failed',
  template: 'payment_failed'
})
```

## ✅ Implementation Checklist

- [x] Database schema for subscriptions
- [x] Pricing configuration
- [ ] Quota utilities
- [ ] Subscription hook
- [ ] Pricing page UI
- [ ] Billing management page
- [ ] Stripe checkout API
- [ ] Stripe webhook handler
- [ ] Campaign quota enforcement
- [ ] Product link quota enforcement
- [ ] Admin subscription management
- [ ] Admin quota override
- [ ] Upgrade/downgrade flows
- [ ] Feature gate components
- [ ] Usage tracking
- [ ] Email notifications

## 📚 Next Steps

1. **Install Stripe SDK**:
   ```bash
   npm install stripe @stripe/stripe-js
   ```

2. **Create remaining files** following the roadmap

3. **Set up Stripe products** and get price IDs

4. **Configure webhooks** in Stripe dashboard

5. **Test subscription flows**:
   - Free → Basic upgrade
   - Basic → Premium upgrade
   - Premium → Basic downgrade
   - Cancel subscription

6. **Test quota enforcement**:
   - Email sending limits
   - QR link creation limits
   - Admin overrides

7. **Deploy and monitor**:
   - Set up Stripe production keys
   - Monitor webhook delivery
   - Track subscription metrics

The foundation is ready! Continue implementation following this guide.

