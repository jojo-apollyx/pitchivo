/**
 * Unsubscribe Lead API
 * POST /api/admin/campaigns/[campaignId]/leads/[leadId]/unsubscribe
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      return NextResponse.json({ error: 'Campaign not synced with Smartlead' }, { status: 400 })
    }

    // Call Smartlead API to unsubscribe lead
    // API Reference: POST /campaigns/{campaign_id}/leads/{lead_id}/unsubscribe
    const response = await fetch(
      `https://server.smartlead.ai/api/v1/campaigns/${campaign.smartlead_campaign_id}/leads/${leadId}/unsubscribe?api_key=${process.env.SMARTLEAD_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[Unsubscribe Lead API] Smartlead error:', error)
      throw new Error('Failed to unsubscribe lead in Smartlead')
    }

    // Update local database
    const { error: updateError } = await supabase
      .from('campaign_leads')
      .update({ 
        status: 'unsubscribed',
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)

    if (updateError) {
      console.error('[Unsubscribe Lead API] Database error:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead unsubscribed successfully'
    })

  } catch (error) {
    console.error('[Unsubscribe Lead API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to unsubscribe lead',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

