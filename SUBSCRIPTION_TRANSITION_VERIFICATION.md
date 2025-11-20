# Subscription Transition Code Verification

## Critical Cases Analysis

### ✅ Case 5.1 & 5.2: Cancel then Change Plan
**Status:** HANDLED CORRECTLY

**Flow:** Premium (cancel_at_period_end: true) → Basic

**Code Path:**
1. `create-checkout/route.ts` line 138-141: Detects `cancel_at_period_end: true` and clears it
2. `webhooks/stripe/route.ts` line 359-368: Detects cancellation was cleared and clears `canceled_at`

**Verification:**
- ✅ `create-checkout` clears `cancel_at_period_end: false` when updating subscription
- ✅ Webhook detects `wasScheduledToCancel && !subscriptionToUse.cancel_at_period_end`
- ✅ Webhook clears `canceled_at` timestamp
- ✅ Subscription continues with new tier

---

### ✅ Case 7.1: Multiple Changes (Upgrade → Cancel → Downgrade)
**Status:** HANDLED CORRECTLY

**Flow:** Basic → Premium → Cancel → Basic

**Code Path:**
1. Basic → Premium: `create-checkout` updates subscription, webhook updates tier
2. Premium → Cancel: `cancel-subscription` sets `cancel_at_period_end: true`
3. Cancel → Basic: `create-checkout` clears cancellation, updates to Basic

**Verification:**
- ✅ Each step handled independently
- ✅ Cancellation cleared when changing plans
- ✅ Final state: Basic tier, active, no cancellation

---

### ⚠️ Potential Issue: Case 5.3 (Cancel then Cancel Again)
**Status:** NEEDS VERIFICATION

**Flow:** Basic (cancel_at_period_end: true) → Cancel again

**Current Behavior:**
- `cancel-subscription` API sets `cancel_at_period_end: true` again
- Updates `canceled_at` timestamp to new time
- This is actually correct behavior - latest cancellation time is recorded

**Verification:**
- ✅ Keeps `cancel_at_period_end: true`
- ✅ Updates `canceled_at` to latest cancellation time
- ✅ Status remains active until period ends

---

### ✅ Case 8.1: Period Ends with Cancellation
**Status:** HANDLED CORRECTLY

**Flow:** Basic (cancel_at_period_end: true) → Period Ends

**Code Path:**
- `webhooks/stripe/route.ts` line 296-298: Detects `isScheduledToCancel && periodEnded`
- Line 305-312: Downgrades to free tier

**Verification:**
- ✅ Detects period ended AND cancellation scheduled
- ✅ Downgrades to free tier
- ✅ Resets quotas to free tier
- ✅ Sets status to canceled

---

### ✅ Case 9.1-9.3: Edge Cases
**Status:** HANDLED CORRECTLY

**Verification:**
- ✅ Same tier selected: Returns error (line 114-118 in create-checkout)
- ✅ Free → Free: Shows error in pricing page
- ✅ Paid → Free: Calls cancel-subscription API (not create-checkout)

---

## Potential Issues Found

### Issue 1: Reactivation Detection Logic
**Location:** `webhooks/stripe/route.ts` line 359

**Current Code:**
```typescript
} else if (isReactivated || (wasScheduledToCancel && !subscriptionToUse.cancel_at_period_end)) {
```

**Analysis:**
- `isReactivated` already checks `wasScheduledToCancel && !subscriptionToUse.cancel_at_period_end`
- The second condition is redundant but harmless
- ✅ Logic is correct

---

### Issue 2: Quota Update When Cancellation Cleared
**Location:** `webhooks/stripe/route.ts` line 328-332

**Current Code:**
```typescript
const shouldUpdateQuotas = 
  isNewSubscription ||
  tierChanged ||
  shouldDowngradeToFree ||
  !existingSubscription?.custom_quota_override
```

**Analysis:**
- When cancellation is cleared but tier hasn't changed, quotas are preserved
- This is correct - if tier didn't change, quotas shouldn't change
- ✅ Logic is correct

---

### Issue 3: Custom Quota Override Preservation
**Location:** `webhooks/stripe/route.ts` line 375-377

**Current Code:**
```typescript
if (shouldDowngradeToFree || tierChanged) {
  updateData.custom_quota_override = false
}
```

**Analysis:**
- Custom overrides are cleared when tier changes or downgrading to free
- This is correct - tier changes should reset to tier defaults
- ✅ Logic is correct

---

## Missing Edge Cases

### Edge Case 1: Immediate Cancellation (Not at Period End)
**Flow:** User wants to cancel immediately, not at period end

**Current Behavior:**
- `cancel-subscription` always sets `cancel_at_period_end: true`
- No immediate cancellation option

**Recommendation:**
- Add option for immediate cancellation (would need to handle refunds)
- For now, current behavior is acceptable (cancel at period end)

---

### Edge Case 2: Subscription Already Canceled (status = 'canceled')
**Flow:** Subscription already canceled → User tries to change plan

**Current Behavior:**
- If subscription is already canceled, `create-checkout` would try to update it
- Stripe might reject the update if subscription is canceled

**Recommendation:**
- Check subscription status before updating
- If canceled, create new subscription instead

---

### Edge Case 3: Past Due Subscription
**Flow:** Subscription is past_due → User tries to change plan

**Current Behavior:**
- `create-checkout` would try to update subscription
- Stripe might require payment first

**Recommendation:**
- Check status before allowing plan changes
- Require payment of past due amount first

---

## Recommendations

### 1. Add Status Check in create-checkout
```typescript
// Before updating subscription, check status
if (existingStripeSubscription.status === 'canceled' || 
    existingStripeSubscription.status === 'unpaid') {
  // Create new subscription instead of updating
}
```

### 2. Add Past Due Handling
```typescript
if (existingStripeSubscription.status === 'past_due') {
  return NextResponse.json(
    { error: 'Please pay your outstanding invoice before changing plans' },
    { status: 400 }
  )
}
```

### 3. Add Immediate Cancellation Option (Future)
- Add parameter to cancel-subscription API
- Handle immediate cancellation with refunds

---

## Summary

### ✅ Correctly Handled Cases:
- All basic flows (new, upgrade, downgrade)
- Cancellation flows
- Cancel then change plan (CRITICAL FIX)
- Period end scenarios
- Reactivation
- Multiple sequential changes
- Edge cases (same tier, free tier)

### ⚠️ Potential Improvements:
- Handle already-canceled subscriptions
- Handle past_due subscriptions
- Add immediate cancellation option

### 🎯 Critical Fix Applied:
- **Cancel then change plan** now correctly clears cancellation
- User pays new tier price, not old tier price
- Subscription continues with new tier

