# Subscription Transition Test Matrix

## Test Cases and Expected Behavior

### 1. Basic Subscription Flows

#### Case 1.1: New Subscription (No existing subscription)
**Flow:** None → Basic
**Expected:**
- ✅ Create new Stripe checkout session
- ✅ Create subscription record in database
- ✅ Set tier to Basic, status to active
- ✅ Set quotas to Basic tier quotas

#### Case 1.2: New Subscription (No existing subscription)
**Flow:** None → Premium
**Expected:**
- ✅ Create new Stripe checkout session
- ✅ Create subscription record in database
- ✅ Set tier to Premium, status to active
- ✅ Set quotas to Premium tier quotas

---

### 2. Upgrade Flows

#### Case 2.1: Simple Upgrade
**Flow:** Basic → Premium
**Expected:**
- ✅ Update existing Stripe subscription (not create new)
- ✅ Change price from Basic to Premium
- ✅ Prorate: Charge difference for remaining period
- ✅ Update tier to Premium in database
- ✅ Update quotas to Premium tier quotas
- ✅ Clear any custom quota overrides

#### Case 2.2: Upgrade from Free
**Flow:** Free → Basic
**Expected:**
- ✅ Create new Stripe checkout session (free has no Stripe subscription)
- ✅ Create subscription record
- ✅ Set tier to Basic, status to active

#### Case 2.3: Upgrade from Free to Premium
**Flow:** Free → Premium
**Expected:**
- ✅ Create new Stripe checkout session
- ✅ Create subscription record
- ✅ Set tier to Premium, status to active

---

### 3. Downgrade Flows

#### Case 3.1: Simple Downgrade
**Flow:** Premium → Basic
**Expected:**
- ✅ Update existing Stripe subscription
- ✅ Change price from Premium to Basic
- ✅ Prorate: Credit unused Premium amount, charge Basic
- ✅ Update tier to Basic in database
- ✅ Update quotas to Basic tier quotas
- ✅ Clear any custom quota overrides

#### Case 3.2: Downgrade to Free
**Flow:** Basic → Free
**Expected:**
- ✅ Call cancel-subscription API (not create-checkout)
- ✅ Set cancel_at_period_end: true in Stripe
- ✅ Keep subscription active until period ends
- ✅ When period ends: downgrade to free, reset quotas

#### Case 3.3: Downgrade to Free from Premium
**Flow:** Premium → Free
**Expected:**
- ✅ Call cancel-subscription API
- ✅ Set cancel_at_period_end: true in Stripe
- ✅ Keep subscription active until period ends
- ✅ When period ends: downgrade to free, reset quotas

---

### 4. Cancellation Flows

#### Case 4.1: Cancel Active Subscription
**Flow:** Basic (active) → Cancel
**Expected:**
- ✅ Set cancel_at_period_end: true
- ✅ Set canceled_at timestamp
- ✅ Keep status as active until period ends
- ✅ Keep tier as Basic until period ends
- ✅ When period ends: downgrade to free

#### Case 4.2: Cancel Premium Subscription
**Flow:** Premium (active) → Cancel
**Expected:**
- ✅ Set cancel_at_period_end: true
- ✅ Set canceled_at timestamp
- ✅ Keep status as active until period ends
- ✅ Keep tier as Premium until period ends
- ✅ When period ends: downgrade to free

---

### 5. Cancel Then Change Plan (TRICKY!)

#### Case 5.1: Cancel then Upgrade
**Flow:** Basic (cancel_at_period_end: true) → Premium
**Expected:**
- ✅ Clear cancel_at_period_end: false
- ✅ Clear canceled_at timestamp
- ✅ Update price to Premium
- ✅ Prorate: Charge difference
- ✅ Update tier to Premium
- ✅ Update quotas to Premium
- ✅ Subscription continues with Premium

#### Case 5.2: Cancel then Downgrade
**Flow:** Premium (cancel_at_period_end: true) → Basic
**Expected:**
- ✅ Clear cancel_at_period_end: false
- ✅ Clear canceled_at timestamp
- ✅ Update price to Basic
- ✅ Prorate: Credit unused Premium, charge Basic
- ✅ Update tier to Basic
- ✅ Update quotas to Basic
- ✅ Subscription continues with Basic

#### Case 5.3: Cancel then Cancel Again (Edge Case)
**Flow:** Basic (cancel_at_period_end: true) → Cancel again
**Expected:**
- ✅ Keep cancel_at_period_end: true
- ✅ Update canceled_at timestamp (new cancellation time)
- ✅ Status remains active until period ends

---

### 6. Reactivation Flows

#### Case 6.1: Reactivate Cancelled Subscription
**Flow:** Basic (cancel_at_period_end: true) → Reactivate (via Stripe Portal)
**Expected:**
- ✅ Webhook receives cancel_at_period_end: false
- ✅ Clear canceled_at timestamp
- ✅ Keep tier as Basic
- ✅ Keep quotas as Basic
- ✅ Status remains active

---

### 7. Multiple Changes in Sequence (VERY TRICKY!)

#### Case 7.1: Upgrade → Cancel → Downgrade
**Flow:** Basic → Premium → Cancel → Basic
**Expected:**
- Step 1 (Basic → Premium): Update to Premium, prorate
- Step 2 (Premium → Cancel): Set cancel_at_period_end: true
- Step 3 (Cancel → Basic): Clear cancellation, update to Basic, prorate
- ✅ Final: Basic tier, active, no cancellation scheduled

#### Case 7.2: Cancel → Upgrade → Cancel Again
**Flow:** Premium → Cancel → Basic → Cancel
**Expected:**
- Step 1 (Premium → Cancel): Set cancel_at_period_end: true
- Step 2 (Cancel → Basic): Clear cancellation, update to Basic
- Step 3 (Basic → Cancel): Set cancel_at_period_end: true again
- ✅ Final: Basic tier, cancel_at_period_end: true, active until period ends

#### Case 7.3: Upgrade → Downgrade → Upgrade
**Flow:** Basic → Premium → Basic → Premium
**Expected:**
- Step 1: Upgrade to Premium, prorate
- Step 2: Downgrade to Basic, prorate
- Step 3: Upgrade to Premium again, prorate
- ✅ Final: Premium tier, active, no cancellation

---

### 8. Period End Scenarios

#### Case 8.1: Period Ends with Cancellation Scheduled
**Flow:** Basic (cancel_at_period_end: true) → Period Ends
**Expected:**
- ✅ Webhook receives customer.subscription.updated with period ended
- ✅ Detect: cancel_at_period_end: true AND periodEnded: true
- ✅ Downgrade to free tier
- ✅ Reset quotas to free tier
- ✅ Set status to canceled
- ✅ Clear cancel_at_period_end flag

#### Case 8.2: Period Ends without Cancellation
**Flow:** Basic (active) → Period Ends
**Expected:**
- ✅ Webhook receives customer.subscription.updated
- ✅ Renew subscription automatically
- ✅ Keep tier as Basic
- ✅ Keep quotas as Basic
- ✅ Status remains active

---

### 9. Edge Cases

#### Case 9.1: Same Tier Selected
**Flow:** Basic → Basic (clicking same tier)
**Expected:**
- ✅ Return error: "Already subscribed to this tier"
- ✅ No Stripe API call
- ✅ No database update

#### Case 9.2: Free Tier Selected (when already on free)
**Flow:** Free → Free
**Expected:**
- ✅ Show error: "You are already on the free plan"
- ✅ No API call

#### Case 9.3: Free Tier Selected (when on paid plan)
**Flow:** Basic → Free
**Expected:**
- ✅ Call cancel-subscription API (not create-checkout)
- ✅ Set cancel_at_period_end: true
- ✅ Keep active until period ends

#### Case 9.4: Subscription Update with Missing Period Dates
**Flow:** Webhook receives subscription without period dates
**Expected:**
- ✅ Fetch full subscription from Stripe API
- ✅ Use fetched period dates
- ✅ Continue processing normally

#### Case 9.5: Subscription Update with Invalid Period Dates
**Flow:** Webhook receives subscription with invalid timestamps
**Expected:**
- ✅ Detect invalid dates
- ✅ Fetch from Stripe API
- ✅ If still invalid, throw error (shouldn't happen)

---

### 10. Payment Failure Scenarios

#### Case 10.1: Payment Failed
**Flow:** Basic (active) → Payment fails
**Expected:**
- ✅ Webhook receives invoice.payment_failed
- ✅ Update status to past_due
- ✅ Keep tier as Basic
- ✅ Keep quotas (don't downgrade yet)

#### Case 10.2: Payment Succeeds After Failure
**Flow:** Basic (past_due) → Payment succeeds
**Expected:**
- ✅ Webhook receives invoice.paid
- ✅ Update status to active
- ✅ Keep tier as Basic

---

## Verification Checklist

For each case, verify:
- [ ] Correct Stripe API call (update vs create)
- [ ] Proration handled correctly
- [ ] cancel_at_period_end cleared when changing plans
- [ ] canceled_at timestamp cleared when changing plans
- [ ] Tier updated correctly in database
- [ ] Quotas updated correctly
- [ ] Status updated correctly
- [ ] Period dates tracked correctly
- [ ] Custom quota overrides preserved when appropriate
- [ ] Webhook handles all edge cases

