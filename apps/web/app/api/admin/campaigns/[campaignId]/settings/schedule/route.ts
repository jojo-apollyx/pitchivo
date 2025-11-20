/**
 * Campaign Schedule Settings API
 * POST /api/admin/campaigns/[campaignId]/settings/schedule
 * 
 * Updates campaign schedule settings in Smartlead
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { campaignId } = await params
    const body = await request.json()

    // Get campaign to retrieve smartlead_campaign_id
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('smartlead_campaign_id')
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (!campaign.smartlead_campaign_id) {
      return NextResponse.json({ error: 'Campaign not synced with Smartlead' }, { status: 400 })
    }

    // Update schedule settings in Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.updateCampaignSchedule(
      campaign.smartlead_campaign_id.toString(),
      {
        timezone: body.timezone,
        days_of_the_week: body.days_of_the_week,
        start_hour: body.start_hour,
        end_hour: body.end_hour,
        min_time_btw_emails: body.min_time_btw_emails,
        max_new_leads_per_day: body.max_new_leads_per_day,
      }
    )

    if (!result.success) {
      console.error('[Campaign Schedule Settings API] Smartlead error:', result.error)
      throw new Error(result.error?.message || 'Failed to update schedule settings')
    }

    // Update local database cache (optional)
    await supabase
      .from('campaigns')
      .update({
        timezone: body.timezone,
        sending_days: body.days_of_the_week,
        sending_hours: {
          start: body.start_hour,
          end: body.end_hour,
        },
        min_time_between_emails: body.min_time_btw_emails,
        max_leads_per_day: body.max_new_leads_per_day,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)

    return NextResponse.json({
      success: true,
      message: 'Campaign schedule settings updated successfully',
      data: result.data
    })

  } catch (error) {
    console.error('[Campaign Schedule Settings API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update campaign schedule settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

