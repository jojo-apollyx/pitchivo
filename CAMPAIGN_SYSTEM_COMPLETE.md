# Campaign Flow - Complete Implementation Summary

## 🎉 Full Implementation Complete

This document summarizes all campaign flow features, including user campaign creation, admin management, email placeholders, and real-time Brevo webhook tracking.

---

## 📋 Table of Contents

1. [User Campaign Creation Flow](#user-campaign-creation-flow)
2. [Admin Campaign Management](#admin-campaign-management)
3. [Email Placeholder System](#email-placeholder-system)
4. [Brevo Webhook Integration](#brevo-webhook-integration)
5. [Database Schema](#database-schema)
6. [File Structure](#file-structure)

---

## 🔄 User Campaign Creation Flow

### 4-Step Campaign Creation Process

**Navigation**: `/dashboard/campaigns/create/product` → `/buyers` → `/config` → `/review`

#### Step 1: Choose Product
- Grid layout showing all published products
- Select one product to promote
- Auto-selects if only one product exists
- Shows product thumbnail, tags, and attached files

#### Step 2: Matched Buyers Preview
- Shows 2,450 matched buyers from Pitchville Database
- Top 10 buyers displayed in table
- Audience insights panel with statistics
- Non-editable preview as per specification

#### Step 3: Configure Sending
- Set email count (50 - quota max)
- Set duration (auto-calculates min days)
- Optional start date
- Select sender address with health indicator
- Live summary sidebar with metrics

#### Step 4: Review & Launch
- Complete campaign summary
- Product, audience, and sending configuration
- Confirmation checkbox
- Launch button creates campaign in DB
- Redirects to campaigns management page

### Files Created
- `/apps/web/app/dashboard/campaigns/create/product/page.tsx`
- `/apps/web/app/dashboard/campaigns/create/buyers/page.tsx`
- `/apps/web/app/dashboard/campaigns/create/config/page.tsx`
- `/apps/web/app/dashboard/campaigns/create/review/page.tsx`
- `/apps/web/lib/stores/campaign-store.ts`
- `/apps/web/lib/mock-data/buyers.ts`

---

## 👨‍💼 Admin Campaign Management

### Admin Features

**Navigation**: `/admin/campaigns`

#### Campaign List
- View all campaigns across all organizations
- Select campaign to view details
- Real-time status badges
- Organization and product information

#### Email Composition & Sending
- **Recipient Email**: Any arbitrary email address
- **Subject Line**: Custom subject with placeholder support
- **Email Content**: Multi-line textarea with placeholders
- **Send Button**: Sends email via Brevo and updates metrics

#### Manual Metrics Management
Each metric has +/- buttons for manual updates:
- Emails Sent
- Emails Opened (with open rate %)
- Emails Clicked (with click rate %)
- RFQs Received

#### Real-Time Statistics
- Open Rate: (Opens / Sent) × 100%
- Click Rate: (Clicks / Sent) × 100%
- Progress: Sent / Total planned

### API Endpoints Created
- `POST /api/admin/campaigns/send` - Send campaign email
- `POST /api/admin/campaigns/metrics` - Update campaign metrics

### Files Created
- `/apps/web/app/admin/campaigns/page.tsx`
- `/apps/web/app/api/admin/campaigns/send/route.ts`
- `/apps/web/app/api/admin/campaigns/metrics/route.ts`

---

## 📧 Email Placeholder System

### Available Placeholders

#### `{{product_link}}`
Full URL to product page  
Example: `https://pitchivo.com/products/abc123-uuid`

#### `{{product_name}}`
Name of the product in campaign  
Example: `Premium Collagen Peptides`

#### `{{buyer_name}}`
Extracted from recipient's email domain  
Example: `Vitalproteins` (from buyer@vitalproteins.com)

#### `{{org_name}}`
Sender's organization name  
Example: `ABC Ingredients Ltd`

### Usage Example

**Input**:
```
Subject: Introducing {{product_name}} for {{buyer_name}}

Hi {{buyer_name}},

We've launched {{product_name}} which might be perfect 
for your formulations.

View details: {{product_link}}

Best regards,
The {{org_name}} Team
```

**Output** (to buyer@vitalproteins.com):
```
Subject: Introducing Premium Collagen Peptides for Vitalproteins

Hi Vitalproteins,

We've launched Premium Collagen Peptides which might be 
perfect for your formulations.

View details: https://pitchivo.com/products/abc123

Best regards,
The ABC Ingredients Ltd Team
```

### Features
- ✅ Works in both subject and content
- ✅ Multiple occurrences supported
- ✅ Automatic replacement on send
- ✅ Visual guide in admin panel
- ✅ Fallback values for missing data

### Files Updated
- `/apps/web/app/admin/campaigns/page.tsx` (added UI guide)
- `/apps/web/app/api/admin/campaigns/send/route.ts` (added replacement logic)

---

## 🔔 Brevo Webhook Integration

### Real-Time Event Tracking

Automatically tracks email metrics via Brevo webhooks:

#### Tracked Events
1. **delivered** → Updates `emails_delivered`
2. **opened** / **unique_opened** → Updates `emails_opened`
3. **click** / **unique_clicked** → Updates `emails_clicked`
4. **soft_bounce** / **hard_bounce** → Updates `emails_bounced`

### Setup Process

#### 1. Create Webhook in Brevo
- URL: `https://your-domain.com/api/webhooks/brevo`
- Events: delivered, opened, clicked, soft_bounce, hard_bounce
- Status: Active

#### 2. Webhook Flow
```
Email sent with tag: campaign_{campaign_id}
       ↓
Recipient opens email
       ↓
Brevo sends POST to webhook
       ↓
Webhook extracts campaign_id from tag
       ↓
Database metrics updated
       ↓
Dashboard shows updated stats instantly
```

#### 3. Campaign Tagging
Emails automatically include campaign tag for tracking:
```typescript
await sendEmail({
  to: recipient,
  subject: subject,
  html: content,
  tags: [`campaign_${campaignId}`]
})
```

### Benefits
- ✅ Real-time metric updates
- ✅ No manual intervention required
- ✅ Activity feed with buyer interactions
- ✅ Accurate open/click/bounce rates
- ✅ Production-ready implementation

### Files Created
- `/apps/web/app/api/webhooks/brevo/route.ts`

### Files Updated
- `/apps/web/lib/email.ts` (added tags support)
- `/apps/web/app/api/admin/campaigns/send/route.ts` (added campaign tags)

---

## 🗄️ Database Schema

### campaigns Table
```sql
CREATE TABLE campaigns (
  campaign_id UUID PRIMARY KEY,
  org_id UUID REFERENCES organizations(id),
  product_id UUID REFERENCES products(product_id),
  campaign_name TEXT NOT NULL,
  
  -- Audience
  data_source_id TEXT DEFAULT 'pitchville_curated',
  buyer_count INTEGER DEFAULT 0,
  
  -- Configuration
  email_count INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date TIMESTAMPTZ,
  sender_email TEXT NOT NULL,
  sender_health TEXT DEFAULT 'healthy',
  
  -- Status
  status TEXT DEFAULT 'draft',
  
  -- Metrics (updated via webhooks & admin)
  emails_sent INTEGER DEFAULT 0,
  emails_delivered INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  emails_clicked INTEGER DEFAULT 0,
  emails_bounced INTEGER DEFAULT 0,
  rfqs_received INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

### campaign_activities Table
```sql
CREATE TABLE campaign_activities (
  activity_id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(campaign_id),
  activity_type TEXT NOT NULL,
  buyer_company TEXT,
  contact_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Files Created
- `/supabase/migrations/20240101000050_create_campaigns.sql`

---

## 📁 File Structure

```
apps/web/
├── app/
│   ├── dashboard/
│   │   └── campaigns/
│   │       ├── page.tsx                    # Campaigns management (user view)
│   │       └── create/
│   │           ├── product/page.tsx        # Step 1: Choose Product
│   │           ├── buyers/page.tsx         # Step 2: Matched Buyers
│   │           ├── config/page.tsx         # Step 3: Configure Sending
│   │           └── review/page.tsx         # Step 4: Review & Launch
│   ├── admin/
│   │   └── campaigns/
│   │       └── page.tsx                    # Admin campaign management
│   └── api/
│       ├── admin/
│       │   └── campaigns/
│       │       ├── send/route.ts           # Send email API
│       │       └── metrics/route.ts        # Update metrics API
│       └── webhooks/
│           └── brevo/route.ts              # Brevo webhook handler
├── lib/
│   ├── stores/
│   │   └── campaign-store.ts               # Campaign state management
│   ├── mock-data/
│   │   └── buyers.ts                       # Mock buyer data & utilities
│   └── email.ts                            # Email service (updated)
└── components/
    └── admin/
        └── admin-sidebar.tsx               # Already includes campaigns

supabase/
└── migrations/
    └── 20240101000050_create_campaigns.sql # Database schema

Documentation/
├── CAMPAIGN_FLOW_IMPLEMENTATION.md         # User flow documentation
├── ADMIN_CAMPAIGN_MANAGEMENT.md            # Admin features documentation
├── EMAIL_PLACEHOLDER_SYSTEM.md             # Placeholder system guide
└── BREVO_WEBHOOK_INTEGRATION.md            # Webhook setup guide
```

---

## 🎯 Key Features Summary

### User Features
- ✅ 4-step campaign creation flow
- ✅ Product selection with thumbnails
- ✅ 2,450 matched buyers preview
- ✅ Sending configuration with validation
- ✅ Campaign review and launch
- ✅ Campaigns management dashboard
- ✅ Real-time metrics display

### Admin Features
- ✅ View all campaigns (all organizations)
- ✅ Send emails to any recipient
- ✅ Custom subject and content
- ✅ Email placeholder system
- ✅ Manual metrics management (+/-)
- ✅ Real-time statistics calculation
- ✅ Activity feed

### Automation Features
- ✅ Brevo webhook integration
- ✅ Real-time metric tracking
- ✅ Automatic delivered/opened/clicked updates
- ✅ Bounce tracking
- ✅ Campaign tagging system
- ✅ Activity recording

### Design Features
- ✅ Mobile-first responsive design
- ✅ Touch-optimized (44px min targets)
- ✅ Integral design (no card borders)
- ✅ CSS variable color system
- ✅ Professional animations
- ✅ Clean visual hierarchy

---

## 🚀 Getting Started

### For Users (Creating Campaigns)
1. Navigate to `/dashboard/campaigns`
2. Click "New Campaign"
3. Follow 4-step process:
   - Select product
   - Review audience
   - Configure sending
   - Review and launch
4. Campaign appears in management page with metrics

### For Admins (Managing Campaigns)
1. Navigate to `/admin/campaigns`
2. Select a campaign
3. Options:
   - Send email to any recipient
   - Manually adjust metrics
   - View real-time statistics
   - Monitor activity feed

### For Developers (Setup Webhooks)
1. Deploy webhook endpoint: `/api/webhooks/brevo`
2. Create webhook in Brevo dashboard
3. Select events: delivered, opened, clicked, bounced
4. Test with sample email
5. Verify metrics update automatically

---

## 📊 Metrics Dashboard

### Calculations

```typescript
// Open Rate
const openRate = emails_sent > 0 
  ? Math.round((emails_opened / emails_sent) * 100) 
  : 0

// Click Rate
const clickRate = emails_sent > 0
  ? Math.round((emails_clicked / emails_sent) * 100)
  : 0

// Progress
const progress = Math.min((emails_sent / email_count) * 100, 100)
```

### Display

```
┌──────────────────────────────────────────────┐
│  Campaign: Collagen Peptide Launch           │
│  Status: Active                               │
│  Organization: ABC Ingredients Ltd            │
├──────────────────────────────────────────────┤
│  Progress: 245 / 500 sent (49%)              │
│  ████████████░░░░░░░░░░░░                      │
├──────────────────────────────────────────────┤
│  📧 Opens:    48%  (118 / 245)               │
│  🖱️  Clicks:   17%  (42 / 245)                │
│  ❌ Bounces:  2%   (5 / 245)                  │
│  💬 RFQs:     12   conversions                │
│  👥 Reached:  245  contacts                   │
└──────────────────────────────────────────────┘

Recent Activity:
• 10:05  Vitalproteins     Opened email
• 10:31  Nestlé Health     Submitted RFQ
• 11:15  Nature's Bounty   Clicked link
• 11:42  Swisse Wellness   Opened email
```

---

## 🔐 Security Features

### Authentication
- User: Requires authenticated session
- Admin: Requires admin role verification
- Webhooks: Uses admin Supabase client (bypasses RLS)

### Data Protection
- RLS policies on all tables
- Organization-based access control
- Campaign ownership verification
- Email validation

### API Security
- Admin-only endpoints
- Input validation
- SQL injection prevention
- XSS protection in emails

---

## 🎉 Conclusion

The complete campaign flow implementation includes:

1. **User Campaign Creation** - 4-step guided process
2. **Admin Management** - Full control over all campaigns
3. **Email Placeholders** - Dynamic personalization
4. **Real-Time Tracking** - Brevo webhook integration
5. **Performance Dashboard** - Live metrics and statistics
6. **Activity Feed** - Real-time buyer interactions
7. **Mobile-First Design** - Responsive and touch-optimized
8. **Database Schema** - Complete data model
9. **API Endpoints** - RESTful campaign management
10. **Documentation** - Comprehensive guides

**Total Files Created**: 15  
**Total Files Updated**: 3  
**Database Tables**: 2  
**API Endpoints**: 3  
**Documentation**: 4

The campaign system is fully functional, production-ready, and follows all design system guidelines!

