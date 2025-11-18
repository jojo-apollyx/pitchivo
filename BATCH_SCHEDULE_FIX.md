# Batch Schedule Fix - Admin Campaign Management

## Date: November 18, 2025

## Issues Fixed

### 1. ✅ Doesn't Check Existing Scheduled Emails
**Problem:** The batch scheduler ignored emails already scheduled for each day, potentially exceeding daily limits.

**Example Issue:**
- 50 emails scheduled for Day 1
- Admin batch schedules 30 more
- System tries to put all 30 on Day 1
- Total: 80 emails on Day 1 (exceeds 50-email limit)

**Solution:**
- Fetch all existing scheduled emails for the campaign
- Group them by date to count emails per day
- Pass this data to the schedule calculator
- Deduct existing emails from daily capacity before scheduling new ones

**Code Changes:**
```typescript
// Fetch existing scheduled emails (lines 134-143)
const { data: existingEmails } = await supabaseAdmin
  .from('scheduled_emails')
  .select('scheduled_time')
  .eq('campaign_id', campaignId)
  .in('status', ['pending', 'sent'])

// Group by date (lines 145-153)
const existingEmailsByDate: Record<string, number> = {}
existingEmails?.forEach(email => {
  const dateKey = formatDate(email.scheduled_time)
  existingEmailsByDate[dateKey] = (existingEmailsByDate[dateKey] || 0) + 1
})

// In calculateSafeSchedule (lines 301-312)
const existingEmailsToday = existingEmailsByDate[dateKey] || 0
const remainingCapacityToday = Math.max(0, dailyLimit - existingEmailsToday)

// Skip days with no capacity
if (remainingCapacityToday === 0) {
  currentDate.setDate(currentDate.getDate() + 1)
  continue
}
```

### 2. ✅ Uses Old Campaign Start Date
**Problem:** Used `campaign.start_date` even if it was in the past, causing emails to be scheduled with past timestamps.

**Example Issue:**
- Campaign started 3 days ago
- Admin batch schedules today
- System uses old start date → schedules emails 3 days in the past

**Solution:**
- Compare campaign start date with current date
- Use current date if campaign start date is in the past
- Use campaign start date only if it's in the future

**Code Changes:**
```typescript
// Determine actual start date (lines 155-158)
const now = new Date()
const campaignStartDate = campaign.start_date ? new Date(campaign.start_date) : now
const actualStartDate = campaignStartDate < now ? now : campaignStartDate
```

### 3. ✅ No Awareness of Campaign Progress
**Problem:** Didn't check if campaign was already running or account for progress made.

**Solution:**
- Query existing scheduled/sent emails to understand campaign state
- Calculate remaining capacity based on what's already scheduled
- Start scheduling from "now" if campaign is already in progress
- Provide feedback to admin about existing emails

**Code Changes:**
```typescript
// Query includes both pending AND sent emails (line 139)
.in('status', ['pending', 'sent'])

// Admin feedback in response (lines 237-250)
stats: {
  ...stats,
  existingEmailsConsidered: totalExistingEmails,
  daysWithExistingEmails,
  startDateUsed: actualStartDate.toISOString(),
  usedCurrentDate: actualStartDate !== campaignStartDate
}
```

## Files Modified

### 1. `/apps/web/app/api/admin/campaigns/auto-schedule/route.ts`

**Changes:**
- Added logic to fetch existing scheduled emails (lines 134-153)
- Modified date calculation to use "now" when appropriate (lines 155-158)
- Updated `ScheduleOptions` interface to include `existingEmailsByDate` (line 258)
- Enhanced `calculateSafeSchedule` to respect daily capacity (lines 298-312)
- Added debug logging for troubleshooting (lines 160-177)
- Enhanced response with detailed stats (lines 237-250)

### 2. `/apps/web/components/admin/batch-email-scheduler.tsx`

**Changes:**
- Enhanced success message to show existing emails considered (lines 198-202)
- Added indicator when scheduling started from current date (lines 203-207)
- Better visual feedback for admin

## How It Works Now

### Scenario 1: Fresh Campaign
```
Campaign start: Tomorrow
Existing emails: 0
New batch: 100 emails

Result:
✓ Starts tomorrow
✓ Schedules all 100 emails
✓ Respects daily limits (e.g., 50/day = 2 days)
```

### Scenario 2: Running Campaign
```
Campaign start: 3 days ago
Existing emails: 
  - Day 1: 45 emails (sent)
  - Day 2: 50 emails (sent)
  - Today: 30 emails (pending)
New batch: 50 emails

Result:
✓ Starts from today (not 3 days ago)
✓ Today has 30 existing → schedules 20 more (total 50)
✓ Tomorrow: 30 more emails
✓ Shows admin: "Accounted for 120 existing scheduled emails"
```

### Scenario 3: Day at Full Capacity
```
Campaign start: Today
Existing emails:
  - Today: 50 emails (pending)
Daily limit: 50
New batch: 30 emails

Result:
✓ Skips today (already at capacity)
✓ Starts tomorrow with all 30 emails
✓ Shows admin: "Accounted for 50 existing scheduled emails"
```

## Testing Checklist

- [x] Fresh campaign with no existing emails
- [x] Campaign with past start date
- [x] Campaign with existing scheduled emails
- [x] Day at full capacity (should skip to next day)
- [x] Day partially filled (should fill remaining capacity)
- [x] Weekend handling (should skip weekends)
- [x] Response includes existing email counts
- [x] UI shows appropriate feedback messages

## Admin Visibility

The admin now sees:
- ✅ Total emails scheduled in this batch
- ✅ Number of existing emails considered
- ✅ Whether scheduling started from today (vs campaign start date)
- ✅ Date range for the schedule
- ✅ Daily average

Example success message:
```
✓ Schedule Created
Total Emails Scheduled: 30
Start Date: 2025-11-18
End Date: 2025-11-19
Total Days: 2
Avg/Day: 15
ℹ️ Accounted for 50 existing scheduled emails
📅 Started from today (campaign start date was in the past)
```

## Debug Logging

Added console logs for troubleshooting:
```
[Auto-Schedule] Campaign: <campaign_id>
[Auto-Schedule] Campaign start date: <date>
[Auto-Schedule] Actual start date used: <date>
[Auto-Schedule] Existing emails by date: {...}
[Auto-Schedule] Recipients to schedule: <count>
[Auto-Schedule] Schedule calculated: <count> emails
```

## Impact

✅ **No more exceeding daily limits** - System respects existing emails  
✅ **No more past timestamps** - Always schedules from now or future  
✅ **Campaign-aware** - Understands progress and continues smartly  
✅ **Better admin UX** - Clear feedback about what happened  
✅ **Debuggable** - Logs show exactly what's happening  

## Related Files

### Fixed
- ✅ `/apps/web/app/api/admin/campaigns/auto-schedule/route.ts` - **PRIMARY** scheduling endpoint used by BatchEmailScheduler
- ✅ `/apps/web/components/admin/batch-email-scheduler.tsx` - UI component for batch scheduling

### Related (Not Modified)
- `/apps/web/app/api/admin/campaigns/schedule/route.ts` - Alternative scheduling endpoint (simpler, not used by BatchEmailScheduler component)
- `/apps/web/app/api/admin/campaigns/scheduled-emails/route.ts` - Endpoint for viewing/managing scheduled emails
- `/apps/web/app/admin/campaigns/[campaignId]/settings/page.tsx` - Parent page that renders BatchEmailScheduler
- `/apps/web/components/admin/campaign-email-management.tsx` - Related email management component
- `/apps/web/components/admin/scheduled-emails-viewer.tsx` - Component for viewing scheduled emails

## Note on Other Schedule Endpoint

The file `/apps/web/app/api/admin/campaigns/schedule/route.ts` exists but is **not used** by the BatchEmailScheduler component. It has a simpler `calculateEmailSchedule` function that also doesn't account for existing emails or past start dates. If this endpoint is used elsewhere in the system, it would need similar fixes. However, the primary admin workflow uses the auto-schedule endpoint which has now been fixed.

