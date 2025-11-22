/**
 * Pause Lead API
 * POST /api/admin/campaigns/[campaignId]/leads/[leadId]/pause
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; leadId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, leadId } = await params

    // Get campaign to get smartlead_campaign_id
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

    // Call Smartlead API to pause lead
    // API Reference: POST /campaigns/{campaign_id}/leads/{lead_id}/pause
    const smartlead = createSmartleadClient()
    const result = await smartlead.pauseLead(campaign.smartlead_campaign_id.toString(), leadId)

    if (!result.success) {
      console.error('[Pause Lead API] Smartlead error:', result.error)
      throw new Error(result.error?.message || 'Failed to pause lead')
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('campaign_leads')
      .update({ 
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)

    if (updateError) {
      console.error('[Pause Lead API] Database error:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead paused successfully'
    })

  } catch (error) {
    console.error('[Pause Lead API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to pause lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

