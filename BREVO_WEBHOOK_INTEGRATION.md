# Brevo Email Tracking Integration Guide

## 🎯 Overview

This guide explains how to integrate Brevo (formerly Sendinblue) webhooks to track email metrics in real-time and automatically update campaign performance dashboards.

## 📊 Tracked Metrics

The integration tracks the following metrics automatically:

1. **Emails Delivered** - Email successfully delivered to recipient's server
2. **Emails Opened** - Recipient opened the email
3. **Emails Clicked** - Recipient clicked a link in the email
4. **Emails Bounced** - Email bounced (soft or hard)
5. **Open Rate** - Percentage of delivered emails that were opened
6. **Click Rate** - Percentage of delivered emails that were clicked

## 🔧 Setup Instructions

### Step 1: Create Webhook in Brevo

1. **Log in to Brevo**: Go to https://app.brevo.com

2. **Navigate to Webhooks**:
   - Click on Settings (⚙️ icon in top right)
   - Select "Transactional" from the sidebar
   - Click on "Webhooks" tab
   - Or visit directly: https://app.brevo.com/settings/transactional-webhooks

3. **Create New Webhook**:
   - Click "Add a new webhook" button
   - Enter webhook details:
     - **Name**: Pitchivo Campaign Tracking
     - **URL**: `https://your-domain.com/api/webhooks/brevo`
     - **Description**: Real-time campaign metrics tracking

4. **Select Events to Track**:
   Check these events:
   - ✅ **delivered** - Email delivered successfully
   - ✅ **opened** / **unique_opened** - Email was opened
   - ✅ **click** / **unique_clicked** - Link was clicked
   - ✅ **soft_bounce** - Temporary delivery failure
   - ✅ **hard_bounce** - Permanent delivery failure
   - ✅ **invalid_email** - Email address is invalid
   - ⚠️ **spam** - Marked as spam (optional)
   - ⚠️ **blocked** - Email blocked (optional)

5. **Save Webhook**:
   - Click "Save"
   - Brevo will test the endpoint (it should return 200 OK)

### Step 2: Verify Webhook is Active

1. In the webhooks list, you should see:
   - Status: ✅ Active
   - Your webhook URL
   - Number of events selected

2. Test the webhook:
   ```bash
   curl https://your-domain.com/api/webhooks/brevo
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Brevo webhook endpoint is active",
     "events": [
       "delivered",
       "opened",
       "clicked",
       "soft_bounce",
       "hard_bounce",
       "spam",
       "blocked"
     ]
   }
   ```

### Step 3: Configure Campaign Emails

When sending emails via the admin panel, make sure to include campaign tags. This is automatically handled in the implementation:

```typescript
// In apps/web/app/api/admin/campaigns/send/route.ts
await sendEmail({
  to: recipientEmail,
  subject: emailSubject,
  html: htmlContent,
  text: textContent,
  tags: [`campaign_${campaignId}`]  // ← This is crucial for tracking
})
```

The `campaign_` prefix is required for the webhook to identify which campaign the event belongs to.

## 📡 How It Works

### 1. Email Sending Flow

```
Admin sends email
     ↓
Email API adds campaign tag
     ↓
Brevo sends email
     ↓
Email delivered to recipient
     ↓
Brevo triggers webhook event
```

### 2. Webhook Event Flow

```
Recipient opens email
     ↓
Brevo detects "opened" event
     ↓
Brevo sends POST to /api/webhooks/brevo
     ↓
Webhook extracts campaign_id from tag
     ↓
Webhook updates campaign metrics in database
     ↓
Dashboard shows updated metrics instantly
```

### 3. Event Processing

**Webhook Endpoint**: `/api/webhooks/brevo`

**Event Payload Example**:
```json
{
  "event": "opened",
  "email": "buyer@vitalproteins.com",
  "id": 12345,
  "date": "2024-01-15 10:30:00",
  "ts": 1705318200,
  "message-id": "<abc123@brevo.com>",
  "tag": "campaign_550e8400-e29b-41d4-a716-446655440000",
  "subject": "Premium Collagen Peptides Available"
}
```

**Event Processing**:
1. Extract `campaign_id` from `tag` field
2. Query campaign from database
3. Increment appropriate metric counter
4. Create activity record
5. Return success response

## 🎨 Dashboard Integration

### Real-Time Metrics Display

The campaign performance dashboard automatically displays:

```
┌─────────────────────────────────────────┐
│  Campaign: Collagen Peptide Launch      │
│  Status: Active                          │
├─────────────────────────────────────────┤
│  Progress: 245 / 500 sent (49%)         │
│  ████████████░░░░░░░░░░░░                │
├─────────────────────────────────────────┤
│  📧 Opens:    48%  (118 / 245)          │
│  🖱️  Clicks:   17%  (42 / 245)           │
│  💬 RFQs:     12   conversions           │
│  👥 Reached:  245  contacts              │
└─────────────────────────────────────────┘
```

### Metrics Calculation

```typescript
// Open Rate
const openRate = emails_sent > 0 
  ? Math.round((emails_opened / emails_sent) * 100) 
  : 0

// Click Rate
const clickRate = emails_sent > 0
  ? Math.round((emails_clicked / emails_sent) * 100)
  : 0

// Bounce Rate
const bounceRate = emails_sent > 0
  ? Math.round((emails_bounced / emails_sent) * 100)
  : 0
```

## 🔍 Event Types Reference

### delivered
**Triggered**: When email is successfully delivered to recipient's mail server  
**Updates**: `emails_delivered` counter  
**Webhook Field**: `event: "delivered"`

### opened / unique_opened
**Triggered**: When recipient opens the email  
**Updates**: `emails_opened` counter  
**Creates Activity**: `email_opened`  
**Webhook Field**: `event: "opened"` or `event: "unique_opened"`  
**Note**: `unique_opened` only triggers once per recipient

### click / unique_clicked
**Triggered**: When recipient clicks a link in email  
**Updates**: `emails_clicked` counter  
**Creates Activity**: `email_clicked`  
**Webhook Field**: `event: "click"` or `event: "unique_clicked"`  
**Note**: `unique_clicked` only triggers once per recipient per link

### soft_bounce
**Triggered**: Temporary delivery failure (mailbox full, server down)  
**Updates**: `emails_bounced` counter  
**Creates Activity**: `email_bounced`  
**Webhook Field**: `event: "soft_bounce"`  
**Action**: Brevo will retry delivery

### hard_bounce
**Triggered**: Permanent delivery failure (invalid email, domain doesn't exist)  
**Updates**: `emails_bounced` counter  
**Creates Activity**: `email_bounced`  
**Webhook Field**: `event: "hard_bounce"`  
**Action**: Email address is automatically blacklisted

### invalid_email
**Triggered**: Email address format is invalid  
**Updates**: `emails_bounced` counter  
**Webhook Field**: `event: "invalid_email"`

## 🐛 Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook status in Brevo**:
   - Go to Webhooks settings
   - Verify status is "Active"
   - Check "Last activity" timestamp

2. **Verify URL is accessible**:
   ```bash
   curl -X POST https://your-domain.com/api/webhooks/brevo \
     -H "Content-Type: application/json" \
     -d '{"event":"delivered","email":"test@test.com","tag":"campaign_test"}'
   ```

3. **Check server logs**:
   - Look for "Brevo webhook received" logs
   - Check for parsing errors
   - Verify campaign_id extraction

### Metrics Not Updating

1. **Verify campaign tag is set**:
   - Check email sending code includes `tags: ["campaign_{id}"]`
   - Tag format must be exactly: `campaign_` + campaign UUID

2. **Check database permissions**:
   - Webhook uses admin Supabase client
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment

3. **Inspect webhook logs**:
   ```typescript
   console.log('Brevo webhook received:', JSON.stringify(body, null, 2))
   ```

### Duplicate Events

Brevo may send duplicate webhook events. The implementation handles this by:
- Using increment operations (always adds to current value)
- Logging all events for audit trail
- Not throwing errors on duplicates

## 🔐 Security Considerations

### Webhook Authentication

While Brevo doesn't include HMAC signatures by default, you can:

1. **Use secret URL path**:
   ```
   https://your-domain.com/api/webhooks/brevo-2k4j3h2k4j3h
   ```

2. **Verify IP whitelist** (Brevo's IPs):
   - Add IP validation in webhook handler
   - Check `request.headers.get('x-forwarded-for')`

3. **Use API key header** (if supported):
   ```typescript
   const apiKey = request.headers.get('x-brevo-api-key')
   if (apiKey !== process.env.BREVO_WEBHOOK_KEY) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   }
   ```

### Rate Limiting

Implement rate limiting to prevent abuse:
```typescript
// Limit to 1000 webhook events per minute
const rateLimit = new Map<string, number>()
```

## 📈 Advanced Features

### Activity Feed

Real-time activity is stored in `campaign_activities` table:

```sql
SELECT 
  activity_type,
  contact_email,
  buyer_company,
  created_at,
  metadata
FROM campaign_activities
WHERE campaign_id = '...'
ORDER BY created_at DESC
LIMIT 50;
```

### Custom Event Tracking

Add custom events to webhook handler:

```typescript
case 'spam':
  // Track spam complaints
  updates.spam_reports = (campaign.spam_reports || 0) + 1
  break

case 'unsubscribe':
  // Track unsubscribes
  updates.unsubscribes = (campaign.unsubscribes || 0) + 1
  break
```

### Email Client Tracking

Extract email client from webhook:

```json
{
  "event": "opened",
  "email": "buyer@company.com",
  "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0...)",
  "device": "mobile"
}
```

## 🎯 Testing Guide

### 1. Test Webhook Endpoint

```bash
# Test GET (verification)
curl https://your-domain.com/api/webhooks/brevo

# Test POST (event)
curl -X POST https://your-domain.com/api/webhooks/brevo \
  -H "Content-Type: application/json" \
  -d '{
    "event": "opened",
    "email": "test@test.com",
    "tag": "campaign_550e8400-e29b-41d4-a716-446655440000",
    "ts": 1705318200
  }'
```

### 2. Send Test Email

1. Go to `/admin/campaigns`
2. Select a campaign
3. Send email to your own address
4. Open the email
5. Click a link
6. Check dashboard for updated metrics

### 3. Monitor Logs

```bash
# Watch webhook logs
tail -f logs/webhook.log | grep "Brevo webhook"

# Check campaign updates
tail -f logs/campaign.log | grep "Campaign .* updated"
```

## 📚 Additional Resources

- **Brevo Webhooks Documentation**: https://developers.brevo.com/docs/transactional-webhooks
- **Brevo API Reference**: https://developers.brevo.com/reference
- **Event Types**: https://developers.brevo.com/docs/event-types
- **Testing Webhooks**: https://developers.brevo.com/docs/testing-webhooks

## ✅ Implementation Checklist

- [ ] Create webhook in Brevo dashboard
- [ ] Select all tracking events (delivered, opened, clicked, bounced)
- [ ] Verify webhook URL is accessible
- [ ] Test webhook with GET request
- [ ] Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Send test email with campaign tag
- [ ] Verify metrics update in dashboard
- [ ] Check activity feed shows events
- [ ] Monitor webhook logs for errors
- [ ] Set up error alerting (optional)

## 🎉 Summary

With Brevo webhook integration:
- ✅ Real-time metric tracking (delivered, opened, clicked, bounced)
- ✅ Automatic campaign performance updates
- ✅ Activity feed with buyer interactions
- ✅ No manual updates required
- ✅ Production-ready implementation
- ✅ Error handling and logging
- ✅ Security considerations included

Your campaign dashboard now updates automatically as recipients interact with your emails!

