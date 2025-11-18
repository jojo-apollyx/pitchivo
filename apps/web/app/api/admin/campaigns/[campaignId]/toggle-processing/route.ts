import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  try {
    const supabase = createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('org_role')
      .eq('id', user.id)
      .single()

    if (profile?.org_role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { campaignId } = params
    const body = await request.json()
    const { paused, reason } = body

    // Get current campaign state
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('admin_processing_paused, campaign_name')
      .eq('campaign_id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Update the pause state
    const updateData: any = {
      admin_processing_paused: paused,
      updated_at: new Date().toISOString()
    }

    if (paused) {
      // Pausing
      updateData.admin_pause_reason = reason || null
      updateData.admin_paused_at = new Date().toISOString()
      updateData.admin_paused_by = user.id
    } else {
      // Unpausing - clear pause fields
      updateData.admin_pause_reason = null
      updateData.admin_paused_at = null
      updateData.admin_paused_by = null
    }

    const { error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('campaign_id', campaignId)

    if (updateError) {
      console.error('Error updating campaign:', updateError)
      return NextResponse.json(
        { error: 'Failed to update campaign', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paused,
      message: paused 
        ? `Campaign processing paused - emails will not be sent by cron job`
        : `Campaign processing resumed - emails will be sent normally`
    })
  } catch (error: any) {
    console.error('Error toggling campaign processing:', error)
    return NextResponse.json(
      { error: 'Failed to toggle processing', details: error.message },
      { status: 500 }
    )
  }
}

