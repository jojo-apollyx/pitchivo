# Email Routing Guide: Smartlead vs Brevo

## Quick Decision Tree

```
Is this email part of a marketing campaign?
├─ YES → Use Smartlead (headless API)
│   ├─ Product promotion emails
│   ├─ Cold outreach to buyers
│   └─ Follow-up sequences
│
└─ NO → Use Brevo (transactional)
    ├─ User notifications
    ├─ Admin notifications
    ├─ System emails
    ├─ Test emails
    └─ One-off communications
```

---

## Campaign Emails (Smartlead)

### What Goes Through Smartlead:
- ✅ Marketing campaign emails to buyer leads
- ✅ Product promotion sequences
- ✅ Cold outreach campaigns
- ✅ Follow-up sequences
- ✅ Automated drip campaigns

### How It Works:
1. Create campaign in UI → Creates in Smartlead via API
2. Add leads via API
3. Smartlead sends emails using their infrastructure
4. Smartlead webhooks → Our database
5. UI displays event history from our database

### Data Flow:
```
User Creates Campaign
  ↓
campaigns table (campaign_id)
  ↓
Smartlead API (smartlead_campaign_id)
  ↓
Smartlead Sends Emails
  ↓
Smartlead Webhooks → /api/webhooks/smartlead
  ↓
smartlead_email_events table
  ↓
UI displays events
```

---

## Transactional Emails (Brevo)

### What Goes Through Brevo:

#### 1. **User Notifications**
```typescript
// Order confirmation
await sendBrevoEmail({
  to: user.email,
  subject: 'Order Confirmed - #12345',
  template: 'order_confirmation',
  params: {
    order_id: '12345',
    total: '$1,234.00',
    items: orderItems
  }
});

// Product update notification
await sendBrevoEmail({
  to: user.email,
  subject: 'Your product listing has been approved',
  template: 'product_approved',
  params: {
    product_name: 'Sodium Chloride',
    product_url: 'https://...'
  }
});

// Campaign status update
await sendBrevoEmail({
  to: user.email,
  subject: 'Campaign "Q4 Sale" is now active',
  template: 'campaign_active',
  params: {
    campaign_name: 'Q4 Sale',
    campaign_url: 'https://...'
  }
});
```

#### 2. **Admin Notifications**
```typescript
// New user signup alert
await sendBrevoEmail({
  to: 'admin@pitchivo.com',
  subject: 'New User Signup: Acme Corp',
  template: 'admin_new_user',
  params: {
    user_email: 'john@acme.com',
    company: 'Acme Corp',
    signup_time: new Date()
  }
});

// High bounce rate alert
await sendBrevoEmail({
  to: 'admin@pitchivo.com',
  subject: '⚠️ High Bounce Rate Alert: Campaign Q4 Sale',
  template: 'admin_high_bounce',
  params: {
    campaign_name: 'Q4 Sale',
    bounce_rate: 8.5,
    threshold: 5
  }
});

// New reply received
await sendBrevoEmail({
  to: 'admin@pitchivo.com',
  subject: '💬 New Reply: Campaign Q4 Sale',
  template: 'admin_new_reply',
  params: {
    lead_email: 'john@acme.com',
    campaign_name: 'Q4 Sale',
    reply_preview: 'Interested in bulk pricing...',
    reply_url: 'https://...'
  }
});
```

#### 3. **System Emails**
```typescript
// Welcome email
await sendBrevoEmail({
  to: newUser.email,
  subject: 'Welcome to Pitchivo!',
  template: 'welcome',
  params: {
    user_name: newUser.name,
    setup_url: 'https://...'
  }
});

// Password reset
await sendBrevoEmail({
  to: user.email,
  subject: 'Reset your Pitchivo password',
  template: 'password_reset',
  params: {
    reset_url: resetUrl,
    expires_in: '1 hour'
  }
});

// Email verification
await sendBrevoEmail({
  to: user.email,
  subject: 'Verify your email address',
  template: 'email_verification',
  params: {
    verification_url: verificationUrl
  }
});

// Subscription renewal reminder
await sendBrevoEmail({
  to: user.email,
  subject: 'Your subscription renews in 7 days',
  template: 'subscription_renewal',
  params: {
    renewal_date: renewalDate,
    amount: '$99.00',
    plan: 'Pro'
  }
});
```

#### 4. **Test Emails (Admin)**
```typescript
// Admin testing campaign emails
await sendBrevoEmail({
  to: 'test@example.com', // Arbitrary email
  subject: emailSubject,
  html: emailContent,
  senderDomain: 'info', // Select from BREVO_SENDER_DOMAINS
  tags: ['test', 'admin_send']
});
```

#### 5. **One-Off Communications**
```typescript
// Support response
await sendBrevoEmail({
  to: user.email,
  subject: 'Re: Support Ticket #12345',
  template: 'support_response',
  params: {
    ticket_id: '12345',
    response: supportResponse
  }
});

// Partnership inquiry
await sendBrevoEmail({
  to: 'partner@example.com',
  subject: 'Partnership Opportunity',
  template: 'partnership',
  params: {
    message: partnershipMessage
  }
});
```

### Data Flow:
```
Trigger Event (signup, order, etc.)
  ↓
sendBrevoEmail() function
  ↓
Brevo API
  ↓
brevo_transactional_emails table
  ↓
Brevo Webhooks → /api/webhooks/brevo
  ↓
email_events table
  ↓
(Optional) UI displays delivery status
```

---

## Implementation Examples

### Send Campaign Email (Smartlead)
```typescript
// This happens automatically via Smartlead
// We just create the campaign and add leads
const response = await fetch('/api/smartlead/campaigns', {
  method: 'POST',
  body: JSON.stringify({
    campaign_id: dbCampaignId,
    campaign_name: 'Q4 Chemical Sale'
  })
});

// Add leads
await fetch(`/api/smartlead/campaigns/${smartleadId}/leads`, {
  method: 'POST',
  body: JSON.stringify({
    leads: [
      { email: 'john@acme.com', first_name: 'John', company_name: 'Acme' }
    ]
  })
});

// Smartlead handles sending automatically
// Webhooks update our database
```

### Send Transactional Email (Brevo)
```typescript
// lib/email.ts - Updated sendEmail function
export async function sendTransactionalEmail({
  to,
  subject,
  template,
  params,
  html,
  senderDomain = 'info'
}: TransactionalEmailOptions) {
  const senderEmail = getSenderEmail(senderDomain);
  
  // Send via Brevo
  const response = await brevoClient.sendTransacEmail({
    to: [{ email: to }],
    sender: { email: senderEmail, name: 'Pitchivo' },
    subject,
    htmlContent: html || renderTemplate(template, params),
    tags: ['transactional', template || 'custom']
  });

  // Record in database
  await supabase.from('brevo_transactional_emails').insert({
    recipient_email: to,
    subject,
    brevo_message_id: response.messageId,
    status: 'sent',
    metadata: { template, params }
  });

  return response;
}
```

### Send User Notification
```typescript
// When product is approved
async function notifyProductApproved(userId: string, productId: string) {
  const user = await getUser(userId);
  const product = await getProduct(productId);
  
  await sendTransactionalEmail({
    to: user.email,
    subject: `Your product "${product.name}" has been approved!`,
    template: 'product_approved',
    params: {
      user_name: user.name,
      product_name: product.name,
      product_url: `https://pitchivo.com/products/${product.slug}`,
      dashboard_url: 'https://pitchivo.com/dashboard/products'
    }
  });
}
```

### Send Admin Alert
```typescript
// When high bounce rate detected
async function alertHighBounceRate(campaignId: string) {
  const campaign = await getCampaign(campaignId);
  const bounceRate = (campaign.emails_bounced / campaign.emails_sent) * 100;
  
  if (bounceRate > 5) {
    await sendTransactionalEmail({
      to: 'admin@pitchivo.com',
      subject: `⚠️ High Bounce Rate Alert: ${campaign.campaign_name}`,
      template: 'admin_high_bounce',
      params: {
        campaign_name: campaign.campaign_name,
        campaign_id: campaign.campaign_id,
        bounce_rate: bounceRate.toFixed(2),
        threshold: 5,
        campaign_url: `https://pitchivo.com/admin/campaigns/${campaign.campaign_id}`
      }
    });
  }
}
```

---

## Email Tracking

### Campaign Emails (Smartlead)
- **Tracking Source**: Smartlead webhooks
- **Stored In**: `smartlead_email_events` table
- **Events**: sent, delivered, opened, clicked, replied, bounced, unsubscribed
- **UI Display**: Campaign dashboard, lead timeline, analytics

### Transactional Emails (Brevo)
- **Tracking Source**: Brevo webhooks
- **Stored In**: `email_events` table (references `brevo_transactional_emails`)
- **Events**: sent, delivered, opened, clicked, bounced
- **UI Display**: (Optional) Email delivery status, admin logs

---

## Database Tables

### Campaign Emails
```sql
-- Smartlead events
smartlead_email_events (
  event_id UUID,
  campaign_id UUID,  -- Links to campaigns.campaign_id
  smartlead_campaign_id TEXT,
  lead_email TEXT,
  event_type TEXT,
  event_timestamp TIMESTAMPTZ,
  metadata JSONB
);

-- Replies from leads
campaign_replies (
  reply_id UUID,
  campaign_id UUID,
  lead_email TEXT,
  reply_text TEXT,
  replied_at TIMESTAMPTZ,
  sentiment TEXT
);
```

### Transactional Emails
```sql
-- Brevo transactional emails
brevo_transactional_emails (
  brevo_email_id UUID,
  recipient_email TEXT,
  subject TEXT,
  brevo_message_id TEXT,
  brevo_status TEXT,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ
);

-- Brevo email events
email_events (
  event_id UUID,
  brevo_email_id UUID,  -- Links to brevo_transactional_emails
  event_type TEXT,
  event_timestamp TIMESTAMPTZ
);
```

---

## API Endpoints

### Campaign Emails (Smartlead)
- `POST /api/smartlead/campaigns` - Create campaign
- `POST /api/smartlead/campaigns/[id]/leads` - Add leads
- `POST /api/webhooks/smartlead` - Receive events

### Transactional Emails (Brevo)
- `POST /api/admin/campaigns/send` - Admin test send
- `POST /api/emails/send` - General transactional send
- `POST /api/webhooks/brevo` - Receive events

---

## Summary

### Smartlead (Campaign Emails)
✅ Marketing campaigns  
✅ Bulk outreach  
✅ Automated sequences  
✅ Lead nurturing  

**Tracked via**: Smartlead webhooks → `smartlead_email_events`

### Brevo (Transactional Emails)
✅ User notifications  
✅ Admin alerts  
✅ System emails  
✅ Test sends  
✅ One-off communications  

**Tracked via**: Brevo webhooks → `brevo_transactional_emails` + `email_events`

---

Both systems maintain full event history in our database, ensuring complete control over UI display and analytics regardless of which service actually sends the email.

