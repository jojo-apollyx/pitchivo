# Smartlead API Implementation Updates

## ✅ Updated Based on Official Documentation

Based on research of official Smartlead API documentation (https://api.smartlead.ai), the following updates have been made:

### 1. **API Authentication** ✅

**Official Method**: API key as query parameter

**Before** (Incorrect):
```typescript
headers: {
  'Authorization': `Bearer ${this.apiKey}`
}
```

**After** (Correct):
```typescript
const url = new URL(`${this.baseUrl}${endpoint}`);
url.searchParams.append('api_key', this.apiKey);
```

**Reference**: https://api.smartlead.ai/reference/authentication

### 2. **API Base URL** ✅

**Before** (Incorrect):
```typescript
baseUrl = 'https://api.smartlead.ai/api/v1'
```

**After** (Correct):
```typescript
baseUrl = 'https://server.smartlead.ai/api/v1'
```

### 3. **Webhook Event Types** ✅

**Official Event Types** (from Smartlead documentation):
- `EMAIL_SENT` - When an email is sent
- `EMAIL_REPLY` - When a lead replies  
- `EMAIL_OPENED` - When a lead opens an email
- `LINK_CLICKED` - When a lead clicks a link
- `EMAIL_BOUNCE` - When an email bounces
- `LEAD_UNSUBSCRIBED` - When a lead unsubscribes
- `LEAD_CATEGORY_UPDATED` - When lead category/status changes
- `THREADED_REPLIES` - For threaded conversation replies
- `CAMPAIGN_STATUS_CHANGE` - When campaign status changes
- `UNTRACKED_REPLIES` - Replies that aren't tracked
- `MANUAL_STEP_REACHED` - When manual step is reached in sequence

**Updated Mapping**:
```typescript
const EVENT_TYPE_MAPPING: Record<string, string> = {
  'EMAIL_SENT': 'sent',
  'EMAIL_OPENED': 'opened',
  'LINK_CLICKED': 'clicked',
  'EMAIL_BOUNCE': 'bounced',
  'EMAIL_REPLY': 'replied',
  'LEAD_UNSUBSCRIBED': 'unsubscribed',
};
```

**Reference**: https://help.outboundsync.com/articles/643692-smartlead-webhook-guide

### 4. **Webhook Payload Structure** ✅

**Expected Fields** (based on documentation):
```typescript
{
  event: 'EMAIL_SENT' | 'EMAIL_REPLY' | 'EMAIL_OPENED' | etc,
  campaign_id: string | number,
  email: string, // lead email
  lead_id: string | number,
  email_account: string, // sending email account
  message_id: string,
  timestamp: string,
  // Additional fields per event type
  link?: string, // for LINK_CLICKED
  reply_body?: string, // for EMAIL_REPLY
  reply_subject?: string, // for EMAIL_REPLY
  bounce_reason?: string, // for EMAIL_BOUNCE
  bounce_type?: string // for EMAIL_BOUNCE
}
```

### 5. **Webhook Retry Logic** ✅

**Official Behavior**:
- Retries: Up to 5 times
- Interval: 300 seconds (5 minutes) between attempts
- Date: As of February 20, 2025

**Implementation**: No code changes needed (handled by Smartlead)

**Reference**: https://help.outboundsync.com/articles/643692-smartlead-webhook-guide

### 6. **Webhook Priority Levels** ✅

**Official Priority Algorithm**:
1. **P1 (Highest)**: User Level - Applies to all activities
2. **P2**: Client Level - Applies to specific client
3. **P3 (Lowest)**: Campaign Level - Applies to specific campaign

**Note**: If User Level webhook exists, it overrides Client and Campaign webhooks.

**Implementation**: Configure at User Level in Smartlead dashboard for our use case.

### 7. **Campaign Status Values** ✅

**Updated to match Smartlead**:
```typescript
status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'STOPPED'
```

---

## Configuration Steps

### 1. Get API Key
1. Log into Smartlead dashboard
2. Navigate to Settings
3. Click "Activate API"
4. Copy API key
5. Add to environment: `SMARTLEAD_API_KEY=your_key_here`

### 2. Configure Webhook
1. Log into Smartlead dashboard
2. Navigate to Settings → Webhooks
3. Click "Add Webhook"
4. **Level**: Choose "User Level" (highest priority)
5. **URL**: `https://yourdomain.com/api/webhooks/smartlead`
6. **Events**: Select all:
   - EMAIL_SENT
   - EMAIL_REPLY
   - EMAIL_OPENED
   - LINK_CLICKED
   - EMAIL_BOUNCE
   - LEAD_UNSUBSCRIBED
   - THREADED_REPLIES
7. Save configuration

### 3. Test Webhook
1. Use Smartlead's "Test Webhook" function in dashboard
2. Verify payload received at your endpoint
3. Check database for event insertion
4. Verify campaign metrics updated

---

## Files Updated

### `/apps/web/lib/smartlead/client.ts`
- ✅ Changed authentication to query parameter
- ✅ Updated base URL to `server.smartlead.ai`
- ✅ Added URL construction with API key

### `/apps/web/lib/smartlead/types.ts`
- ✅ Updated campaign status enum
- ✅ Added documentation references

### `/apps/web/app/api/webhooks/smartlead/route.ts`
- ✅ Updated event type constants
- ✅ Added event type mapping
- ✅ Updated payload destructuring
- ✅ Added documentation comments
- ✅ Fixed variable naming consistency

---

## Webhook Payload Examples

### EMAIL_SENT
```json
{
  "event": "EMAIL_SENT",
  "campaign_id": "123",
  "email": "john@acme.com",
  "lead_id": "456",
  "email_account": "sales@yourcompany.com",
  "message_id": "msg_789",
  "timestamp": "2025-11-20T10:00:00Z"
}
```

### EMAIL_REPLY
```json
{
  "event": "EMAIL_REPLY",
  "campaign_id": "123",
  "email": "john@acme.com",
  "lead_id": "456",
  "reply_body": "I'm interested in your product...",
  "reply_subject": "Re: Your email",
  "message_id": "msg_789",
  "timestamp": "2025-11-20T10:30:00Z"
}
```

### LINK_CLICKED
```json
{
  "event": "LINK_CLICKED",
  "campaign_id": "123",
  "email": "john@acme.com",
  "lead_id": "456",
  "link": "https://yourcompany.com/product",
  "message_id": "msg_789",
  "timestamp": "2025-11-20T10:15:00Z"
}
```

### EMAIL_BOUNCE
```json
{
  "event": "EMAIL_BOUNCE",
  "campaign_id": "123",
  "email": "invalid@example.com",
  "lead_id": "456",
  "bounce_type": "hard",
  "bounce_reason": "Mailbox does not exist",
  "message_id": "msg_789",
  "timestamp": "2025-11-20T10:05:00Z"
}
```

---

## Testing Checklist

- [ ] API key configured in environment
- [ ] Webhook URL configured in Smartlead dashboard
- [ ] Webhook events selected (all relevant types)
- [ ] Webhook level set to "User Level"
- [ ] Test webhook sent from Smartlead dashboard
- [ ] Webhook received at endpoint
- [ ] Event inserted into `smartlead_email_events` table
- [ ] Campaign metrics updated correctly
- [ ] Lead status updated (if applicable)
- [ ] Reply stored in `campaign_replies` (for EMAIL_REPLY)
- [ ] Test with real campaign send
- [ ] Verify UI displays events correctly

---

## Important Notes

### Webhook Security
- Currently no webhook signature verification implemented
- Smartlead documentation doesn't mention webhook signatures
- Consider adding IP whitelist or custom secret header
- Monitor webhook endpoint for abuse

### Payload Variations
- Actual payload structure may vary slightly
- Test with real webhooks and adjust field names if needed
- Store `original_event_type` in metadata for debugging
- Log full payload initially to verify structure

### Error Handling
- Smartlead retries 5 times with 5-minute intervals
- Return 200 OK even if internal processing fails to avoid retries
- Log errors for manual review
- Implement idempotency to handle duplicate events

---

## Next Steps

1. **Test with Real API Key**
   - Get actual API key from Smartlead
   - Test API endpoints (create campaign, add leads)
   - Verify API responses match expectations

2. **Configure Production Webhook**
   - Set up webhook in Smartlead dashboard
   - Use production URL
   - Select appropriate events

3. **Monitor Initial Events**
   - Watch logs for first real webhooks
   - Verify payload structure matches expectations
   - Adjust code if field names differ

4. **Implement Additional Endpoints**
   - Based on actual API responses
   - Add pagination support if needed
   - Handle rate limits

---

## References

- **Smartlead API Docs**: https://api.smartlead.ai
- **Authentication**: https://api.smartlead.ai/reference/authentication
- **Webhook Guide**: https://help.outboundsync.com/articles/643692-smartlead-webhook-guide
- **Smartlead Blog**: https://www.smartlead.ai/blog/what-is-a-webhook-and-how-it-works

---

**Status**: ✅ **Implementation Updated to Match Official Documentation**

All changes are based on official Smartlead documentation as of November 2025. Minor adjustments may be needed after testing with real API key and webhook events.

