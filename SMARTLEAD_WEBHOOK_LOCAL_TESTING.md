# Smartlead Webhook Local Testing Guide

## Overview

This guide explains how to test Smartlead webhooks locally during development. Since Smartlead sends webhooks over HTTPS, you'll need to expose your local server to the internet.

## Quick Start

### Option 1: Using ngrok (Recommended)

**Step 1: Install ngrok**
```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

**Step 2: Start your Next.js dev server**
```bash
npm run dev
# Server runs on http://localhost:3000
```

**Step 3: Start ngrok tunnel**
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Step 4: Configure webhook in Smartlead**
1. Log in to Smartlead Dashboard
2. Go to **Settings > Webhooks**
3. Click **Add Webhook**
4. Enter:
   - **Webhook URL**: `https://abc123.ngrok.io/api/webhooks/smartlead`
   - **Event Types**: Select events you want to test
   - **Level**: User/Client/Campaign level
5. Click **Save**

**Step 5: Test with Smartlead's Test Button**
- In Smartlead webhook settings, click **"Send Test To Webhook"**
- Check your Next.js terminal for webhook logs

**Step 6: Watch the logs**
Your Next.js dev server terminal will show:
```
============================================
🚀 SMARTLEAD WEBHOOK RECEIVED
Timestamp: 2025-01-15T10:30:45.123Z
📦 Raw payload: { ... }
📊 Processing 1 event(s)
...
✅ WEBHOOK PROCESSING COMPLETE
============================================
```

---

### Option 2: Using curl (Manual Testing)

You can manually send test webhooks using curl without setting up ngrok:

**Step 1: Start your Next.js dev server**
```bash
npm run dev
```

**Step 2: Send test webhook with curl**
```bash
curl -X POST http://localhost:3000/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

**Step 3: Create test payload files**

Create `test-webhook-email-sent.json`:
```json
{
  "event_type": "EMAIL_SENT",
  "campaign_id": 9181,
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_status": "ACTIVE",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "from_email": "[email protected]",
  "to_email": "[email protected]",
  "to_name": "John Doe",
  "subject": "Quick question about your sales process",
  "sequence_number": 1,
  "time_sent": "2025-03-28T08:15:00+00:00",
  "event_timestamp": "2025-03-28T08:15:00+00:00",
  "message_id": "<unique-message-id@mail.gmail.com>",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] sent Email 1 for campaign - Q4 Outreach Campaign"
}
```

Create `test-webhook-email-open.json`:
```json
{
  "event_type": "EMAIL_OPEN",
  "campaign_id": 9181,
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_status": "ACTIVE",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "from_email": "[email protected]",
  "to_email": "[email protected]",
  "to_name": "John Doe",
  "subject": "Quick question about your sales process",
  "sequence_number": 1,
  "time_opened": "2025-03-28T09:20:15+00:00",
  "event_timestamp": "2025-03-28T09:20:15+00:00",
  "open_count": 1,
  "message_id": "<unique-message-id@mail.gmail.com>",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] opened Email 1 for campaign - Q4 Outreach Campaign"
}
```

Create `test-webhook-email-reply.json`:
```json
{
  "event_type": "EMAIL_REPLY",
  "campaign_status": "ACTIVE",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "from_email": "[email protected]",
  "cc_emails": [],
  "subject": "Re: Quick question about your sales process",
  "to_email": "[email protected]",
  "to_name": "Sarah Smith",
  "time_replied": "2025-03-28T09:35:01+00:00",
  "event_timestamp": "2025-03-28T09:35:01+00:00",
  "message_id": "<BDD5kUwc77maSjLRv2gmq35VkzEF9K4L3csPPCVx8e5kWbUnrsD@mail.gmail.com>",
  "preview_text": "Hi Sarah, thanks for reaching out. I'd be interested in learning more about your solution.",
  "reply_body": "Hi Sarah,\n\nThanks for reaching out. I'd be interested in learning more about your solution.\n\nCould we schedule a quick call next week?\n\nBest regards,\nJohn",
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_id": 9181,
  "sequence_number": 1,
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] replied to Email 1 for campaign - Q4 Outreach Campaign"
}
```

**Step 4: Send test webhooks**
```bash
# Test EMAIL_SENT
curl -X POST http://localhost:3000/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d @test-webhook-email-sent.json

# Test EMAIL_OPEN
curl -X POST http://localhost:3000/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d @test-webhook-email-open.json

# Test EMAIL_REPLY
curl -X POST http://localhost:3000/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d @test-webhook-email-reply.json
```

---

## Important Notes

### 1. Campaign ID Must Exist

**⚠️ CRITICAL**: The webhook handler looks up campaigns by `smartlead_campaign_id`. Make sure:

- Your test payload includes a `campaign_id` that exists in your database
- The campaign has a matching `smartlead_campaign_id` in the `campaigns` table

**To find a valid campaign_id:**
```sql
SELECT campaign_id, smartlead_campaign_id, campaign_name 
FROM campaigns 
WHERE smartlead_campaign_id IS NOT NULL 
LIMIT 5;
```

Then use that `smartlead_campaign_id` in your test payload.

### 2. Update Test Payloads

Before testing, update the test JSON files with:
- A valid `campaign_id` from your database
- A valid `sl_lead_email` (if testing lead events)
- Realistic timestamps

### 3. Watch the Logs

All webhook processing is logged to your Next.js dev server terminal. Look for:
- ✅ Success messages
- ❌ Error messages
- 📦 Payload details
- 🔄 Processing steps

### 4. ngrok URL Changes

**Important**: ngrok free tier generates a new URL each time you restart. If you restart ngrok:
1. Get the new ngrok URL
2. Update the webhook URL in Smartlead Dashboard
3. Or use ngrok's static domain (paid feature)

---

## Testing Different Event Types

### Test All Event Types

Create a script `test-all-events.sh`:
```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/webhooks/smartlead"

echo "Testing EMAIL_SENT..."
curl -X POST $BASE_URL -H "Content-Type: application/json" -d @test-webhook-email-sent.json
echo -e "\n\n"

echo "Testing EMAIL_OPEN..."
curl -X POST $BASE_URL -H "Content-Type: application/json" -d @test-webhook-email-open.json
echo -e "\n\n"

echo "Testing EMAIL_LINK_CLICK..."
curl -X POST $BASE_URL -H "Content-Type: application/json" -d @test-webhook-email-click.json
echo -e "\n\n"

echo "Testing EMAIL_REPLY..."
curl -X POST $BASE_URL -H "Content-Type: application/json" -d @test-webhook-email-reply.json
echo -e "\n\n"

echo "Testing LEAD_UNSUBSCRIBED..."
curl -X POST $BASE_URL -H "Content-Type: application/json" -d @test-webhook-unsubscribe.json
echo -e "\n\n"
```

Make it executable:
```bash
chmod +x test-all-events.sh
./test-all-events.sh
```

---

## Troubleshooting

### Issue: "Campaign not found"

**Solution**: 
1. Check that `campaign_id` in payload matches a `smartlead_campaign_id` in your database
2. Verify the campaign exists: `SELECT * FROM campaigns WHERE smartlead_campaign_id = '9181';`
3. Update test payload with correct `campaign_id`

### Issue: "Missing to_email"

**Solution**: 
- Lead-level events (EMAIL_SENT, EMAIL_OPEN, etc.) require `to_email` field
- Campaign-level events (CAMPAIGN_STATUS_CHANGE) don't need `to_email`
- Add `to_email` to your test payload

### Issue: ngrok connection refused

**Solution**:
1. Make sure Next.js dev server is running on port 3000
2. Check ngrok is forwarding to correct port: `ngrok http 3000`
3. Verify ngrok URL is accessible: `curl https://your-ngrok-url.ngrok.io`

### Issue: No logs appearing

**Solution**:
1. Check you're looking at the correct terminal (Next.js dev server, not ngrok)
2. Verify webhook endpoint is correct: `/api/webhooks/smartlead`
3. Check for errors in terminal (might be failing silently)

---

## Quick Reference

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start ngrok (if using)
ngrok http 3000

# Terminal 3: Send test webhook
curl -X POST http://localhost:3000/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d @test-webhook-email-sent.json
```

**Watch Terminal 1 (Next.js) for detailed logs!**

---

## Additional Resources

- [Smartlead Webhook API Reference](./SMARTLEAD_WEBHOOK_API_REFERENCE.md)
- [ngrok Documentation](https://ngrok.com/docs)
- [Smartlead API Docs](https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation)

