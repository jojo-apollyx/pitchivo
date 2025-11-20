# Where to See Stripe Webhook Output

## Quick Answer: Two Terminals to Watch

When testing Stripe webhooks locally, you need to watch **TWO terminals**:

### 1. Stripe CLI Terminal (where you run `stripe listen`)

This shows events being forwarded from Stripe:

```bash
$ stripe listen --forward-to localhost:3000/api/webhooks/stripe

> Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)
> 
> 2024-01-15 10:30:45   --> customer.subscription.created [evt_xxx]
> 2024-01-15 10:30:45   --> invoice.paid [evt_xxx]
```

**What you see here:**
- Confirmation that events are being forwarded
- Event type and event ID
- Basic delivery status

### 2. Next.js Dev Server Terminal (where you run `npm run dev`)

**THIS IS WHERE YOU'LL SEE THE DETAILED LOGS!**

This shows all the webhook processing:

```
============================================
🔔 STRIPE WEBHOOK RECEIVED
Timestamp: 2024-01-15T10:30:45.123Z
Headers: { 'stripe-signature': 'Present', ... }
✅ Webhook signature verified
📦 Event Type: customer.subscription.created
🆔 Event ID: evt_xxx
🔄 Processing event: customer.subscription.created
📋 Subscription ID: sub_xxx
👤 Customer ID: cus_xxx
📊 Status: active
🏷️  Metadata: { org_id: 'xxx', tier: 'basic' }
📝 Handling subscription update...
   Org ID: xxx
   Tier: basic
💾 Updating subscription in database...
   Update data: { ... }
✅ Subscription updated successfully for org xxx
   New tier: basic
   New status: active
⏱️  Processing time: 45ms
✅ WEBHOOK PROCESSING COMPLETE
============================================
```

**What you see here:**
- 🔔 When webhook is received
- ✅ Signature verification
- 📦 Event details
- 📝 Processing steps
- 💾 Database operations
- ✅ Success/❌ Error messages

## How to Test

### Step 1: Start Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret and add to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Step 2: Start Next.js Dev Server
```bash
npm run dev
```

### Step 3: Trigger an Event

**Option A: Use Stripe CLI**
```bash
stripe trigger customer.subscription.created
```

**Option B: Create a real subscription**
- Go to your pricing page
- Use test card: `4242 4242 4242 4242`
- Complete checkout

### Step 4: Watch the Logs

1. **Stripe CLI terminal** - Should show: `--> customer.subscription.created [evt_xxx]`
2. **Next.js terminal** - Should show detailed processing logs with emojis

## ⚠️ IMPORTANT: Real Checkouts vs Manual Triggers

### The Problem

**When you use `stripe trigger`:**
- ✅ Events go to your local endpoint via Stripe CLI
- ✅ You see events in Stripe CLI terminal

**When you complete a real checkout on localhost:3000:**
- ❌ Stripe sends webhooks to endpoints configured in **Stripe Dashboard**
- ❌ NOT to localhost (unless you use ngrok)
- ❌ Stripe CLI won't see these events if Dashboard webhooks exist

### Solution: Remove Dashboard Webhooks (Easiest)

**For local development, you should NOT have webhook endpoints configured in Stripe Dashboard for test mode.**

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. **Make sure you're in TEST MODE** (toggle in top right)
3. **Delete or disable** all webhook endpoints
4. Now when you complete a checkout, Stripe will send events to Stripe CLI (when `stripe listen` is running)

**Note:** Stripe CLI can only forward events if there are NO webhook endpoints configured in Dashboard. If Dashboard webhooks exist, Stripe sends events there instead.

### Alternative: Use ngrok (If You Need Dashboard Webhooks)

If you need to test with Dashboard webhooks configured:

1. **Install ngrok:**
   ```bash
   brew install ngrok
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

3. **Add webhook in Stripe Dashboard:**
   - Go to [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - URL: `https://abc123.ngrok.io/api/webhooks/stripe`
   - Select events: `customer.subscription.*`, `invoice.*`
   - Copy the webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`
   - Restart your dev server

4. **Now real checkouts will send webhooks via ngrok!**

## Troubleshooting

### "I don't see anything"

1. **Check both terminals are running:**
   - Stripe CLI: `stripe listen` should be active
   - Next.js: `npm run dev` should be running

2. **Check you're looking at the right terminal:**
   - Stripe CLI output → Stripe CLI terminal
   - Detailed logs → Next.js dev server terminal

3. **Verify webhook secret:**
   - Copy `whsec_...` from Stripe CLI
   - Add to `.env.local`
   - **Restart Next.js dev server** (important!)

4. **Check for errors:**
   - Look for `❌` in Next.js terminal
   - Common: "Missing stripe-signature" or "Invalid signature"

### "I see errors"

**Signature verification failed:**
- Webhook secret doesn't match
- Restart dev server after updating `.env.local`

**Missing org_id or tier:**
- Check metadata in logs: `🏷️ Metadata:`
- Test events from Stripe CLI don't have real metadata
- Create a real subscription via checkout for full testing

**Database errors:**
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Look for `❌ Error updating subscription` in logs
- Check Supabase connection

## Quick Reference

```bash
# Terminal 1: Start Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Start Next.js
npm run dev

# Terminal 1 or 2: Trigger event
stripe trigger customer.subscription.created
```

**Watch Terminal 2 (Next.js) for detailed logs!**

