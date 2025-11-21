# Smartlead Webhook Integration Guide

## Overview

Smartlead webhooks provide real-time notifications about events in your cold email campaigns. This guide covers all available webhook events, their payload structures, and test cases to help you integrate Smartlead with your applications.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Webhook Configuration](#webhook-configuration)
3. [Webhook Event Types](#webhook-event-types)
4. [Security Considerations](#security-considerations)
5. [Error Handling & Retry Logic](#error-handling--retry-logic)
6. [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

- Active Smartlead PRO plan (required for API and webhook access)
- API Key from Smartlead (Settings > Your Profile > API Settings)
- Webhook endpoint URL (HTTPS recommended)

### Webhook Levels

Smartlead supports three webhook configuration levels:

- **User Level**: Applies to all activities under your user account (highest priority)
- **Client Level**: Applies to all activities under a specific client
- **Campaign Level**: Applies to activities within a specific campaign

**Important**: If a user-level webhook exists, client and campaign level webhooks will not function. Only one webhook per level will be active (the last updated one).

---

## Webhook Configuration

### Step 1: Setup Your Webhook Endpoint

Create an endpoint that can receive HTTP POST requests with JSON payloads.

```python
# Example Flask endpoint
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/smartlead/webhook', methods=['POST'])
def smartlead_webhook():
    payload = request.get_json()
    
    # Process the webhook
    event_type = payload.get('event_type')
    
    # Handle different event types
    if event_type == 'EMAIL_REPLY':
        handle_email_reply(payload)
    elif event_type == 'EMAIL_OPEN':
        handle_email_open(payload)
    # ... handle other events
    
    return jsonify({'status': 'success'}), 200
```

### Step 2: Configure Webhook in Smartlead

1. Log in to your Smartlead account
2. Navigate to **Settings > Webhooks**
3. Click **Add Webhook**
4. Enter the following details:
   - **Name**: Descriptive name for your webhook
   - **Webhook URL**: Your endpoint URL
   - **Event Types**: Select events you want to monitor
   - **Level**: Choose User/Client/Campaign level
5. Click **Save**

### Step 3: Test Your Webhook

Use Smartlead's "Send Test To Webhook" button to verify your endpoint is receiving data correctly.

---

## Webhook Event Types

### 1. EMAIL_SENT

Triggered when an email is successfully sent to a lead.

**Use Cases:**
- Track email delivery metrics
- Update CRM with sent status
- Log campaign activity

**Example Payload:**

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
  "description": "[email protected] sent Email 1 for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z"
  }
}
```

**Test Case:**

```javascript
// Test Case: Verify EMAIL_SENT webhook processing
describe('EMAIL_SENT Webhook', () => {
  it('should process sent email event correctly', async () => {
    const payload = {
      event_type: "EMAIL_SENT",
      campaign_id: 9181,
      sl_lead_email: "[email protected]",
      time_sent: "2025-03-28T08:15:00+00:00"
    };
    
    const response = await sendWebhook(payload);
    
    expect(response.status).toBe(200);
    expect(leadStatus('[email protected]')).toBe('email_sent');
  });
});
```

---

### 2. EMAIL_OPEN

Triggered when a lead opens an email.

**Use Cases:**
- Track engagement metrics
- Trigger follow-up automation based on opens
- Score lead interest

**Example Payload:**

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
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] opened Email 1 for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "ip_address": "192.168.1.1"
  }
}
```

**Test Case:**

```javascript
// Test Case: Track multiple email opens
describe('EMAIL_OPEN Webhook', () => {
  it('should increment open count for multiple opens', async () => {
    const payload1 = {
      event_type: "EMAIL_OPEN",
      sl_lead_email: "[email protected]",
      open_count: 1,
      time_opened: "2025-03-28T09:20:15+00:00"
    };
    
    const payload2 = {
      event_type: "EMAIL_OPEN",
      sl_lead_email: "[email protected]",
      open_count: 2,
      time_opened: "2025-03-28T14:30:00+00:00"
    };
    
    await sendWebhook(payload1);
    await sendWebhook(payload2);
    
    const leadData = getLeadData('[email protected]');
    expect(leadData.open_count).toBe(2);
    expect(leadData.engagement_score).toBeGreaterThan(0);
  });
});
```

---

### 3. EMAIL_LINK_CLICK

Triggered when a lead clicks a link in your email.

**Use Cases:**
- Track link engagement
- Identify hot leads
- Trigger personalized follow-ups

**Example Payload:**

```json
{
  "event_type": "EMAIL_LINK_CLICK",
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
  "time_clicked": "2025-03-28T09:25:30+00:00",
  "event_timestamp": "2025-03-28T09:25:30+00:00",
  "clicked_url": "https://yourcompany.com/demo-signup",
  "click_count": 1,
  "message_id": "<unique-message-id@mail.gmail.com>",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] clicked a link in Email 1 for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "ip_address": "192.168.1.1"
  }
}
```

**Test Case:**

```javascript
// Test Case: Identify hot lead based on link clicks
describe('EMAIL_LINK_CLICK Webhook', () => {
  it('should flag lead as hot when clicking demo link', async () => {
    const payload = {
      event_type: "EMAIL_LINK_CLICK",
      sl_lead_email: "[email protected]",
      clicked_url: "https://yourcompany.com/demo-signup",
      time_clicked: "2025-03-28T09:25:30+00:00"
    };
    
    await sendWebhook(payload);
    
    const leadData = getLeadData('[email protected]');
    expect(leadData.status).toBe('hot_lead');
    expect(leadData.clicked_demo_link).toBe(true);
  });
});
```

---

### 4. EMAIL_REPLY

Triggered when a lead replies to your email.

**Use Cases:**
- Capture prospect responses
- Route replies to sales team
- Auto-categorize reply sentiment
- Trigger conversation workflows

**Example Payload:**

```json
{
  "event_type": "EMAIL_REPLY",
  "campaign_status": "COMPLETED",
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
  "preview_text": "Hi Sarah, thanks for reaching out. I'd be interested in learning more about your solution.\n",
  "reply_body": "Hi Sarah,\n\nThanks for reaching out. I'd be interested in learning more about your solution.\n\nCould we schedule a quick call next week?\n\nBest regards,\nJohn",
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_id": 9181,
  "sequence_number": 1,
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] replied to Email 1 for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z"
  },
  "leadCorrespondence": {
    "repliedEmail": "[email protected]",
    "repliedName": "John Doe",
    "repliedCompanyDomain": "acmecorp.com",
    "originalRecipientEmail": "[email protected]",
    "originalRecipientName": "Sarah Smith"
  }
}
```

**Test Case:**

```javascript
// Test Case: Process positive reply and notify sales team
describe('EMAIL_REPLY Webhook', () => {
  it('should detect positive intent and create sales task', async () => {
    const payload = {
      event_type: "EMAIL_REPLY",
      sl_lead_email: "[email protected]",
      reply_body: "I'd be interested in learning more",
      time_replied: "2025-03-28T09:35:01+00:00"
    };
    
    await sendWebhook(payload);
    
    const leadData = getLeadData('[email protected]');
    expect(leadData.reply_sentiment).toBe('positive');
    expect(leadData.sales_task_created).toBe(true);
  });
  
  it('should handle out-of-office replies', async () => {
    const payload = {
      event_type: "EMAIL_REPLY",
      sl_lead_email: "[email protected]",
      reply_body: "I'm currently out of office until April 5th",
      time_replied: "2025-03-28T09:35:01+00:00"
    };
    
    await sendWebhook(payload);
    
    const leadData = getLeadData('[email protected]');
    expect(leadData.reply_type).toBe('out_of_office');
    expect(leadData.follow_up_date).toBe('2025-04-06');
  });
});
```

---

### 5. LEAD_UNSUBSCRIBED

Triggered when a lead unsubscribes from your emails.

**Use Cases:**
- Maintain compliance
- Update suppression lists
- Remove from active campaigns
- Sync with CRM

**Example Payload:**

```json
{
  "event_type": "LEAD_UNSUBSCRIBED",
  "campaign_id": 9181,
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_status": "ACTIVE",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "from_email": "[email protected]",
  "to_email": "[email protected]",
  "to_name": "Jane Williams",
  "time_unsubscribed": "2025-03-28T10:15:22+00:00",
  "event_timestamp": "2025-03-28T10:15:22+00:00",
  "unsubscribe_reason": "Not interested",
  "message_id": "<unique-message-id@mail.gmail.com>",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] unsubscribed from campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z",
    "unsubscribe_method": "link_click"
  }
}
```

**Test Case:**

```javascript
// Test Case: Handle unsubscribe and update all systems
describe('LEAD_UNSUBSCRIBED Webhook', () => {
  it('should add lead to suppression list across all campaigns', async () => {
    const payload = {
      event_type: "LEAD_UNSUBSCRIBED",
      sl_lead_email: "[email protected]",
      time_unsubscribed: "2025-03-28T10:15:22+00:00"
    };
    
    await sendWebhook(payload);
    
    const suppressionList = getSuppressionList();
    expect(suppressionList).toContain('[email protected]');
    
    const activeCampaigns = getActiveCampaignsForLead('[email protected]');
    expect(activeCampaigns.length).toBe(0);
  });
  
  it('should sync unsubscribe to CRM', async () => {
    const payload = {
      event_type: "LEAD_UNSUBSCRIBED",
      sl_lead_email: "[email protected]",
      unsubscribe_reason: "Not interested"
    };
    
    await sendWebhook(payload);
    
    const crmContact = getCRMContact('[email protected]');
    expect(crmContact.email_status).toBe('unsubscribed');
    expect(crmContact.unsubscribe_reason).toBe('Not interested');
  });
});
```

---

### 6. LEAD_CATEGORY_UPDATED

Triggered when a lead's category changes (e.g., from "Interested" to "Not Interested").

**Use Cases:**
- Track lead qualification changes
- Trigger category-specific workflows
- Update CRM pipeline stages
- Generate reports on lead progression

**Example Payload:**

```json
{
  "event_type": "LEAD_CATEGORY_UPDATED",
  "campaign_id": 9181,
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_status": "ACTIVE",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "to_email": "[email protected]",
  "to_name": "Mike Johnson",
  "previous_category": "Lead",
  "new_category": "Interested",
  "category_updated_at": "2025-03-28T11:00:00+00:00",
  "event_timestamp": "2025-03-28T11:00:00+00:00",
  "updated_by": "sarah@yourcompany.com",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "[email protected] category updated from Lead to Interested for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z",
    "category_id": 143
  }
}
```

**Test Case:**

```javascript
// Test Case: Update CRM when lead moves to interested
describe('LEAD_CATEGORY_UPDATED Webhook', () => {
  it('should update CRM pipeline when category changes to Interested', async () => {
    const payload = {
      event_type: "LEAD_CATEGORY_UPDATED",
      sl_lead_email: "[email protected]",
      previous_category: "Lead",
      new_category: "Interested",
      category_updated_at: "2025-03-28T11:00:00+00:00"
    };
    
    await sendWebhook(payload);
    
    const crmDeal = getCRMDeal('[email protected]');
    expect(crmDeal.stage).toBe('Qualified');
    expect(crmDeal.last_updated).toBe('2025-03-28T11:00:00+00:00');
  });
  
  it('should trigger notification when lead becomes hot', async () => {
    const payload = {
      event_type: "LEAD_CATEGORY_UPDATED",
      sl_lead_email: "[email protected]",
      new_category: "Very Interested",
      category_updated_at: "2025-03-28T11:00:00+00:00"
    };
    
    await sendWebhook(payload);
    
    const notifications = getNotifications();
    expect(notifications).toContainEqual({
      type: 'hot_lead',
      email: '[email protected]',
      message: 'Lead is very interested - immediate follow-up recommended'
    });
  });
});
```

---

### 7. EMAIL_BOUNCE

Triggered when an email bounces (hard or soft bounce).

**Use Cases:**
- Clean email lists
- Track deliverability issues
- Remove invalid emails
- Monitor sender reputation

**Example Payload:**

```json
{
  "event_type": "EMAIL_BOUNCE",
  "campaign_id": 9181,
  "campaign_name": "Q4 Outreach Campaign",
  "campaign_status": "ACTIVE",
  "sl_email_lead_id": "1482956",
  "sl_email_lead_map_id": 1438627,
  "sl_lead_email": "[email protected]",
  "from_email": "[email protected]",
  "to_email": "[email protected]",
  "to_name": "Invalid User",
  "subject": "Quick question about your sales process",
  "sequence_number": 1,
  "time_bounced": "2025-03-28T08:20:00+00:00",
  "event_timestamp": "2025-03-28T08:20:00+00:00",
  "bounce_type": "hard",
  "bounce_reason": "550 5.1.1 User unknown",
  "smtp_code": "550",
  "message_id": "<unique-message-id@mail.gmail.com>",
  "stats_id": "a891fe37-c45d-21e8-67ba-fcd44e9c33a8",
  "secret_key": "4f7c8d23-a619-58c2-93g6-72936ee16f38",
  "app_url": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "ui_master_inbox_link": "https://app.smartlead.ai/app/master-inbox?leadMap=1438627",
  "description": "Email to [email protected] bounced for campaign - Q4 Outreach Campaign",
  "metadata": {
    "webhook_created_at": "2025-03-28T08:14:40.843Z",
    "diagnostic_code": "smtp; 550 5.1.1 User unknown"
  }
}
```

**Test Case:**

```javascript
// Test Case: Handle hard bounce and clean lists
describe('EMAIL_BOUNCE Webhook', () => {
  it('should remove hard bounced email from all campaigns', async () => {
    const payload = {
      event_type: "EMAIL_BOUNCE",
      sl_lead_email: "[email protected]",
      bounce_type: "hard",
      bounce_reason: "User unknown",
      time_bounced: "2025-03-28T08:20:00+00:00"
    };
    
    await sendWebhook(payload);
    
    const suppressionList = getSuppressionList();
    expect(suppressionList).toContain('[email protected]');
    
    const leadStatus = getLeadStatus('[email protected]');
    expect(leadStatus).toBe('invalid_email');
  });
  
  it('should retry soft bounce', async () => {
    const payload = {
      event_type: "EMAIL_BOUNCE",
      sl_lead_email: "[email protected]",
      bounce_type: "soft",
      bounce_reason: "Mailbox full",
      time_bounced: "2025-03-28T08:20:00+00:00"
    };
    
    await sendWebhook(payload);
    
    const leadData = getLeadData('[email protected]');
    expect(leadData.retry_scheduled).toBe(true);
    expect(leadData.bounce_count).toBe(1);
  });
});
```

---

## Security Considerations

### 1. Verify Webhook Authenticity

Smartlead includes a `secret_key` in each webhook payload. Use this to verify requests are from Smartlead:

```python
def verify_webhook(payload, expected_secret):
    received_secret = payload.get('secret_key')
    
    if received_secret != expected_secret:
        raise ValueError('Invalid webhook secret')
    
    return True
```

### 2. Use HTTPS

Always use HTTPS endpoints to encrypt webhook data in transit.

### 3. Implement Rate Limiting

Protect your endpoint from potential abuse:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=lambda: request.remote_addr)

@app.route('/smartlead/webhook', methods=['POST'])
@limiter.limit("100 per minute")
def smartlead_webhook():
    # Handle webhook
    pass
```

### 4. Validate Payload Structure

Always validate the webhook payload structure before processing:

```python
from jsonschema import validate, ValidationError

webhook_schema = {
    "type": "object",
    "required": ["event_type", "campaign_id", "sl_lead_email"],
    "properties": {
        "event_type": {"type": "string"},
        "campaign_id": {"type": "integer"},
        "sl_lead_email": {"type": "string", "format": "email"}
    }
}

def validate_webhook_payload(payload):
    try:
        validate(instance=payload, schema=webhook_schema)
        return True
    except ValidationError as e:
        log_error(f"Invalid webhook payload: {e}")
        return False
```

---

## Error Handling & Retry Logic

### Smartlead's Retry Mechanism

As of February 2025, Smartlead will:
- Retry failed webhooks up to **5 times**
- Wait **300 seconds (5 minutes)** between retry attempts

### Best Practices for Your Endpoint

1. **Return 200 Status Quickly**: Process webhooks asynchronously

```python
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379/0')

@app.route('/smartlead/webhook', methods=['POST'])
def smartlead_webhook():
    payload = request.get_json()
    
    # Queue for async processing
    process_webhook.delay(payload)
    
    # Return success immediately
    return jsonify({'status': 'queued'}), 200

@celery.task
def process_webhook(payload):
    # Process webhook logic here
    pass
```

2. **Implement Idempotency**: Handle duplicate webhooks gracefully

```python
def process_webhook_idempotent(payload):
    event_id = payload.get('stats_id')
    
    # Check if already processed
    if is_processed(event_id):
        return {'status': 'already_processed'}
    
    # Process webhook
    result = process_webhook_data(payload)
    
    # Mark as processed
    mark_processed(event_id)
    
    return result
```

3. **Log All Webhooks**: Maintain audit trail

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/smartlead/webhook', methods=['POST'])
def smartlead_webhook():
    payload = request.get_json()
    
    logger.info(f"Received webhook: {payload.get('event_type')} for {payload.get('sl_lead_email')}")
    
    try:
        process_webhook(payload)
        logger.info(f"Successfully processed webhook: {payload.get('stats_id')}")
    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise
    
    return jsonify({'status': 'success'}), 200
```

---

## Best Practices

### 1. Webhook Level Strategy

- **Use User-Level Webhooks** for single-account setups
- **Use Client-Level Webhooks** for agency/multi-client setups
- **Avoid Campaign-Level Webhooks** unless you have specific per-campaign requirements
- **Never mix webhook levels** - user-level webhooks override all others

### 2. Event Selection

Only subscribe to events you need:

```javascript
// Good: Subscribe to specific events
const events = [
  'EMAIL_REPLY',
  'EMAIL_OPEN', 
  'LEAD_UNSUBSCRIBED'
];

// Bad: Subscribe to all events unnecessarily
const events = [
  'EMAIL_SENT',
  'EMAIL_OPEN',
  'EMAIL_LINK_CLICK',
  'EMAIL_REPLY',
  'LEAD_UNSUBSCRIBED',
  'LEAD_CATEGORY_UPDATED',
  'EMAIL_BOUNCE'
];
```

### 3. Performance Optimization

- Use message queues (Redis, RabbitMQ) for async processing
- Batch database updates when possible
- Implement caching for frequently accessed data
- Monitor endpoint response times

### 4. Testing Strategy

Create comprehensive test suites:

```javascript
// Integration test example
describe('Smartlead Webhook Integration', () => {
  beforeEach(async () => {
    await clearTestData();
  });
  
  it('should handle complete email lifecycle', async () => {
    // 1. Email sent
    await sendWebhook({ event_type: 'EMAIL_SENT', sl_lead_email: '[email protected]' });
    
    // 2. Email opened
    await sendWebhook({ event_type: 'EMAIL_OPEN', sl_lead_email: '[email protected]' });
    
    // 3. Link clicked
    await sendWebhook({ event_type: 'EMAIL_LINK_CLICK', sl_lead_email: '[email protected]' });
    
    // 4. Reply received
    await sendWebhook({ event_type: 'EMAIL_REPLY', sl_lead_email: '[email protected]' });
    
    // Verify complete lifecycle
    const lead = getLeadData('[email protected]');
    expect(lead.status).toBe('replied');
    expect(lead.engagement_score).toBeGreaterThan(50);
  });
});
```

### 5. Monitoring & Alerting

Implement monitoring for:
- Webhook delivery failures
- Processing errors
- Response time degradation
- Unusual event patterns

```python
from prometheus_client import Counter, Histogram

webhook_received = Counter('webhook_received_total', 'Total webhooks received', ['event_type'])
webhook_processing_time = Histogram('webhook_processing_seconds', 'Time to process webhook')

@app.route('/smartlead/webhook', methods=['POST'])
def smartlead_webhook():
    payload = request.get_json()
    event_type = payload.get('event_type')
    
    webhook_received.labels(event_type=event_type).inc()
    
    with webhook_processing_time.time():
        process_webhook(payload)
    
    return jsonify({'status': 'success'}), 200
```

---

## Common Integration Patterns

### Pattern 1: CRM Sync

Sync webhook events to your CRM:

```python
def sync_to_crm(payload):
    event_type = payload.get('event_type')
    lead_email = payload.get('sl_lead_email')
    
    if event_type == 'EMAIL_REPLY':
        crm.create_task(
            email=lead_email,
            type='follow_up',
            priority='high',
            notes=payload.get('reply_body')
        )
    
    elif event_type == 'EMAIL_OPEN':
        crm.update_lead_score(
            email=lead_email,
            increment=5
        )
    
    elif event_type == 'LEAD_UNSUBSCRIBED':
        crm.update_contact_status(
            email=lead_email,
            status='unsubscribed'
        )
```

### Pattern 2: Slack Notifications

Send real-time notifications to Slack:

```python
from slack_sdk import WebClient

slack_client = WebClient(token=SLACK_TOKEN)

def notify_slack(payload):
    event_type = payload.get('event_type')
    
    if event_type == 'EMAIL_REPLY':
        message = f"🎉 New reply from {payload.get('to_name')}!\n" \
                  f"Email: {payload.get('sl_lead_email')}\n" \
                  f"Preview: {payload.get('preview_text')}\n" \
                  f"<{payload.get('app_url')}|View in Smartlead>"
        
        slack_client.chat_postMessage(
            channel='#sales-replies',
            text=message
        )
```

### Pattern 3: Analytics Pipeline

Build analytics from webhook data:

```python
def log_to_analytics(payload):
    event = {
        'timestamp': payload.get('event_timestamp'),
        'event_type': payload.get('event_type'),
        'campaign_id': payload.get('campaign_id'),
        'campaign_name': payload.get('campaign_name'),
        'lead_email': payload.get('sl_lead_email'),
        'sequence_number': payload.get('sequence_number')
    }
    
    # Send to analytics platform
    analytics_db.insert('smartlead_events', event)
    
    # Update campaign metrics
    update_campaign_metrics(payload.get('campaign_id'))
```

---

## Troubleshooting

### Issue: Webhooks Not Received

**Possible Causes:**
- User-level webhook is blocking lower-level webhooks
- Incorrect webhook URL
- Firewall blocking requests
- SSL certificate issues

**Solutions:**
1. Verify webhook configuration in Smartlead settings
2. Test endpoint with tools like Postman or curl
3. Check server logs for incoming requests
4. Ensure HTTPS certificate is valid

### Issue: Duplicate Webhooks

**Possible Causes:**
- Retry mechanism triggering after slow response
- Multiple webhooks configured for same event

**Solutions:**
1. Implement idempotency using `stats_id` or `message_id`
2. Return 200 status immediately
3. Process webhooks asynchronously

### Issue: Missing Data in Payload

**Possible Causes:**
- Event-specific fields vary by type
- Incomplete lead data in Smartlead

**Solutions:**
1. Check event type and expected fields
2. Use default values for optional fields
3. Validate lead data completeness in Smartlead

---

## Additional Resources

- [Smartlead API Documentation](https://api.smartlead.ai)
- [Smartlead Help Center](https://helpcenter.smartlead.ai)
- [Webhook Testing Tools](https://webhook.site)
- [Smartlead Community Forum](https://community.smartlead.ai)

---

## Support

For webhook-related issues:
- Email: [email protected]
- Documentation: https://helpcenter.smartlead.ai
- API Status: https://status.smartlead.ai

---

**Last Updated**: November 2025  
**Version**: 2.0  
**Author**: Smartlead Integration Team