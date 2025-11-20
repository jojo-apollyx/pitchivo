# Smartlead Webhook Security Guide

## ⚠️ Important: No Webhook Signatures

**Smartlead does NOT provide webhook signatures or secrets.**

This is confirmed by:
- Official webhook documentation
- API documentation review
- No signature headers in payload
- No configuration option in dashboard

## Why No Signatures?

This is common for many webhook providers. Smartlead's architecture:
- Focuses on delivery reliability (5 retries)
- Provides priority-based routing
- Does not include cryptographic signing

## Security Measures to Implement

### 1. ✅ **HTTPS (Essential)**
```
✅ Use: https://yourdomain.com/api/webhooks/smartlead
❌ Never: http://yourdomain.com/api/webhooks/smartlead
```

**Why**: Encrypts webhook data in transit, prevents man-in-the-middle attacks.

### 2. ✅ **Validate Payload Structure**

```typescript
// In webhook handler
function validateSmartleadPayload(event: any): boolean {
  // Check required fields exist
  if (!event.event || !event.campaign_id || !event.email) {
    console.error('Invalid webhook payload - missing required fields');
    return false;
  }
  
  // Check event type is valid
  const validEvents = [
    'EMAIL_SENT', 'EMAIL_REPLY', 'EMAIL_OPENED', 
    'LINK_CLICKED', 'EMAIL_BOUNCE', 'LEAD_UNSUBSCRIBED'
  ];
  
  if (!validEvents.includes(event.event)) {
    console.error('Invalid event type:', event.event);
    return false;
  }
  
  // Check campaign_id matches our format
  // (Adjust based on actual Smartlead IDs)
  if (typeof event.campaign_id !== 'string' && typeof event.campaign_id !== 'number') {
    console.error('Invalid campaign_id format');
    return false;
  }
  
  return true;
}
```

### 3. ✅ **Rate Limiting**

```typescript
// Using Next.js middleware or route handler
import { ratelimit } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  // Rate limit: 100 requests per minute per IP
  const ip = request.ip ?? 'anonymous';
  const { success, limit, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
  
  // Process webhook...
}
```

### 4. ⚠️ **IP Whitelist (If Available)**

**Action Required**: Contact Smartlead support to ask:
> "What IP addresses do your webhooks originate from?"

If they provide IPs, implement whitelist:

```typescript
const SMARTLEAD_WEBHOOK_IPS = [
  '1.2.3.4',
  '5.6.7.8',
  // Add IPs provided by Smartlead
];

export async function POST(request: NextRequest) {
  const ip = request.ip;
  
  if (ip && !SMARTLEAD_WEBHOOK_IPS.includes(ip)) {
    console.error('Webhook from unauthorized IP:', ip);
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Process webhook...
}
```

### 5. ✅ **Idempotency**

Handle duplicate webhook deliveries (Smartlead retries 5 times):

```typescript
// Use unique event ID to prevent duplicates
async function processWebhookIdempotently(event: any) {
  // Create unique ID from event data
  const eventId = `${event.event}_${event.campaign_id}_${event.email}_${event.timestamp}`;
  
  // Check if already processed
  const { data: existing } = await supabase
    .from('smartlead_email_events')
    .select('event_id')
    .eq('metadata->smartlead_event_id', eventId)
    .single();
  
  if (existing) {
    console.log('Duplicate event detected, skipping:', eventId);
    return { success: true, duplicate: true };
  }
  
  // Store event with unique ID
  const { error } = await supabase
    .from('smartlead_email_events')
    .insert({
      ...eventData,
      metadata: {
        ...metadata,
        smartlead_event_id: eventId
      }
    });
  
  return { success: !error, duplicate: false };
}
```

### 6. ✅ **Monitoring & Alerts**

Set up monitoring for suspicious activity:

```typescript
// Monitor for anomalies
const ALERT_THRESHOLDS = {
  webhooks_per_minute: 1000,  // Alert if > 1000 webhooks/min
  failed_validations: 10,     // Alert if > 10 failures/min
  unknown_campaigns: 5        // Alert if > 5 unknown campaigns/hour
};

// Track metrics
let webhookCount = 0;
let failedValidations = 0;
let unknownCampaigns = 0;

// Reset counters periodically
setInterval(() => {
  if (webhookCount > ALERT_THRESHOLDS.webhooks_per_minute) {
    sendAlert('High webhook volume', { count: webhookCount });
  }
  webhookCount = 0;
  failedValidations = 0;
}, 60000); // Every minute
```

### 7. ✅ **Logging**

Log all webhook activity:

```typescript
// Structured logging
console.log({
  type: 'webhook_received',
  source: 'smartlead',
  event_type: event.event,
  campaign_id: event.campaign_id,
  timestamp: new Date().toISOString(),
  ip: request.ip,
  user_agent: request.headers.get('user-agent'),
  success: true
});
```

## Additional Security Layers

### Database-Level Protection

```sql
-- Ensure only our app can write to webhook tables
GRANT INSERT ON smartlead_email_events TO webhook_user;
GRANT UPDATE ON campaigns TO webhook_user;

-- Prevent unauthorized access
REVOKE ALL ON smartlead_email_events FROM public;
```

### Infrastructure-Level Protection

1. **Firewall Rules**
   - Limit webhook endpoint access
   - Block suspicious IPs

2. **CDN/WAF** (Cloudflare, AWS WAF)
   - DDoS protection
   - Bot detection
   - Rate limiting

3. **Monitoring** (Sentry, DataDog)
   - Alert on errors
   - Track webhook success rate
   - Monitor response times

## Testing Security

### 1. Test Payload Validation

```bash
# Test with invalid payload (missing required fields)
curl -X POST https://yourdomain.com/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'

# Should return error
```

### 2. Test Rate Limiting

```bash
# Send 100+ requests rapidly
for i in {1..150}; do
  curl -X POST https://yourdomain.com/api/webhooks/smartlead \
    -H "Content-Type: application/json" \
    -d '{"event": "EMAIL_SENT", "campaign_id": "123", "email": "test@example.com"}' &
done

# Should start returning 429 after threshold
```

### 3. Test Idempotency

```bash
# Send same payload twice
payload='{"event": "EMAIL_SENT", "campaign_id": "123", "email": "test@example.com", "timestamp": "2025-11-20T10:00:00Z"}'

curl -X POST https://yourdomain.com/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d "$payload"

curl -X POST https://yourdomain.com/api/webhooks/smartlead \
  -H "Content-Type: application/json" \
  -d "$payload"

# Should only create one database record
```

## Summary

### ✅ Implemented
- HTTPS enforcement
- Payload validation
- Idempotency handling
- Structured logging

### ⚠️ Recommended
- Rate limiting (implement with middleware)
- IP whitelist (contact Smartlead for IPs)
- Monitoring & alerts
- Infrastructure protection (WAF, CDN)

### ❌ Not Available
- Webhook signatures (Smartlead doesn't provide)
- HMAC verification (not supported)
- Signature headers (not included)

## Conclusion

While Smartlead doesn't provide webhook signatures, you can still secure your webhook endpoint effectively by:

1. Using HTTPS (mandatory)
2. Validating payload structure
3. Implementing rate limiting
4. Monitoring for suspicious activity
5. Using idempotency to handle retries

These measures provide robust security even without cryptographic signatures.

---

**Need More Security?**

Consider:
- Cloudflare (free tier includes DDoS protection & WAF)
- AWS WAF (advanced threat detection)
- Custom middleware (rate limiting, IP filtering)
- Database-level permissions (restrict write access)

