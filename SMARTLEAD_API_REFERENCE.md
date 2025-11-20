# Smartlead API Technical Reference

## Base Configuration

**Base URL:** `https://server.smartlead.ai/api/v1`

**Authentication:** API key as query parameter `?api_key=YOUR_API_KEY`

**Rate Limit:** 10 requests per 2 seconds

**Get API Key:** Settings → Profile → "Activate API" button

---

## 1. CAMPAIGNS

### 1.1 Get All Campaigns
**GET** `/campaigns`

Fetches all campaigns in your account.

```bash
curl https://server.smartlead.ai/api/v1/campaigns?api_key=API_KEY
```

**Response:**
```json
[{
  "id": 372,
  "user_id": 124,
  "status": "ACTIVE",
  "name": "My Epic Campaign",
  "track_settings": "DONT_REPLY_TO_AN_EMAIL",
  "scheduler_cron_value": "{ tz: 'Australia/Sydney', days: [ 1, 2, 3, 4, 5 ], endHour: '23:00', startHour: '10:00' }",
  "min_time_btwn_emails": 10,
  "max_leads_per_day": 10,
  "stop_lead_settings": "REPLY_TO_AN_EMAIL",
  "client_id": 23
}]
```

### 1.2 Get Campaign by ID
**GET** `/campaigns/{campaign_id}`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372?api_key=API_KEY
```

### 1.3 Create Campaign
**POST** `/campaigns/create`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/create?api_key=API_KEY \
  -d '{ "name": "Test email campaign", "client_id": 22 }'
```

**Response:**
```json
{
  "ok": true,
  "id": 3023,
  "name": "Test email campaign",
  "created_at": "2022-11-07T16:23:24.025929+00:00"
}
```

### 1.4 Delete Campaign
**DELETE** `/campaigns/{campaign_id}`

```bash
curl -X DELETE https://server.smartlead.ai/api/v1/campaigns/372?api_key=API_KEY
```

**Response:**
```json
{ "ok": true }
```

### 1.5 Update Campaign Schedule
**POST** `/campaigns/{campaign_id}/schedule`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/schedule?api_key=API_KEY \
  -d '{
    "timezone": "America/Los_Angeles",
    "days_of_the_week": [1, 2, 3, 4, 5],
    "start_hour": "09:00",
    "end_hour": "18:00",
    "min_time_btw_emails": 10,
    "max_new_leads_per_day": 20,
    "schedule_start_time": "2023-04-25T07:29:25.978Z"
  }'
```

**Parameters:**
- `timezone`: See timezone list in docs
- `days_of_the_week`: Array [0-6] where 0=Sunday
- `start_hour`, `end_hour`: Format "HH:MM"
- `min_time_btw_emails`: Minutes between emails
- `max_new_leads_per_day`: Maximum new leads per day
- `schedule_start_time`: ISO 8601 format

### 1.6 Update Campaign Settings
**POST** `/campaigns/{campaign_id}/settings`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/settings?api_key=API_KEY \
  -d '{
    "track_settings": ["DONT_TRACK_EMAIL_OPEN"],
    "stop_lead_settings": "REPLY_TO_AN_EMAIL",
    "unsubscribe_text": "Unsubscribe",
    "send_as_plain_text": false,
    "follow_up_percentage": 40,
    "client_id": 33,
    "enable_ai_esp_matching": true
  }'
```

**Options:**
- `track_settings`: DONT_TRACK_EMAIL_OPEN | DONT_TRACK_LINK_CLICK | DONT_TRACK_REPLY_TO_AN_EMAIL
- `stop_lead_settings`: REPLY_TO_AN_EMAIL | CLICK_ON_A_LINK | OPEN_AN_EMAIL
- `follow_up_percentage`: 0-100

### 1.7 Change Campaign Status
**POST** `/campaigns/{campaign_id}/status`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/status?api_key=API_KEY \
  -d '{ "status": "PAUSED" }'
```

**Status Options:** PAUSED | STOPPED | START

### 1.8 Get Campaign Analytics
**GET** `/campaigns/{campaign_id}/analytics`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/analytics?api_key=API_KEY
```

**Response:**
```json
{
  "id": 979,
  "status": "COMPLETED",
  "sent_count": "14",
  "open_count": "14",
  "click_count": "0",
  "reply_count": "4",
  "bounce_count": "0",
  "unsubscribed_count": "0",
  "unique_open_count": "7",
  "unique_click_count": "8",
  "campaign_lead_stats": {
    "total": 8,
    "blocked": 0,
    "stopped": 0,
    "completed": 8,
    "inprogress": 0,
    "notStarted": 0
  }
}
```

### 1.9 Get Analytics by Date Range
**GET** `/campaigns/{campaign_id}/analytics-by-date`

```bash
curl "https://server.smartlead.ai/api/v1/campaigns/3745/analytics-by-date?api_key=API_KEY&start_date=2022-12-16&end_date=2022-12-23"
```

**Note:** Maximum 30-day range

---

## 2. CAMPAIGN SEQUENCES

### 2.1 Get Campaign Sequences
**GET** `/campaigns/{campaign_id}/sequences`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/sequences?api_key=API_KEY
```

**Response:**
```json
{
  "id": 8494,
  "email_campaign_id": 3070,
  "seq_number": 1,
  "subject": "Subject Line",
  "email_body": "<p>Email content</p>",
  "sequence_variants": [
    {
      "id": 2535,
      "subject": "Subject A",
      "email_body": "<p>Variant A content</p>",
      "variant_label": "A"
    }
  ]
}
```

### 2.2 Save Campaign Sequences
**POST** `/campaigns/{campaign_id}/sequences`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/sequences?api_key=API_KEY \
  -d '{
    "sequences": [
      {
        "seq_number": 1,
        "seq_delay_details": { "delay_in_days": 1 },
        "seq_variants": [
          {
            "subject": "First Email",
            "email_body": "<p>Hi there</p>",
            "variant_label": "A"
          }
        ]
      },
      {
        "seq_number": 2,
        "seq_delay_details": { "delay_in_days": 2 },
        "subject": "",
        "email_body": "<p>Follow up</p>"
      }
    ]
  }'
```

**Note:** Blank subject makes follow-up in same thread. Include `id` field when updating existing sequences.

---

## 3. EMAIL ACCOUNTS

### 3.1 Get All Email Accounts
**GET** `/email-accounts/`

```bash
curl "https://server.smartlead.ai/api/v1/email-accounts/?api_key=API_KEY&offset=0&limit=10"
```

**Parameters:**
- `offset`: Default 0
- `limit`: Default 100, max 100

**Response:**
```json
[{
  "id": 24,
  "from_name": "John Doe",
  "from_email": "[email protected]",
  "smtp_host": "smtp.gmail.com",
  "smtp_port": 465,
  "message_per_day": 100,
  "type": "GMAIL",
  "daily_sent_count": 48,
  "is_smtp_success": true,
  "warmup_details": {
    "status": "ACTIVE",
    "warmup_reputation": "100%"
  }
}]
```

### 3.2 Get Email Account by ID
**GET** `/email-accounts/{account_id}`

```bash
curl https://server.smartlead.ai/api/v1/email-accounts/24?api_key=API_KEY
```

### 3.3 Create/Update Email Account
**POST** `/email-accounts/save`

```bash
curl -X POST https://server.smartlead.ai/api/v1/email-accounts/save?api_key=API_KEY \
  -d '{
    "id": null,
    "from_name": "John Doe",
    "from_email": "[email protected]",
    "user_name": "[email protected]",
    "password": "app_password",
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 465,
    "imap_host": "imap.gmail.com",
    "imap_port": 993,
    "max_email_per_day": 100,
    "warmup_enabled": true,
    "client_id": null
  }'
```

**Response:**
```json
{
  "ok": true,
  "message": "Email account added/updated successfully!",
  "emailAccountId": 2849,
  "warmupKey": "apple-keyes"
}
```

**Errors:**
- `ACCOUNT_ALREADY_EXIST`: Email already in use
- `ACCOUNT_NOT_FOUND`: Invalid account ID
- `ACCOUNT_VERIFICATION_FAILED`: Invalid credentials

### 3.4 Update Email Account Settings
**POST** `/email-accounts/{email_account_id}`

```bash
curl -X POST https://server.smartlead.ai/api/v1/email-accounts/24?api_key=API_KEY \
  -d '{
    "max_email_per_day": 100,
    "custom_tracking_url": "",
    "bcc": "[email protected]",
    "signature": "Best regards,<br>John",
    "time_to_wait_in_mins": 3
  }'
```

### 3.5 Update Warmup Settings
**POST** `/email-accounts/{email_account_id}/warmup`

```bash
curl -X POST https://server.smartlead.ai/api/v1/email-accounts/24/warmup?api_key=API_KEY \
  -d '{
    "warmup_enabled": true,
    "total_warmup_per_day": 35,
    "daily_rampup": 2,
    "reply_rate_percentage": 38,
    "warmup_key_id": "custom-key"
  }'
```

### 3.6 Get Warmup Stats (Last 7 Days)
**GET** `/email-accounts/{email_account_id}/warmup-stats`

```bash
curl https://server.smartlead.ai/api/v1/email-accounts/24/warmup-stats?api_key=API_KEY
```

### 3.7 Add Email Account to Campaign
**POST** `/campaigns/{campaign_id}/email-accounts`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/email-accounts?api_key=API_KEY \
  -d '{ "email_account_ids": [2907, 2908] }'
```

### 3.8 Remove Email Account from Campaign
**DELETE** `/campaigns/{campaign_id}/email-accounts`

```bash
curl -X DELETE https://server.smartlead.ai/api/v1/campaigns/372/email-accounts?api_key=API_KEY \
  -d '{ "email_account_ids": [2907] }'
```

### 3.9 Get Campaign Email Accounts
**GET** `/campaigns/{campaign_id}/email-accounts`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/email-accounts?api_key=API_KEY
```

### 3.10 Bulk Reconnect Failed Accounts
**POST** `/email-accounts/reconnect-failed-email-accounts`

Rate limited to 3 times per 24 hours.

```bash
curl -X POST https://server.smartlead.ai/api/v1/email-accounts/reconnect-failed-email-accounts?api_key=API_KEY \
  -d '{}'
```

---

## 4. LEADS

### 4.1 Get Campaign Leads
**GET** `/campaigns/{campaign_id}/leads`

```bash
curl "https://server.smartlead.ai/api/v1/campaigns/372/leads?api_key=API_KEY&offset=0&limit=100"
```

**Response:**
```json
{
  "total_leads": 823,
  "offset": 0,
  "limit": 100,
  "data": [{
    "campaign_lead_map_id": 23,
    "status": "SENT",
    "lead": {
      "id": 423,
      "first_name": "John",
      "last_name": "Doe",
      "email": "[email protected]",
      "phone_number": "1234567890",
      "company_name": "Company Inc",
      "custom_fields": { "Title": "CEO" },
      "is_unsubscribed": false
    }
  }]
}
```

**Lead Statuses:**
- `STARTED`: Scheduled, not sent yet
- `INPROGRESS`: Received at least one email
- `COMPLETED`: Received all emails
- `BLOCKED`: Email bounced or in block list

### 4.2 Get Lead by Email
**GET** `/leads/`

```bash
curl "https://server.smartlead.ai/api/v1/leads/?api_key=API_KEY&email=john@example.com"
```

### 4.3 Get Lead's Campaigns
**GET** `/leads/{lead_id}/campaigns`

```bash
curl https://server.smartlead.ai/api/v1/leads/423/campaigns?api_key=API_KEY
```

### 4.4 Add Leads to Campaign
**POST** `/campaigns/{campaign_id}/leads`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads?api_key=API_KEY \
  -d '{
    "lead_list": [
      {
        "first_name": "John",
        "last_name": "Doe",
        "email": "[email protected]",
        "phone_number": "1234567890",
        "company_name": "Company Inc",
        "website": "example.com",
        "location": "New York",
        "custom_fields": {
          "Title": "CEO",
          "First_Line": "Loved your recent post"
        },
        "linkedin_profile": "https://linkedin.com/in/johndoe",
        "company_url": "example.com"
      }
    ],
    "settings": {
      "ignore_global_block_list": false,
      "ignore_unsubscribe_list": false,
      "ignore_duplicate_leads_in_other_campaign": false
    }
  }'
```

**Limits:** Max 100 leads per request, max 20 custom fields

**Response:**
```json
{
  "ok": true,
  "upload_count": 95,
  "total_leads": 100,
  "already_added_to_campaign": 3,
  "duplicate_count": 2,
  "invalid_email_count": 0,
  "unsubscribed_leads": 0
}
```

### 4.5 Update Lead
**POST** `/campaigns/{campaign_id}/leads/{lead_id}`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads/423?api_key=API_KEY \
  -d '{
    "first_name": "Jane",
    "custom_fields": { "Title": "CTO" }
  }'
```

### 4.6 Delete Lead from Campaign
**DELETE** `/campaigns/{campaign_id}/leads/{lead_id}`

```bash
curl -X DELETE https://server.smartlead.ai/api/v1/campaigns/372/leads/423?api_key=API_KEY
```

### 4.7 Pause Lead
**POST** `/campaigns/{campaign_id}/leads/{lead_id}/pause`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads/423/pause?api_key=API_KEY
```

### 4.8 Resume Lead
**POST** `/campaigns/{campaign_id}/leads/{lead_id}/resume`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads/423/resume?api_key=API_KEY \
  -d '{ "resume_lead_with_delay_days": 10 }'
```

**Note:** `resume_lead_with_delay_days` can be null (defaults to 0)

### 4.9 Unsubscribe Lead from Campaign
**POST** `/campaigns/{campaign_id}/leads/{lead_id}/unsubscribe`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads/423/unsubscribe?api_key=API_KEY
```

### 4.10 Unsubscribe Lead Globally
**POST** `/leads/{lead_id}/unsubscribe`

Unsubscribes from all campaigns and prevents future additions.

```bash
curl -X POST https://server.smartlead.ai/api/v1/leads/423/unsubscribe?api_key=API_KEY
```

### 4.11 Update Lead Category
**POST** `/campaigns/{campaign_id}/leads/{lead_id}/category`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/leads/423/category?api_key=API_KEY \
  -d '{
    "category_id": 143,
    "pause_lead": true
  }'
```

### 4.12 Add to Global Block List
**POST** `/leads/add-domain-block-list`

```bash
curl -X POST https://server.smartlead.ai/api/v1/leads/add-domain-block-list?api_key=API_KEY \
  -d '{
    "domain_block_list": ["[email protected]", "spam-domain.com"],
    "client_id": null
  }'
```

### 4.13 Export Campaign Leads (CSV)
**GET** `/campaigns/{campaign_id}/leads-export`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/leads-export?api_key=API_KEY > leads.csv
```

Returns CSV with columns: id, campaign_lead_map_id, status, created_at, first_name, last_name, email, phone_number, company_name, website, location, custom_fields, linkedin_profile, company_url, is_unsubscribed, last_email_sequence_sent, is_interested, open_count, click_count, reply_count

---

## 5. CATEGORIES

### 5.1 Get All Categories
**GET** `/leads/fetch-categories`

```bash
curl https://server.smartlead.ai/api/v1/leads/fetch-categories?api_key=API_KEY
```

**Response:**
```json
[
  { "id": 1, "name": "Interested" },
  { "id": 2, "name": "Meeting Request" },
  { "id": 3, "name": "Not Interested" },
  { "id": 4, "name": "Do Not Contact" },
  { "id": 5, "name": "Information Request" },
  { "id": 6, "name": "Out Of Office" },
  { "id": 7, "name": "Wrong Person" }
]
```

---

## 6. STATISTICS & MESSAGE HISTORY

### 6.1 Get Campaign Statistics
**GET** `/campaigns/{campaign_id}/statistics`

```bash
curl "https://server.smartlead.ai/api/v1/campaigns/372/statistics?api_key=API_KEY&offset=0&limit=100"
```

**Optional Filters:**
- `email_sequence_number`: 1, 2, 3, etc.
- `email_status`: opened | clicked | replied | unsubscribed | bounced

**Response:**
```json
{
  "total_stats": "419",
  "offset": 0,
  "limit": 100,
  "data": [{
    "lead_name": "John Doe",
    "lead_email": "[email protected]",
    "lead_category": null,
    "sequence_number": 1,
    "email_subject": "Subject Line",
    "sent_time": "2022-08-02T12:49:11.747Z",
    "open_time": null,
    "open_count": 0,
    "click_count": 0,
    "is_unsubscribed": false,
    "is_bounced": false
  }]
}
```

### 6.2 Get Lead Message History
**GET** `/campaigns/{campaign_id}/leads/{lead_id}/message-history`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/leads/423/message-history?api_key=API_KEY
```

**Response:**
```json
{
  "from": "[email protected]",
  "to": "[email protected]",
  "history": [
    {
      "type": "SENT",
      "message_id": "<abc@mail.gmail.com>",
      "stats_id": "uuid-here",
      "time": "2023-03-13T07:44:12.978Z",
      "email_body": "<div>Email content</div>",
      "subject": "Subject line"
    },
    {
      "type": "REPLY",
      "message_id": "<xyz@mail.gmail.com>",
      "time": "2023-03-15T09:13:29.000Z",
      "email_body": "<p>Reply content</p>"
    }
  ]
}
```

### 6.3 Reply to Email Thread
**POST** `/campaigns/{campaign_id}/reply-email-thread`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/reply-email-thread?api_key=API_KEY \
  -d '{
    "email_stats_id": "a739fed0-c965-47e3-8f36-3e6d2805acec",
    "email_body": "Thanks for your response!",
    "reply_message_id": "<CAAfSCXm@mail.gmail.com>",
    "reply_email_time": "2023-06-19T08:10:35.000Z",
    "reply_email_body": "<html>Original message</html>",
    "cc": "[email protected]",
    "bcc": "[email protected]",
    "add_signature": true
  }'
```

**Note:** Get `email_stats_id`, `reply_message_id`, `reply_email_time`, and `reply_email_body` from message-history API.

---

## 7. WEBHOOKS

### 7.1 Get Campaign Webhooks
**GET** `/campaigns/{campaign_id}/webhooks`

```bash
curl https://server.smartlead.ai/api/v1/campaigns/372/webhooks?api_key=API_KEY
```

**Response:**
```json
{
  "id": 44,
  "name": "Lead Category Webhook",
  "webhook_url": "https://webhook.site/your-url",
  "email_campaign_id": 2180,
  "event_types": ["LEAD_CATEGORY_UPDATED"],
  "categories": ["Interested"]
}
```

**Available Event Types:**
- `EMAIL_SENT`
- `EMAIL_OPEN`
- `EMAIL_LINK_CLICK`
- `EMAIL_REPLY`
- `LEAD_UNSUBSCRIBED`
- `LEAD_CATEGORY_UPDATED`

### 7.2 Create/Update Webhook
**POST** `/campaigns/{campaign_id}/webhooks`

```bash
curl -X POST https://server.smartlead.ai/api/v1/campaigns/372/webhooks?api_key=API_KEY \
  -d '{
    "id": null,
    "name": "My Webhook",
    "webhook_url": "https://webhook.site/your-url",
    "event_types": ["EMAIL_REPLY", "LEAD_CATEGORY_UPDATED"],
    "categories": ["Interested", "Meeting Request"]
  }'
```

**Note:** Set `id` to null to create new webhook, include ID to update existing.

### 7.3 Delete Webhook
**DELETE** `/campaigns/{campaign_id}/webhooks`

```bash
curl -X DELETE https://server.smartlead.ai/api/v1/campaigns/372/webhooks?api_key=API_KEY \
  -d '{ "id": 217 }'
```

---

## 8. CLIENTS

### 8.1 Get All Clients
**GET** `/client/`

```bash
curl https://server.smartlead.ai/api/v1/client/?api_key=API_KEY
```

**Response:**
```json
[{
  "id": 6,
  "name": "Client Name",
  "email": "[email protected]",
  "uuid": "1e19fcb7-6651-444a-8495-e1a4bda16611",
  "logo": null,
  "logo_url": null,
  "client_permision": {
    "permission": ["reply_master_inbox"],
    "retricted_category": []
  }
}]
```

### 8.2 Create Client
**POST** `/client/save`

```bash
curl -X POST https://server.smartlead.ai/api/v1/client/save?api_key=API_KEY \
  -d '{
    "name": "John Doe",
    "email": "[email protected]",
    "permission": ["reply_master_inbox"],
    "logo": "Company Name",
    "logo_url": null,
    "password": "SecurePass123!"
  }'
```

**Permissions:**
- `full_access`: Full account access
- `reply_master_inbox`: Can reply from master inbox

**Response:**
```json
{
  "ok": true,
  "clientId": 299,
  "name": "John Doe",
  "email": "[email protected]",
  "password": "SecurePass123!"
}
```

---

## Common Data Types

### Lead Status Enum
- `STARTED`: Scheduled to start
- `INPROGRESS`: Received at least one email
- `COMPLETED`: Received all emails
- `BLOCKED`: Bounced or in block list

### Campaign Status Enum
- `DRAFTED`: Not started
- `ACTIVE`: Running
- `COMPLETED`: Finished
- `STOPPED`: Manually stopped
- `PAUSED`: Temporarily paused

### Track Settings Enum
- `DONT_TRACK_EMAIL_OPEN`
- `DONT_TRACK_LINK_CLICK`
- `DONT_TRACK_REPLY_TO_AN_EMAIL`

### Stop Lead Settings Enum
- `REPLY_TO_AN_EMAIL`
- `CLICK_ON_A_LINK`
- `OPEN_AN_EMAIL`

### Email Account Type Enum
- `SMTP`
- `GMAIL`
- `ZOHO`
- `OUTLOOK`

---

## Error Codes

### HTTP Status Codes
- `200 OK`: Success
- `400 BAD_REQUEST`: Invalid parameters
- `404 NOT_FOUND`: Resource not found
- `406 NOT_ACCEPTABLE`: Rate limit or other constraint

### Common Error Responses
```json
{ "error": "Campaign not found - Invalid campaign_id." }
{ "error": "Invalid email - [email protected]" }
{ "error": "Email account id - 297 not allowed. Permission Error." }
{ "ok": false, "errorCode": "ACCOUNT_ALREADY_EXIST", "message": "..." }
```

---

## Best Practices

1. **Rate Limiting**: Respect the 10 requests per 2 seconds limit
2. **Pagination**: Use offset/limit for large datasets (max limit: 100)
3. **Bulk Operations**: Max 100 leads per add operation
4. **Custom Fields**: Maximum 20 custom fields per lead
5. **Email Validation**: Ensure valid email format before adding leads
6. **Timezone**: Use standard IANA timezone identifiers
7. **Webhooks**: Validate webhook URLs before creation
8. **Authentication**: Never expose API keys in client-side code

---

## Quick Reference Examples

### Complete Campaign Setup Flow
```bash
# 1. Create campaign
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/create?api_key=API_KEY" \
  -d '{"name": "Q4 Outreach"}'

# 2. Configure schedule
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/372/schedule?api_key=API_KEY" \
  -d '{"timezone": "America/New_York", "days_of_the_week": [1,2,3,4,5], "start_hour": "09:00", "end_hour": "17:00", "max_new_leads_per_day": 50}'

# 3. Add sequences
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/372/sequences?api_key=API_KEY" \
  -d '{"sequences": [{"seq_number": 1, "seq_delay_details": {"delay_in_days": 1}, "seq_variants": [{"subject": "Hi {{first_name}}", "email_body": "<p>Email content</p>", "variant_label": "A"}]}]}'

# 4. Add email accounts
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/372/email-accounts?api_key=API_KEY" \
  -d '{"email_account_ids": [24, 25]}'

# 5. Add leads
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/372/leads?api_key=API_KEY" \
  -d '{"lead_list": [{"first_name": "John", "last_name": "Doe", "email": "[email protected]"}]}'

# 6. Start campaign
curl -X POST "https://server.smartlead.ai/api/v1/campaigns/372/status?api_key=API_KEY" \
  -d '{"status": "START"}'
```

### Monitor Campaign Performance
```bash
# Get analytics
curl "https://server.smartlead.ai/api/v1/campaigns/372/analytics?api_key=API_KEY"

# Get detailed statistics
curl "https://server.smartlead.ai/api/v1/campaigns/372/statistics?api_key=API_KEY&limit=100"

# Export leads to CSV
curl "https://server.smartlead.ai/api/v1/campaigns/372/leads-export?api_key=API_KEY" > leads.csv
```

---

**Documentation Version:** Based on Smartlead API v1  
**Last Updated:** 2024