/**
 * Campaign Behavior Settings API
 * POST /api/admin/campaigns/[campaignId]/settings/behavior
 * 
 * Updates campaign behavior settings in Smartlead
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
      return NextResponse.json({ error: 'Campaign not configured' }, { status: 400 })
    }

    // Update behavior settings in Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.updateCampaignSettings(
      campaign.smartlead_campaign_id.toString(),
      {
        stop_lead_settings: body.stop_lead_settings,
        send_as_plain_text: body.send_as_plain_text,
        follow_up_percentage: body.follow_up_percentage,
      }
    )

    if (!result.success) {
      console.error('[Campaign Behavior Settings API] Smartlead error:', result.error)
      throw new Error(result.error?.message || 'Failed to update behavior settings')
    }

    // Update local database cache (optional)
    await supabase
      .from('campaigns')
      .update({
        stop_on_reply: body.stop_lead_settings === 'REPLY_TO_AN_EMAIL',
        stop_on_click: body.stop_lead_settings === 'CLICK_ON_A_LINK',
        stop_on_open: body.stop_lead_settings === 'OPEN_AN_EMAIL',
        send_as_plain_text: body.send_as_plain_text,
        follow_up_percentage: body.follow_up_percentage,
        updated_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)

    return NextResponse.json({
      success: true,
      message: 'Campaign behavior settings updated successfully',
      data: result.data
    })

  } catch (error) {
    console.error('[Campaign Behavior Settings API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update campaign behavior settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

