# Stripe API Implementation Verification

## Verification Against Stripe Best Practices

### 1. Subscription Update vs Checkout Session

#### ✅ CORRECT: When to Use Each

**Our Implementation:**
- **Existing Subscription**: Use `stripe.subscriptions.update()` ✅
- **New Subscription**: Use `stripe.checkout.sessions.create()` ✅

**Stripe Best Practice:**
- Use `subscriptions.update()` when modifying existing subscriptions (ensures proper proration)
- Use `checkout.sessions.create()` only for new subscriptions (requires customer interaction)

**Verification:**
```typescript
// apps/web/app/api/stripe/create-checkout/route.ts
if (subscription?.stripe_subscription_id) {
  // Update existing subscription ✅
  await stripe.subscriptions.update(...)
} else {
  // Create new checkout session ✅
  await stripe.checkout.sessions.create(...)
}
```

---

### 2. Proration Handling

#### ✅ CORRECT: Proration Behavior

**Our Implementation:**
```typescript
proration_behavior: 'always_invoice'
```

**Stripe Documentation:**
- `always_invoice`: Always create prorations and invoice immediately
- This is the correct choice for plan changes to ensure:
  - Upgrades: Customer pays prorated difference immediately
  - Downgrades: Customer gets credit applied to next invoice

**Verification:**
- ✅ Upgrades: Charges prorated difference immediately
- ✅ Downgrades: Credits unused amount (applied to next invoice)
- ✅ Money handled correctly in both directions

---

### 3. Cancellation Clearing on Plan Change

#### ✅ CORRECT: Clearing cancel_at_period_end

**Our Implementation:**
```typescript
if (existingStripeSubscription.cancel_at_period_end) {
  updateParams.cancel_at_period_end = false
}
```

**Stripe Best Practice:**
- When updating a subscription to a new plan, if `cancel_at_period_end: true`, you should clear it
- Setting `cancel_at_period_end: false` during update clears the scheduled cancellation
- This is correct because user is changing plans, not canceling

**Verification:**
- ✅ Premium ($1999) scheduled to cancel → Downgrade to Basic ($499)
- ✅ `cancel_at_period_end` cleared to `false`
- ✅ Subscription continues with Basic tier
- ✅ User pays $499 going forward, not $1999

---

### 4. Webhook Event Handling

#### ✅ CORRECT: Events We Handle

**Our Implementation Handles:**
1. ✅ `customer.subscription.created` - New subscriptions
2. ✅ `customer.subscription.updated` - Plan changes, status updates, cancellations
3. ✅ `customer.subscription.deleted` - Actual cancellations
4. ✅ `invoice.paid` - Payment success
5. ✅ `invoice.payment_failed` - Payment failures

**Stripe Best Practice:**
- Handle all subscription lifecycle events
- Update database based on webhook events (source of truth)
- Don't rely on API responses alone

**Verification:**
- ✅ All critical events handled
- ✅ Database updated from webhooks (not API responses)
- ✅ Status, tier, quotas all updated correctly

---

### 5. Subscription Status Mapping

#### ✅ CORRECT: Status Handling

**Our Implementation:**
```typescript
if (isActuallyCanceled) {
  subscriptionStatus = 'canceled'
} else if (subscriptionToUse.status === 'past_due') {
  subscriptionStatus = 'past_due'
} else if (subscriptionToUse.status === 'trialing') {
  subscriptionStatus = 'trialing'
} else if (subscriptionToUse.status === 'active') {
  subscriptionStatus = 'active'
} else {
  subscriptionStatus = 'inactive'
}
```

**Stripe Status Values:**
- `active`: Subscription is active and payments are up-to-date ✅
- `trialing`: Subscription is in trial period ✅
- `past_due`: Payment failed, subscription is past due ✅
- `canceled`: Subscription has been canceled ✅
- `unpaid`: Subscription is unpaid (treated as canceled) ✅

**Verification:**
- ✅ All Stripe statuses mapped correctly
- ✅ `canceled` and `unpaid` both treated as canceled
- ✅ `active` maintained even when `cancel_at_period_end: true` (correct)

---

### 6. Quota Updates

#### ✅ CORRECT: Quota Update Strategy

**Our Implementation:**
```typescript
const shouldUpdateQuotas = 
  isNewSubscription ||
  tierChanged ||
  shouldDowngradeToFree ||
  !existingSubscription?.custom_quota_override
```

**Logic:**
- ✅ Update quotas when tier changes (upgrade/downgrade)
- ✅ Update quotas when downgrading to free
- ✅ Preserve quotas when custom override exists AND tier unchanged
- ✅ Clear custom override when tier changes

**Verification:**
- ✅ Quotas update correctly on tier changes
- ✅ Custom overrides preserved when appropriate
- ✅ Quotas reset to tier defaults when tier changes

---

### 7. Period Date Handling

#### ✅ CORRECT: Period Date Validation

**Our Implementation:**
1. Check if period dates exist in webhook payload
2. If missing, fetch from Stripe API
3. Validate dates are valid
4. Always set in database

**Stripe Best Practice:**
- Period dates are required for billing tracking
- Should always be present in subscription object
- If missing, fetch from API (edge case handling)

**Verification:**
- ✅ Period dates validated
- ✅ Fetched from API if missing
- ✅ Always stored in database
- ✅ Used for billing period tracking

---

### 8. Metadata Handling

#### ✅ CORRECT: Metadata Usage

**Our Implementation:**
```typescript
metadata: {
  org_id: orgId,
  tier
}
```

**Stripe Best Practice:**
- Store application-specific data in metadata
- Use metadata to link Stripe objects to your database
- Update metadata when subscription changes

**Verification:**
- ✅ `org_id` stored in metadata (links to database)
- ✅ `tier` stored in metadata (tracks plan level)
- ✅ Metadata updated on subscription changes
- ✅ Webhook reads metadata to identify organization

---

### 9. Money Handling Verification

#### ✅ CORRECT: Proration Calculation

**Scenario 1: Upgrade (Basic $499 → Premium $1999)**
- Stripe calculates: (Premium price - Basic price) × (days remaining / total days)
- Customer charged prorated difference immediately
- ✅ Correct: `proration_behavior: 'always_invoice'` ensures immediate charge

**Scenario 2: Downgrade (Premium $1999 → Basic $499)**
- Stripe calculates: (Basic price - Premium price) × (days remaining / total days)
- Customer gets credit (negative amount) applied to next invoice
- ✅ Correct: Credit applied automatically by Stripe

**Scenario 3: Cancel then Change Plan (Premium $1999 cancel → Basic $499)**
- Previous: Would charge $1999 until cancel, then downgrade
- Now: Clears cancellation, charges prorated Basic amount
- ✅ Fixed: User pays $499 going forward

---

### 10. Checkout Flow vs API Update Flow

#### ✅ CORRECT: Flow Selection

**New Subscription (Checkout Flow):**
1. User clicks "Subscribe"
2. `checkout.sessions.create()` called
3. User redirected to Stripe Checkout
4. User enters payment details
5. Stripe creates subscription
6. Webhook `customer.subscription.created` received
7. Database updated

**Existing Subscription (API Update Flow):**
1. User clicks "Change Plan"
2. `subscriptions.update()` called directly
3. Stripe updates subscription immediately
4. Proration calculated and invoiced
5. Webhook `customer.subscription.updated` received
6. Database updated

**Verification:**
- ✅ New subscriptions use checkout (requires payment method)
- ✅ Existing subscriptions use API update (payment method already on file)
- ✅ Both flows update database via webhooks
- ✅ Money handled correctly in both flows

---

## Potential Issues & Recommendations

### Issue 1: Past Due Subscriptions
**Status:** ✅ HANDLED
- We check for `past_due` status and require payment before plan changes
- This prevents plan changes when payment is outstanding

### Issue 2: Canceled/Unpaid Subscriptions
**Status:** ✅ HANDLED
- We detect canceled/unpaid subscriptions
- Falls through to create new checkout session (correct behavior)

### Issue 3: Immediate Payment Required
**Status:** ⚠️ COULD IMPROVE
- When updating subscription, if proration requires immediate payment and payment method fails, Stripe will handle retry
- Consider adding handling for `invoice.payment_action_required` event

### Issue 4: Trial Periods
**Status:** ✅ HANDLED
- We map `trialing` status correctly
- Quotas apply during trial period

---

## Summary

### ✅ Correctly Implemented:
1. **Subscription Update API**: Used for existing subscriptions ✅
2. **Checkout Sessions**: Used for new subscriptions ✅
3. **Proration**: `always_invoice` ensures correct money handling ✅
4. **Cancellation Clearing**: Clears `cancel_at_period_end` when changing plans ✅
5. **Webhook Handling**: All critical events handled ✅
6. **Status Mapping**: All Stripe statuses mapped correctly ✅
7. **Quota Updates**: Logic handles all scenarios ✅
8. **Period Dates**: Validated and always stored ✅
9. **Metadata**: Used correctly for linking ✅
10. **Money Handling**: Proration works correctly in all directions ✅

### ⚠️ Minor Improvements (Optional):
1. Handle `invoice.payment_action_required` for 3D Secure
2. Add retry logic for failed subscription updates
3. Add more detailed logging for proration amounts

### 🎯 Critical Fix Verified:
- **Cancel then Change Plan**: Now correctly clears cancellation and charges new tier price
- User pays correct amount going forward
- No more paying old tier price while on new tier

---

## Conclusion

Our implementation follows Stripe best practices and handles money, quotas, and status correctly in both:
- **Direct API calls** (subscription updates)
- **Checkout flow** (new subscriptions)

All critical scenarios are handled correctly, including the tricky case of canceling then changing plans.

