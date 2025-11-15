# Admin Campaign Management Implementation

## ✅ Completed Implementation

### 1. Admin Campaign Page
**File:** `apps/web/app/admin/campaigns/page.tsx`

A comprehensive admin interface for managing all campaigns across all organizations:

#### Features:
- **Campaign List (Left Panel)**
  - Shows all campaigns from all organizations
  - Displays campaign name, status, and organization
  - Click to select and view details
  - Real-time status badges (active, scheduled, completed, etc.)

- **Campaign Details (Right Panel)**
  - Full campaign information
  - Organization and product details
  - Launch timestamp

- **Metrics Dashboard with Manual Controls**
  - **Emails Sent**: Track total emails sent with +/- buttons
  - **Emails Opened**: Track opens with open rate percentage
  - **Emails Clicked**: Track clicks with click rate percentage
  - **RFQs Received**: Track conversions
  - Each metric has increment/decrement buttons for manual updates

- **Email Composition & Sending**
  - **Recipient Email**: Input any arbitrary email address
  - **Subject Line**: Custom subject for each email
  - **Email Content**: Multi-line textarea for email body
  - **Send Button**: Sends email and auto-increments metrics
  - Validates email format before sending

### 2. API Endpoints

#### Send Campaign Email
**File:** `apps/web/app/api/admin/campaigns/send/route.ts`

- **Method**: POST
- **Auth**: Admin only
- **Payload**:
  ```json
  {
    "campaignId": "uuid",
    "to": "email@company.com",
    "subject": "Email subject",
    "content": "Email content"
  }
  ```
- **Features**:
  - Validates admin permissions
  - Validates email format
  - Sends HTML formatted email via Brevo/SendinBlue
  - Includes campaign tracking footer
  - Returns success confirmation

#### Update Campaign Metrics
**File:** `apps/web/app/api/admin/campaigns/metrics/route.ts`

- **Method**: POST
- **Auth**: Admin only
- **Payload**:
  ```json
  {
    "campaignId": "uuid",
    "metric": "emails_sent",
    "increment": 1
  }
  ```
- **Allowed Metrics**:
  - `emails_sent`
  - `emails_delivered`
  - `emails_opened`
  - `emails_clicked`
  - `emails_bounced`
  - `rfqs_received`
- **Features**:
  - Uses Supabase admin client (bypasses RLS)
  - Validates metric names
  - Prevents negative values
  - Updates timestamp
  - Returns old and new values

### 3. Navigation Integration
**File:** `apps/web/components/admin/admin-sidebar.tsx`

Campaign management is already included in the admin navigation:
- Icon: Mail (✉️)
- Label: "Campaigns Overview"
- Route: `/admin/campaigns`

## 🎯 Key Features

### Email Sending
1. Admin selects a campaign
2. Enters recipient email (any arbitrary email)
3. Writes custom subject and content
4. Clicks "Send Email"
5. System sends email via Brevo
6. Automatically increments "Emails Sent" and "Emails Delivered"
7. Form clears and metrics update

### Manual Metrics Updates
Each metric has +/- buttons to:
- Increment metric by 1
- Decrement metric by 1
- Updates are instant via API
- Prevents negative values
- Useful for:
  - Testing and demos
  - Manual corrections
  - Simulating campaign progress

### Real-time Statistics
- **Open Rate**: (Opens / Sent) × 100%
- **Click Rate**: (Clicks / Sent) × 100%
- **Progress**: Sent / Total planned
- All percentages auto-calculate on display

## 📊 Admin Workflow

```
1. Navigate to /admin/campaigns
   ↓
2. View list of all campaigns (all orgs)
   ↓
3. Select a campaign
   ↓
4. View current metrics
   ↓
5. Option A: Send Email
   - Enter recipient email
   - Write subject & content
   - Click "Send Email"
   - Metrics auto-update
   
   Option B: Manual Update
   - Click +/- on any metric
   - Instant update via API
   - View updated statistics
```

## 🔐 Security

- All endpoints require admin authentication
- Uses `requireAdmin()` from `/lib/auth`
- Admin Supabase client bypasses RLS for metrics API
- Email validation before sending
- Metric name validation (whitelist only)

## 📧 Email Format

Emails are sent with:
- HTML formatting (paragraphs, line breaks)
- Responsive design (mobile-optimized)
- Professional styling
- Campaign tracking footer
- Plain text fallback

Example email structure:
```html
<!DOCTYPE html>
<html>
  <body>
    <div class="container">
      <div class="content">
        [User's email content with HTML formatting]
      </div>
      <div class="footer">
        This email was sent via Pitchivo Campaign Management
        Campaign ID: [campaign-uuid]
      </div>
    </div>
  </body>
</html>
```

## 🎨 Design System Compliance

Follows DESIGN_SYSTEM.md guidelines:
- ✅ Mobile-first responsive design
- ✅ Touch-optimized buttons (44px min height)
- ✅ Integral design (no card borders)
- ✅ Sticky headers with border dividers
- ✅ CSS variables for colors
- ✅ Subtle hover effects
- ✅ Proper spacing (px-4 sm:px-6 lg:px-8)

## 📱 Responsive Layout

### Desktop (lg:)
- 3-column layout
  - Left: Campaign list (1/3)
  - Right: Details + actions (2/3)
- Sticky sections
- Ample spacing

### Mobile (<lg)
- Single column stack
- Campaign list on top
- Details below
- Touch-optimized controls

## 🚀 Usage Examples

### Send a Campaign Email
1. Admin logs in to `/admin/campaigns`
2. Selects "Collagen Peptide Campaign"
3. Enters recipient: `buyer@vitalproteins.com`
4. Enters subject: "Premium Collagen Peptides Available"
5. Writes email content
6. Clicks "Send Email"
7. Email is sent via Brevo
8. "Emails Sent" increments from 5 → 6
9. "Emails Delivered" increments from 5 → 6
10. Form clears for next email

### Manually Update Metrics
1. Admin views campaign metrics
2. Clicks "+" next to "Emails Opened"
3. Metric updates from 10 → 11
4. Open rate recalculates automatically
5. Clicks "-" to correct if needed

### Track Campaign Performance
- View open rate: 48% (24 opens / 50 sent)
- View click rate: 17% (8 clicks / 50 sent)
- View RFQs: 12 conversions
- Monitor progress: 50/500 emails sent

## 🔄 Integration with User Campaign Flow

The admin campaign page integrates with the user-created campaigns:

1. **User Creates Campaign** (via `/dashboard/campaigns/create/*`)
   - Selects product
   - Reviews audience
   - Configures sending
   - Launches campaign
   
2. **Campaign Created in DB**
   - Initial metrics: all 0
   - Status: "scheduled" or "active"
   
3. **Admin Manages Campaign** (via `/admin/campaigns`)
   - Views campaign across all orgs
   - Sends emails to buyers
   - Updates metrics manually
   - Tracks performance

## 📈 Metrics Tracking

All metrics are stored in the `campaigns` table:

```sql
-- Automatically updated
emails_sent        -- Incremented when email is sent
emails_delivered   -- Incremented when email is delivered

-- Manually updated (for now)
emails_opened      -- Track email opens
emails_clicked     -- Track link clicks
emails_bounced     -- Track bounces
rfqs_received      -- Track RFQ submissions
```

## 🎉 Complete Feature Set

✅ **Admin Campaign Page**
- View all campaigns across organizations
- Select and manage individual campaigns
- Real-time metrics display

✅ **Email Composition**
- Custom recipient (any email)
- Custom subject line
- Multi-line content editor
- Send via API

✅ **Metrics Management**
- Manual increment/decrement controls
- Real-time calculation of rates
- API-powered updates
- Validation and error handling

✅ **Security & Permissions**
- Admin-only access
- Validated inputs
- Service role for metrics
- RLS bypass for admin operations

✅ **Design System Compliance**
- Mobile-first responsive
- Touch-optimized
- Follows integral design principles
- Professional styling

The admin campaign management system is fully functional and ready to use!

