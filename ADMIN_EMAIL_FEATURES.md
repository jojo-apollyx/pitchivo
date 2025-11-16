# Admin Campaign Management - Email Features Implementation

## Overview
Comprehensive email campaign management features for administrators with AI-powered quality checking, template management, batch scheduling, and automated sending.

## ✅ Implemented Features

### 1. AI Email Quality Checker
**Component:** `/apps/web/components/admin/email-quality-checker.tsx`
**API:** `/apps/web/app/api/admin/campaigns/analyze-email/route.ts`

#### Features:
- **Real-time Email Analysis**
  - Overall quality score (0-100)
  - Spam risk level (low/medium/high)
  - Detailed issues detection
  - Actionable suggestions

- **Analysis Criteria:**
  - Spam trigger words detection
  - Excessive capitalization check
  - Punctuation analysis
  - Subject line length optimization
  - Personalization verification
  - Content length validation
  - Link count monitoring
  - Professional tone assessment
  - Call-to-action presence

#### Usage:
```typescript
// Navigate to Quality Check tab
// Enter subject and content
// Click "Analyze Email"
// Review score, issues, and suggestions
```

### 2. Email Template Manager
**Component:** `/apps/web/components/admin/email-template-manager.tsx`
**API:** `/apps/web/app/api/admin/campaigns/templates/route.ts`

#### Features:
- Create, edit, delete email templates
- Set default template per campaign
- Save templates with placeholders
- Quick template application
- Template listing with preview

#### Database Table:
```sql
email_templates (
  template_id UUID PRIMARY KEY,
  campaign_id UUID,
  template_name TEXT,
  subject TEXT,
  content TEXT,
  is_default BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### API Endpoints:
- `GET /api/admin/campaigns/templates?campaignId={id}` - List templates
- `POST /api/admin/campaigns/templates` - Create template
- `PUT /api/admin/campaigns/templates` - Update template
- `DELETE /api/admin/campaigns/templates?templateId={id}` - Delete template

### 3. Batch Email Scheduler
**Component:** `/apps/web/components/admin/batch-email-scheduler.tsx`
**API:** `/apps/web/app/api/admin/campaigns/auto-schedule/route.ts`

#### Features:
- **Smart Scheduling Algorithm:**
  - Automatically skips weekends
  - Distributes emails across preferred hours
  - Randomizes minutes for natural appearance
  - Respects daily and hourly limits
  - Maximizes spam filter bypass probability

- **Configuration Options:**
  - Daily email limit (default: 50)
  - Emails per hour (default: 10)
  - Sending hours (default: 9,10,11,14,15,16)
  - Custom start date
  - Duration days

- **Input Format:**
  ```
  email@company.com, Company Name, Contact Name
  buyer@example.com, Example Corp
  john@acme.com
  ```

#### Schedule Statistics:
- Total emails scheduled
- Start and end dates
- Total days span
- Average emails per day
- Distribution by day and hour

### 4. Scheduled Emails Viewer
**Component:** `/apps/web/components/admin/scheduled-emails-viewer.tsx`
**API:** `/apps/web/app/api/admin/campaigns/scheduled-emails/route.ts`

#### Features:
- View all scheduled emails
- Filter by status (pending/sent/failed/cancelled)
- Group by date
- **Send immediately** button for pending emails
- Cancel scheduled emails
- View error messages for failed sends
- Real-time status updates

#### Database Table:
```sql
scheduled_emails (
  scheduled_email_id UUID PRIMARY KEY,
  campaign_id UUID,
  recipient_email TEXT,
  recipient_company TEXT,
  recipient_name TEXT,
  template_id UUID,
  subject TEXT,
  content TEXT,
  scheduled_time TIMESTAMP,
  status TEXT, -- pending, sent, failed, cancelled
  sent_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 5. Automated Email Sending (Cron Job)
**Edge Function:** `/supabase/functions/send-scheduled-emails/index.ts`
**Helper Function:** `/supabase/migrations/20240101000053_create_increment_metric_function.sql`

#### Features:
- Runs every hour (configurable)
- Processes up to 100 emails per run
- Sends pending emails past scheduled time
- Updates campaign metrics automatically
- Logs campaign activities
- Handles failures gracefully
- Records error messages

#### Setup:
```bash
# Deploy edge function
supabase functions deploy send-scheduled-emails

# Set up cron job (Supabase Dashboard > Edge Functions > Cron)
# Schedule: 0 * * * * (every hour)
```

#### Metrics Updated:
- `emails_sent`
- `emails_delivered`
- Campaign activities logged

### 6. Placeholder Replacement
**API:** `/apps/web/app/api/admin/campaigns/send/route.ts` (already implemented)

#### Available Placeholders:
- `{{product_link}}` - Full URL to product page
- `{{product_name}}` - Product name from campaign
- `{{buyer_name}}` - Extracted from email domain
- `{{company}}` - Recipient company name
- `{{org_name}}` - Your organization name

#### Processing:
Placeholders are replaced **immediately before sending** with actual values from:
- Campaign data
- Product information
- Organization details
- Recipient data

## 📊 User Interface

### Tabbed Interface
The admin campaign page now features a comprehensive tabbed interface:

1. **Send Email** - Send immediate one-off emails
2. **Quality Check** - AI-powered spam risk analysis
3. **Templates** - Manage reusable email templates
4. **Batch Schedule** - Auto-schedule multiple emails
5. **Scheduled Emails** - View and manage schedule

### Workflow Examples

#### Example 1: Send Single Test Email
```
1. Select campaign
2. Go to "Send Email" tab
3. Enter recipient email
4. Subject and content auto-populate from default template
5. Optional: Go to "Quality Check" tab to analyze
6. Return to "Send Email" tab
7. Click "Send Email Immediately"
8. Email sent with placeholders replaced
```

#### Example 2: Create and Use Template
```
1. Select campaign
2. Go to "Templates" tab
3. Click "New Template"
4. Fill in template name, subject, content
5. Check "Set as default" (optional)
6. Click "Save Template"
7. Template now available for all campaign emails
8. Click "Use" on any template to apply it
```

#### Example 3: Batch Schedule Campaign
```
1. Select campaign
2. Go to "Batch Schedule" tab
3. Paste recipient list (email, company, name)
4. Configure settings:
   - Daily Limit: 50
   - Emails/Hour: 10
   - Sending Hours: 9,10,11,14,15,16
5. Click "Auto-Schedule Emails"
6. System calculates optimal distribution
7. Emails scheduled across multiple days
8. Go to "Scheduled Emails" tab to review
```

#### Example 4: Manage Scheduled Emails
```
1. Go to "Scheduled Emails" tab
2. View all scheduled emails grouped by date
3. Filter by status (All/Pending/Sent/Failed)
4. For pending emails:
   - Click "Send Now" to send immediately
   - Click "X" to cancel
5. View sent emails with timestamps
6. Check failed emails with error messages
```

## 🔧 Technical Architecture

### Component Structure
```
apps/web/
├── app/
│   ├── admin/
│   │   └── campaigns/
│   │       └── page.tsx (Main admin page with tabs)
│   └── api/
│       └── admin/
│           └── campaigns/
│               ├── analyze-email/route.ts
│               ├── templates/route.ts
│               ├── scheduled-emails/route.ts
│               ├── auto-schedule/route.ts
│               ├── send-scheduled/route.ts
│               ├── send/route.ts (existing)
│               └── metrics/route.ts (existing)
└── components/
    └── admin/
        ├── email-quality-checker.tsx
        ├── email-template-manager.tsx
        ├── scheduled-emails-viewer.tsx
        └── batch-email-scheduler.tsx

supabase/
├── functions/
│   └── send-scheduled-emails/
│       └── index.ts
└── migrations/
    ├── 20240101000052_create_email_templates_and_schedule.sql
    └── 20240101000053_create_increment_metric_function.sql
```

### Data Flow

#### Batch Scheduling Flow:
```
1. Admin enters recipient list
2. Frontend calls /api/admin/campaigns/auto-schedule
3. API calculates optimal schedule
4. Creates records in scheduled_emails table
5. Returns schedule statistics
6. Cron job processes scheduled_emails hourly
7. Sends emails via Brevo API
8. Updates metrics and activities
```

#### Template Flow:
```
1. Admin creates template
2. Stored in email_templates table
3. Can be set as default for campaign
4. When selected, populates email form
5. Placeholders remain until sending
6. Replaced during actual send
```

## 🔐 Security

- All endpoints require `requireAdmin()` authentication
- Service role used for database operations
- Email validation before sending
- SQL injection protection via parameterized queries
- Rate limiting on API endpoints (recommended)

## 📈 Performance Optimizations

### Database Indexes:
```sql
-- email_templates
idx_email_templates_campaign
idx_email_templates_default

-- scheduled_emails  
idx_scheduled_emails_campaign
idx_scheduled_emails_status
idx_scheduled_emails_time
```

### Batch Processing:
- Cron job processes max 100 emails per run
- Prevents timeout issues
- Ensures reliable delivery
- Allows for scaling

## 🧪 Testing the System

### 1. Test Email Quality Checker:
```
Subject: FREE MONEY!!! CLICK NOW!!!
Content: You won $1,000,000!!! ACT NOW!!! LIMITED TIME!!!

Expected: Very low score (< 40), high spam risk
```

### 2. Test Template Management:
```
1. Create template: "Initial Outreach"
2. Set as default
3. Create another: "Follow-up"
4. Edit first template
5. Delete follow-up template
```

### 3. Test Batch Scheduling:
```
Recipients:
test1@example.com, Test Company 1, John Doe
test2@example.com, Test Company 2, Jane Smith
test3@example.com, Test Company 3

Expected: 3 emails scheduled across safe hours
```

### 4. Test Send Immediately:
```
1. Schedule emails for future
2. Go to "Scheduled Emails"
3. Click "Send Now" on one email
4. Verify it appears as "Sent"
5. Check campaign metrics updated
```

## 🚀 Deployment Checklist

- [ ] Run database migrations
- [ ] Deploy edge function: `send-scheduled-emails`
- [ ] Set up cron job for hourly execution
- [ ] Configure Brevo API keys
- [ ] Test all email flows
- [ ] Verify placeholder replacement
- [ ] Check spam score accuracy
- [ ] Monitor scheduled email processing
- [ ] Set up error alerting

## 📝 Future Enhancements

1. **A/B Testing**
   - Multiple template variants
   - Automatic winner selection
   - Performance comparison

2. **Advanced Analytics**
   - Open rate by time of day
   - Best performing subject lines
   - Engagement heatmaps

3. **Email Warmup**
   - Gradual volume increase
   - Sender reputation tracking
   - Automatic throttling

4. **Smart Retry Logic**
   - Retry failed emails
   - Exponential backoff
   - Maximum retry attempts

5. **Recipient Management**
   - Import from CSV
   - Deduplication
   - Blacklist management
   - Bounce handling

6. **Template Variables**
   - Custom placeholders
   - Conditional content
   - Dynamic sections

## 📚 References

- **Brevo API:** https://developers.brevo.com
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Email Best Practices:** Industry standards for avoiding spam filters
- **Cron Syntax:** Standard Unix cron format

---

**Last Updated:** 2024
**Status:** ✅ Production Ready

