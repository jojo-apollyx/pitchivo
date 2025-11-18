# Pricing & Subscription Implementation Gap Summary

## 📊 Current Status

**Foundation**: ✅ Database schema and pricing constants exist  
**Core Functionality**: ❌ Quota enforcement, Stripe integration, and UI components missing  
**Completion**: ~12% (2/16 items from implementation guide)

---

## 🎯 What Needs to Be Done

### Phase 1: Core Infrastructure (Required First)

#### 1. Create Quota Utilities
**File**: `apps/web/lib/utils/quotas.ts` (NEW)

**Functions needed**:
- `checkEmailQuota(orgId, count)` - Check if org can send N emails
- `incrementEmailUsage(orgId, count)` - Track email usage
- `checkQRLinksQuota(productId)` - Check if product can add more links
- `getQuotaStatus(orgId)` - Get current usage vs limits

**Why**: All quota checks depend on this.

---

#### 2. Create Subscription Hook
**File**: `apps/web/lib/hooks/use-subscription.ts` (NEW)

**Returns**:
- `tier` - Current subscription tier
- `status` - Subscription status
- `canSendEmails(count)` - Check if can send N emails
- `canAddQRLink(productId)` - Check if can add QR link
- `quotaUsage` - Current usage stats
- `subscription` - Full subscription object

**Why**: Components need easy access to subscription data.

---

### Phase 2: UI Updates

#### 3. Campaign Config Page - Quota Integration
**File**: `apps/web/app/dashboard/campaigns/create/config/page.tsx`

**Current Issue**: Line 93 has `const planQuota = 2000` (hardcoded)

**Changes needed**:
- Replace hardcoded quota with `useSubscription()` hook
- Fetch actual subscription quota from database
- Display current usage vs quota
- Show upgrade prompt if quota exceeded
- Disable "Next" button if quota insufficient
- Show remaining quota in real-time

**UI Updates**:
- Replace "Remaining: X emails" with actual remaining quota
- Add quota progress bar showing usage
- Add upgrade button/link when quota low
- Show tier badge (Free/Basic/Premium)

---

#### 4. Campaign Review/Launch Page - Quota Validation
**File**: `apps/web/app/dashboard/campaigns/create/review/page.tsx`

**Current Issue**: No quota check before launch

**Changes needed**:
- Add quota check in `handleLaunch()` function
- Show error/upgrade prompt if quota exceeded
- Display quota status in review summary
- Prevent launch if insufficient quota

**UI Updates**:
- Add quota status section showing:
  - Current usage
  - Remaining quota
  - Warning if insufficient
- Add upgrade CTA if quota exceeded
- Disable launch button if quota insufficient

---

#### 5. Create Pricing Page
**File**: `apps/web/app/dashboard/pricing/page.tsx` (NEW)

**Features needed**:
- Tier comparison cards (Free, Basic, Premium, Enterprise)
- Feature matrix table
- Current plan indicator
- "Upgrade" buttons for each tier
- "Contact Sales" for Enterprise
- Integration with Stripe checkout

**UI Components**:
- Pricing cards with tier details
- Feature comparison table
- Current plan badge
- Upgrade buttons
- Stripe checkout redirect

---

#### 6. Update Billing Page
**File**: `apps/web/app/dashboard/billing/page.tsx`

**Current Issue**: Hardcoded "Basic Plan", no real data

**Changes needed**:
- Fetch actual subscription from database
- Display real subscription tier and status
- Show usage statistics with progress bars:
  - Email quota usage (X / Y emails)
  - QR links usage (if applicable)
- Payment method management section
- Invoice history (if Stripe integrated)
- Cancel subscription option
- Upgrade/downgrade buttons

**UI Updates**:
- Replace hardcoded plan with real subscription data
- Add quota usage progress bars
- Add usage statistics cards
- Add payment method section
- Add invoice list (when available)
- Add cancel/upgrade buttons

---

#### 7. Product Links - Quota Check
**Files**:
- `apps/web/components/products/SharingLinksPanel.tsx`
- `apps/web/app/api/products/tokens/generate/route.ts`

**Changes needed**:
- Check current link count for product
- Check subscription limit before generating
- Show upgrade prompt if limit reached
- Track link creation in `product_links` table

**UI Updates**:
- Show current link count (X / Y links)
- Disable "Generate" button if limit reached
- Show upgrade prompt modal
- Display quota status in links panel

---

#### 8. Landing Page - Pricing Section Update
**File**: `apps/web/app/page.tsx` (Lines 1094-1204)

**Current Issue**: Hardcoded pricing that doesn't match actual tiers

**Current (WRONG)**:
- Free Trial: $0, 1 product page, 50 emails
- Basic: $299, 5 product pages, 500 emails
- Pro: $999, 20 product pages, 2,000 emails
- Enterprise: Custom

**Should be** (from `PRICING_TIERS`):
- Free: $0, Unlimited products, 30 emails/month, 3 QR links
- Basic: $499, Unlimited products, 400 emails/month, 10 QR links
- Premium: $1,999, Unlimited products, 2,000 emails/month, Unlimited QR links
- Enterprise: Custom, Unlimited everything

**Changes needed**:
- Import `PRICING_TIERS` from `@/lib/constants/pricing`
- Replace hardcoded pricing array with actual tier data
- Update feature lists to match actual tier features
- Add "Upgrade" button functionality (redirect to `/dashboard/pricing` or Stripe checkout)
- Update pricing display to use `formatPrice()` helper

**UI Updates**:
- Use real pricing data from constants
- Show correct features per tier
- Add functional upgrade buttons
- Link to dashboard pricing page or Stripe checkout

---

#### 9. Dashboard Home Page - Subscription Display
**File**: `apps/web/app/dashboard/page.tsx` (Line 118)

**Current Issue**: Hardcoded "Basic" subscription

**Changes needed**:
- Fetch actual subscription from database
- Display real subscription tier
- Show subscription status
- Add link to billing/pricing page
- Display quota usage if available

**UI Updates**:
- Replace hardcoded "Basic" with real tier name
- Show subscription status badge
- Add clickable link to billing page
- Show quota usage (if quota utilities exist)

---

#### 10. FAQ Page - Pricing Information Update
**File**: `apps/web/app/faq/page.tsx` (Line 42)

**Current Issue**: Outdated pricing information

**Current Text**:
> "Pitchivo offers a free trial with 1 product page and 50 cold emails. Paid plans start at $299/month for Basic (5 product pages, 500 emails), $999/month for Pro (20 pages, 2,000 emails), and custom pricing for Enterprise."

**Should be**:
> "Pitchivo offers a free plan with unlimited product listings and 30 emails per month. Paid plans start at $499/month for Basic (400 emails/month, 10 QR links per product), $1,999/month for Premium (2,000 emails/month, unlimited QR links), and custom pricing for Enterprise with unlimited emails and features."

**Changes needed**:
- Update FAQ answer text
- Update structured data (JSON-LD) for SEO
- Ensure consistency with actual pricing tiers

---

### Phase 3: Backend Quota Enforcement

#### 8. Email Sending - Usage Tracking
**Files**:
- `apps/web/app/api/admin/campaigns/send/route.ts`
- `apps/web/app/api/admin/campaigns/schedule/route.ts`
- `supabase/functions/send-scheduled-emails/index.ts`

**Changes needed**:
- Check quota before sending emails
- Call `incrementEmailUsage()` after successful send
- Return error if quota exceeded
- Track usage in `quota_usage` table

**Implementation**:
- Add quota check at start of send function
- Increment usage after each email sent
- Handle quota exceeded errors gracefully

---

#### 9. Campaign Launch - Quota Validation
**File**: `apps/web/app/dashboard/campaigns/create/review/page.tsx`

**Changes needed**:
- Validate quota before creating campaign record
- Check remaining quota vs email count
- Return error if insufficient quota
- Show user-friendly error message

---

### Phase 4: Stripe Integration

#### 10. Stripe Checkout API
**File**: `apps/web/app/api/stripe/create-checkout/route.ts` (NEW)

**Functionality**:
- Create Stripe checkout session
- Handle tier selection (Basic/Premium)
- Redirect to Stripe hosted checkout
- Return session URL to frontend

**Integration**:
- Use Stripe SDK
- Create checkout session with price ID
- Set success/cancel URLs
- Pass metadata (org_id, tier)

---

#### 11. Stripe Customer Portal
**File**: `apps/web/app/api/stripe/create-portal/route.ts` (NEW)

**Functionality**:
- Create Stripe customer portal session
- Allow users to manage billing
- View invoices, update payment method
- Cancel subscription

---

#### 12. Stripe Webhook Handler
**File**: `apps/web/app/api/webhooks/stripe/route.ts` (NEW)

**Events to handle**:
- `customer.subscription.created` - Create subscription record
- `customer.subscription.updated` - Update subscription
- `customer.subscription.deleted` - Cancel subscription
- `invoice.paid` - Update subscription status
- `invoice.payment_failed` - Set status to past_due

**Actions**:
- Update `subscriptions` table
- Sync tier, status, billing period
- Send email notifications (payment failed, etc.)

---

### Phase 5: Admin Features

#### 13. Admin Subscription Management Page
**File**: `apps/web/app/admin/subscriptions/page.tsx` (NEW)

**Features needed**:
- List all subscriptions with filters:
  - Filter by tier (Free/Basic/Premium/Enterprise)
  - Filter by status (Active/Past Due/Canceled)
  - Search by organization name
- Display subscription details:
  - Organization name
  - Tier and status
  - Quota usage
  - Billing period
  - Stripe customer ID
- Actions:
  - View subscription details
  - Override quota limits
  - Change tier manually
  - View usage history

**UI Components**:
- Data table with subscriptions
- Filter controls
- Subscription detail modal
- Quota override form
- Usage charts/graphs

---

#### 14. Admin Quota Override API
**File**: `apps/web/app/api/admin/subscriptions/override/route.ts` (NEW)

**Functionality**:
- Allow admin to override quota limits
- Set custom email quota
- Set custom QR links per product
- Mark as custom override
- Update subscription record

**Request body**:
```typescript
{
  orgId: string
  emailQuota?: number
  qrLinksPerProduct?: number
}
```

---

#### 15. Admin Subscription Statistics
**File**: `apps/web/app/admin/subscriptions/page.tsx` (add to existing)

**Metrics to display**:
- Total active subscriptions
- Breakdown by tier (Free: X, Basic: Y, Premium: Z)
- Monthly Recurring Revenue (MRR)
- Subscription growth trend
- Churn rate
- Average quota usage per tier

**UI Components**:
- Stat cards
- Pie chart (tier distribution)
- Line chart (MRR over time)
- Usage statistics table

---

### Phase 6: Feature Gates & Components

#### 16. Upgrade Prompt Modal Component
**File**: `apps/web/components/ui/upgrade-prompt.tsx` (NEW)

**Props**:
- `feature` - Feature name (e.g., "Send more than 30 emails")
- `recommendedTier` - Suggested tier
- `currentTier` - User's current tier
- `onUpgrade` - Callback for upgrade action

**UI**:
- Modal with feature description
- Tier comparison
- Upgrade button
- Close button

---

#### 17. Quota Usage Bar Component
**File**: `apps/web/components/ui/quota-bar.tsx` (NEW)

**Props**:
- `used` - Current usage
- `total` - Total quota
- `label` - Label (e.g., "Email Quota")
- `type` - Type (emails, links)

**UI**:
- Progress bar
- Usage text (X / Y)
- Percentage
- Warning color if >80% used

---

#### 18. Feature Gate Wrapper Component
**File**: `apps/web/components/ui/feature-gate.tsx` (NEW)

**Props**:
- `feature` - Feature name
- `fallback` - Component to show if feature unavailable
- `children` - Content to show if feature available

**Usage**:
```tsx
<FeatureGate feature="unlimited_qr_links" fallback={<UpgradePrompt />}>
  <AddQRLinkButton />
</FeatureGate>
```

---

## 📋 Implementation Priority

### 🔴 Critical (Blocking)
1. Quota utilities (`lib/utils/quotas.ts`)
2. Subscription hook (`lib/hooks/use-subscription.ts`)
3. Campaign config page quota integration
4. Campaign launch quota validation
5. Email sending usage tracking

### 🟡 High Priority
6. Pricing page
7. Billing page updates
8. Stripe checkout API
9. Stripe webhook handler
10. Product links quota check

### 🟢 Medium Priority
11. Upgrade prompt component
12. Quota usage bar component
13. Feature gate component
14. Admin subscription management

### ⚪ Low Priority
15. Admin quota override API
16. Admin subscription statistics
17. Stripe customer portal

---

## 🎨 UI Files That Need Updates

### Existing Files to Update:
1. ✅ `apps/web/app/dashboard/campaigns/create/config/page.tsx` - Add quota checks
2. ✅ `apps/web/app/dashboard/campaigns/create/review/page.tsx` - Add quota validation
3. ✅ `apps/web/app/dashboard/billing/page.tsx` - Replace placeholder with real data
4. ✅ `apps/web/components/products/SharingLinksPanel.tsx` - Add quota checks
5. ✅ `apps/web/app/page.tsx` - **Landing page pricing section** - Update hardcoded pricing to match actual tiers
6. ✅ `apps/web/app/dashboard/page.tsx` - Replace hardcoded "Basic" subscription with real data
7. ✅ `apps/web/app/faq/page.tsx` - Update outdated pricing information in FAQ
8. ✅ `apps/web/components/dashboard/sidebar.tsx` - Consider adding "Pricing" link (optional)

### New Files to Create:
1. `apps/web/lib/utils/quotas.ts` - Quota utilities
2. `apps/web/lib/hooks/use-subscription.ts` - Subscription hook
3. `apps/web/app/dashboard/pricing/page.tsx` - Pricing page
4. `apps/web/app/api/stripe/create-checkout/route.ts` - Stripe checkout
5. `apps/web/app/api/stripe/create-portal/route.ts` - Stripe portal
6. `apps/web/app/api/webhooks/stripe/route.ts` - Stripe webhooks
7. `apps/web/app/admin/subscriptions/page.tsx` - Admin management
8. `apps/web/app/api/admin/subscriptions/override/route.ts` - Admin override
9. `apps/web/components/ui/upgrade-prompt.tsx` - Upgrade modal
10. `apps/web/components/ui/quota-bar.tsx` - Quota progress bar
11. `apps/web/components/ui/feature-gate.tsx` - Feature gate wrapper

---

## 🔧 Backend Files That Need Updates

### API Routes:
1. `apps/web/app/api/admin/campaigns/send/route.ts` - Add usage tracking
2. `apps/web/app/api/admin/campaigns/schedule/route.ts` - Add quota check
3. `apps/web/app/api/products/tokens/generate/route.ts` - Add link quota check
4. `supabase/functions/send-scheduled-emails/index.ts` - Add usage tracking

---

## ✅ Quick Checklist

### Infrastructure
- [ ] Create quota utilities
- [ ] Create subscription hook
- [ ] Install Stripe SDK (`npm install stripe @stripe/stripe-js`)

### UI Updates
- [ ] Update campaign config page
- [ ] Update campaign review page
- [ ] Create pricing page
- [ ] Update billing page
- [ ] Update product links panel

### Backend
- [ ] Add quota checks to email sending
- [ ] Add usage tracking
- [ ] Create Stripe APIs
- [ ] Create Stripe webhook handler

### Admin
- [ ] Create admin subscription page
- [ ] Create admin override API
- [ ] Add subscription statistics

### Components
- [ ] Create upgrade prompt modal
- [ ] Create quota usage bar
- [ ] Create feature gate wrapper

---

## 🚀 Getting Started

1. **Start with quota utilities** - Everything depends on this
2. **Create subscription hook** - Needed for all UI components
3. **Update campaign pages** - Most critical user-facing feature
4. **Add usage tracking** - Required for quota enforcement
5. **Build pricing page** - Users need to upgrade
6. **Integrate Stripe** - Payment processing

---

**Total Files to Create**: 11 new files  
**Total Files to Update**: 8 existing files  
**Estimated Effort**: ~2-3 weeks for full implementation

---

## 🌐 Public-Facing Pages That Need Updates

### Landing Page (`apps/web/app/page.tsx`)
**Section**: Pricing (Lines 1094-1204)

**Issues**:
- ❌ Hardcoded pricing tiers don't match actual `PRICING_TIERS`
- ❌ Wrong prices: Shows $299 Basic, $999 Pro (should be $499 Basic, $1,999 Premium)
- ❌ Wrong features: Shows product page limits (should be unlimited)
- ❌ Wrong email quotas: Shows 50/500/2000 (should be 30/400/2000)
- ❌ Missing QR links information
- ❌ "Get Started" buttons don't link to pricing/checkout

**Required Changes**:
1. Import `PRICING_TIERS` and `FEATURE_COMPARISON` from constants
2. Replace hardcoded pricing array with dynamic data
3. Update feature lists to show actual tier features
4. Add functional upgrade buttons (link to `/dashboard/pricing` or Stripe)
5. Use `formatPrice()` and `formatQuota()` helpers for display

---

### FAQ Page (`apps/web/app/faq/page.tsx`)
**Section**: "How much does Pitchivo cost?" (Line 42)

**Issues**:
- ❌ Outdated pricing information
- ❌ Mentions "free trial" (should be "free plan")
- ❌ Wrong prices and features
- ❌ Structured data (JSON-LD) also has wrong info

**Required Changes**:
1. Update FAQ answer text with correct pricing
2. Update structured data for SEO
3. Ensure consistency across all pricing mentions

---

### Dashboard Home Page (`apps/web/app/dashboard/page.tsx`)
**Section**: Metrics Overview - Subscription (Line 118)

**Issues**:
- ❌ Hardcoded "Basic" subscription
- ❌ No real subscription data
- ❌ No link to billing/pricing

**Required Changes**:
1. Fetch subscription from database
2. Display real tier name
3. Show subscription status
4. Add link to billing page
5. Show quota usage (when quota utilities exist)

---

## 📱 Navigation & Menu Updates

### Dashboard Sidebar (`apps/web/components/dashboard/sidebar.tsx`)
**Current**: Has "Billing" link (line 38)

**Optional Enhancement**:
- Consider adding "Pricing" link for easy access to pricing page
- Or keep pricing accessible via billing page

### Mobile Navigation (`apps/web/components/dashboard/mobile-nav.tsx`)
**Current**: Links to "More" page which has billing

**Status**: ✅ Already accessible via "More" → "Billing"

**No changes needed** unless you want direct pricing link

---

## 📋 Complete File List

### Files to Create (11):
1. `apps/web/lib/utils/quotas.ts`
2. `apps/web/lib/hooks/use-subscription.ts`
3. `apps/web/app/dashboard/pricing/page.tsx`
4. `apps/web/app/api/stripe/create-checkout/route.ts`
5. `apps/web/app/api/stripe/create-portal/route.ts`
6. `apps/web/app/api/webhooks/stripe/route.ts`
7. `apps/web/app/admin/subscriptions/page.tsx`
8. `apps/web/app/api/admin/subscriptions/override/route.ts`
9. `apps/web/components/ui/upgrade-prompt.tsx`
10. `apps/web/components/ui/quota-bar.tsx`
11. `apps/web/components/ui/feature-gate.tsx`

### Files to Update (8):
1. `apps/web/app/dashboard/campaigns/create/config/page.tsx` - Quota checks
2. `apps/web/app/dashboard/campaigns/create/review/page.tsx` - Quota validation
3. `apps/web/app/dashboard/billing/page.tsx` - Real subscription data
4. `apps/web/components/products/SharingLinksPanel.tsx` - QR link quota
5. `apps/web/app/page.tsx` - **Landing page pricing section**
6. `apps/web/app/dashboard/page.tsx` - **Real subscription display**
7. `apps/web/app/faq/page.tsx` - **Update pricing FAQ**
8. `apps/web/app/api/products/tokens/generate/route.ts` - QR link quota check

### Backend Files to Update (3):
1. `apps/web/app/api/admin/campaigns/send/route.ts` - Usage tracking
2. `apps/web/app/api/admin/campaigns/schedule/route.ts` - Quota check
3. `supabase/functions/send-scheduled-emails/index.ts` - Usage tracking

