# Admin Campaign Management Refactoring (2025)

## Overview
Complete refactoring of admin campaign management into a cleaner, more organized structure with proper Brevo 2025 API integration.

## 🎯 New Structure

### 1. Main Admin Page (`/admin/campaigns`)
**Clean Overview Interface**

#### Features:
- **Search & Filter**
  - Search by campaign name, company, product
  - Filter by status (All, Active, Scheduled, Paused, Completed)
  - Status counts in dropdown

- **Campaign Cards**
  - Campaign name with icon
  - Organization and product info
  - Launch date
  - Key statistics grid:
    - Sent (X of Y)
    - Delivery Rate (%)
    - Open Rate (%)
    - RFQs (count + click rate)

- **Quick Actions**
  - **Status Dropdown** - Update campaign status inline
  - **View Details** Button → Goes to tracking page
  - **Settings** Button → Goes to settings page

#### Benefits:
- ✅ Not crowded - one card per campaign
- ✅ All important info at a glance
- ✅ Clear navigation to detailed pages
- ✅ Quick status updates without leaving page

### 2. Campaign Tracking Page (`/admin/campaigns/[id]/tracking`)
**Detailed Email Event Tracking**

#### Features:
- Campaign info summary
- **Email Event Analytics**
  - All 15 Brevo events displayed
  - Color-coded status badges
  - Hover tooltips explaining each status
  - Summary statistics (success rate, engagement, etc.)

- **Email Schedule & Status**
  - List of all scheduled emails
  - Each email shows:
    - Scheduled time
    - Recipient
    - Status (pending/sent/failed/cancelled)
    - Send Now button (for pending)
    - Cancel button

#### Benefits:
- ✅ Dedicated page for tracking
- ✅ Not cluttered with send/template features
- ✅ Focus on analytics and monitoring
- ✅ Easy to see each email's status

### 3. Campaign Settings Page (`/admin/campaigns/[id]/settings`)
**Email Management Hub**

#### Features:
- **Default Template Indicator** (top banner)
  - Shows which template is currently set as default
  - "Load Template" button to apply it
  - Star icon to indicate default

- **Tabbed Interface:**
  1. **Send Email**
     - Shows current default template being used
     - Recipient input
     - Subject and content (auto-populated from default)
     - Placeholder reference
     - Send immediately button

  2. **Quality Check**
     - AI spam risk analysis
     - Real-time feedback
     - Score and suggestions

  3. **Templates**
     - Info box explaining how templates work
     - Create new templates
     - Set default template
     - Load template into send form
     - Clear "Use" buttons

  4. **Batch Schedule**
     - Bulk email scheduling
     - Smart distribution algorithm
     - Auto-schedule feature

#### Template Management - How It Works:
1. **Creating Templates**
   - Click "Templates" tab
   - Click "New Template"
   - Fill name, subject, content
   - Check "Set as default" if desired
   - Save

2. **Default Template**
   - Only ONE template can be default per campaign
   - Default template auto-loads when you go to "Send Email"
   - Shown in banner at top of settings page
   - Star icon indicates it's the default

3. **Using Templates**
   - Templates tab shows all templates
   - Each has "Use" button
   - Click "Use" → loads into send form
   - Can edit before sending

#### Benefits:
- ✅ Clear template workflow
- ✅ Visual indication of default template
- ✅ Easy to understand and use
- ✅ All email features in one place
- ✅ Separate from tracking/analytics

## 📊 Navigation Flow

```
/admin/campaigns (Main Page)
├── Search & Filter campaigns
├── View campaign cards with stats
├── Quick status updates
│
├─→ Click "View Details"
│   └─→ /admin/campaigns/[id]/tracking
│       ├── Email event analytics
│       ├── All 15 Brevo statuses
│       └── Scheduled emails list
│
└─→ Click "Settings"
    └─→ /admin/campaigns/[id]/settings
        ├── Default template banner
        ├── Send Email (with templates)
        ├── Quality Check
        ├── Templates Management
        └── Batch Schedule
```

## 🔗 Brevo 2025 API Integration

### Webhook Handler (`/api/webhooks/brevo`)

#### Updated for 2025:
- Handles both single events and batch arrays
- Returns detailed results for each event processed
- Better error handling with specific error messages
- Supports all Brevo event types:
  - `request` → sent
  - `delivered` → delivered
  - `opened` → opened
  - `click` → clicked
  - `hard_bounce` → hard_bounced
  - `soft_bounce` → soft_bounced
  - `blocked` → blocked
  - `spam` / `complaint` → complaint
  - `unsubscribe` → unsubscribed
  - `deferred` → deferred
  - `error` → error

#### Event Format:
```json
{
  "event": "delivered",
  "email": "recipient@example.com",
  "message-id": "msg-id-123",
  "date": "2025-01-16T10:00:00Z",
  "tags": ["campaign_uuid-here"],
  "subject": "Email subject",
  ...
}
```

#### Tag Format:
- Must include: `campaign_[campaignId]`
- Example: `campaign_550e8400-e29b-41d4-a716-446655440000`
- Webhook extracts campaignId to update correct campaign

### Setup Checklist:
1. ✅ Webhook URL: `https://yourdomain.com/api/webhooks/brevo`
2. ✅ Enable all event types in Brevo dashboard
3. ✅ Include tags in webhook payload
4. ✅ Test with each event type

## 🎨 Template System

### How Templates Work:

#### Default Template:
- Automatically loads when opening "Send Email" tab
- Indicated with star icon (⭐)
- Banner at top shows which template is default
- Only one default per campaign

#### Loading Templates:
1. **Automatic (Default)**
   - Go to Settings → Send Email tab
   - Default template auto-populates subject & content
   - Badge shows template name

2. **Manual (Any Template)**
   - Go to Settings → Templates tab
   - Find template you want
   - Click "Use" button
   - Switches to Send Email tab
   - Template loaded into form

#### Creating Templates:
```
1. Settings → Templates tab
2. Click "New Template"
3. Enter template name (e.g., "Initial Outreach")
4. Enter subject line
5. Enter content (with placeholders)
6. Check "Set as default" if desired
7. Click "Save Template"
```

#### Template Features:
- Supports all placeholders
- Can be edited after loading
- Version control (name with dates/versions)
- Clear indication of which is default

## 📋 File Structure

```
apps/web/app/admin/campaigns/
├── page.tsx                           # NEW: Clean main overview
├── [campaignId]/
│   ├── tracking/
│   │   └── page.tsx                   # NEW: Detailed tracking
│   └── settings/
│       └── page.tsx                   # NEW: Email management

# Reusable Components (unchanged)
apps/web/components/admin/
├── email-quality-checker.tsx
├── email-template-manager.tsx
├── scheduled-emails-viewer.tsx
└── batch-email-scheduler.tsx

apps/web/components/email/
├── email-status-badge.tsx
└── email-event-stats.tsx
```

## 🔄 Migration from Old Structure

### Before (Crowded):
- Single page with everything
- Hard to find specific features
- Email sending mixed with analytics
- Template system unclear

### After (Clean):
- Main page: Overview & navigation
- Tracking page: Analytics only
- Settings page: Email management only
- Clear template workflow

## 🚀 Benefits

### For Admins:
- ✅ Faster navigation
- ✅ Clear organization
- ✅ Easy to find features
- ✅ Better workflow
- ✅ Understand template system

### For Users:
- ✅ Less overwhelming
- ✅ Focused pages
- ✅ Clear call-to-actions
- ✅ Intuitive navigation

### For Developers:
- ✅ Modular code
- ✅ Easier to maintain
- ✅ Clear separation of concerns
- ✅ Reusable components

## 📝 Key Improvements

1. **Template Clarity**
   - Default template banner
   - Star icon for default
   - "Use" buttons on all templates
   - Info box explaining workflow

2. **Navigation**
   - Main → Details or Settings
   - Back buttons on all pages
   - Breadcrumb-style flow

3. **Organization**
   - Analytics separate from management
   - Each feature has its place
   - No feature overload on single page

4. **Brevo Integration**
   - 2025 API compliance
   - All 15 events tracked
   - Better error handling
   - Detailed logging

## 🎯 Usage Examples

### Example 1: Check Campaign Performance
```
1. Go to /admin/campaigns
2. See all campaigns with key stats
3. Click "View Details" on campaign
4. See detailed event tracking
5. Review each email's status
```

### Example 2: Send Test Email
```
1. Go to /admin/campaigns
2. Click "Settings" on campaign
3. Default template auto-loads
4. Enter recipient email
5. Click "Send Email Immediately"
```

### Example 3: Create & Use Template
```
1. Settings → Templates tab
2. Read info box about how templates work
3. Click "New Template"
4. Enter details, check "Set as default"
5. Save template
6. See star icon on new template
7. Banner at top shows it's now default
8. Go to "Send Email" tab
9. Template already loaded!
```

---

**Last Updated:** January 2025
**Status:** ✅ Production Ready
**Brevo API:** 2025 Version

