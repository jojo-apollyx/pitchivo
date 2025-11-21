import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  console.log('[toggle-processing] Route handler called')
  console.log('[toggle-processing] Request URL:', request.url)
  console.log('[toggle-processing] Request method:', request.method)
  
  try {
    console.log('[toggle-processing] Creating Supabase client')
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    console.log('[toggle-processing] Checking authentication')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[toggle-processing] Authentication failed:', authError?.message || 'No user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[toggle-processing] User authenticated:', user.id)

    // Check if user is admin
    console.log('[toggle-processing] Checking admin status for user:', user.id)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[toggle-processing] Error fetching profile:', profileError)
    }

    if (!profile?.is_pitchivo_admin) {
      console.log('[toggle-processing] User is not admin. is_pitchivo_admin:', profile?.is_pitchivo_admin)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    console.log('[toggle-processing] User is admin, proceeding')

    console.log('[toggle-processing] Extracting params')
    const { campaignId } = await params
    console.log('[toggle-processing] Campaign ID from params:', campaignId)
    
    if (!campaignId) {
      console.log('[toggle-processing] Campaign ID is missing')
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    console.log('[toggle-processing] Parsing request body')
    let body
    try {
      body = await request.json()
      console.log('[toggle-processing] Request body:', JSON.stringify(body))
    } catch (error) {
      console.error('[toggle-processing] Error parsing request body:', error)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    const { paused, reason } = body
    console.log('[toggle-processing] Paused value:', paused, 'Reason:', reason)
    
    if (typeof paused !== 'boolean') {
      console.log('[toggle-processing] Invalid paused type:', typeof paused)
      return NextResponse.json({ error: 'paused must be a boolean' }, { status: 400 })
    }

    // Get current campaign state
    console.log('[toggle-processing] Fetching campaign:', campaignId)
    const { data: campaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('admin_processing_paused, campaign_name, smartlead_campaign_id, status')
      .eq('campaign_id', campaignId)
      .maybeSingle()

    if (fetchError) {
      console.error('[toggle-processing] Error fetching campaign:', fetchError)
    }
    
    if (fetchError || !campaign) {
      console.log('[toggle-processing] Campaign not found. Error:', fetchError?.message, 'Campaign:', campaign)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    
    console.log('[toggle-processing] Campaign found:', campaign.campaign_name, 'Current paused state:', campaign.admin_processing_paused)
    console.log('[toggle-processing] Campaign Smartlead ID:', campaign.smartlead_campaign_id)
    console.log('[toggle-processing] Campaign current status:', campaign.status)

    // If campaign is synced with Smartlead, update status there too
    if (campaign.smartlead_campaign_id) {
      console.log('[toggle-processing] Campaign is synced with Smartlead, updating Smartlead status')
      const smartlead = createSmartleadClient()
      
      try {
        const smartleadStatus = paused ? 'PAUSED' : 'START'
        console.log('[toggle-processing] Calling Smartlead API to update status:', {
          smartlead_campaign_id: campaign.smartlead_campaign_id,
          new_status: smartleadStatus,
        })

        let result
        if (paused) {
          result = await smartlead.pauseCampaign(campaign.smartlead_campaign_id.toString())
        } else {
          result = await smartlead.resumeCampaign(campaign.smartlead_campaign_id.toString())
        }

        if (!result.success) {
          console.error('[toggle-processing] Failed to update Smartlead status:', {
            error: result.error,
            smartlead_campaign_id: campaign.smartlead_campaign_id,
            status: smartleadStatus,
          })
          // Continue with database update even if Smartlead fails
        } else {
          console.log('[toggle-processing] Smartlead status updated successfully:', smartleadStatus)
        }
      } catch (error) {
        console.error('[toggle-processing] Error calling Smartlead API:', error)
        // Continue with database update even if Smartlead fails
      }
    } else {
      console.log('[toggle-processing] Campaign not synced with Smartlead, skipping Smartlead API call')
    }

    // Update the pause state in database
    const updateData: any = {
      admin_processing_paused: paused,
      updated_at: new Date().toISOString()
    }

    // Also update campaign status if synced with Smartlead
    if (campaign.smartlead_campaign_id) {
      updateData.status = paused ? 'paused' : 'active'
    }

    if (paused) {
      // Pausing
      updateData.admin_pause_reason = reason || null
      updateData.admin_paused_at = new Date().toISOString()
      updateData.admin_paused_by = user.id
      console.log('[toggle-processing] Pausing campaign')
    } else {
      // Unpausing - clear pause fields
      updateData.admin_pause_reason = null
      updateData.admin_paused_at = null
      updateData.admin_paused_by = null
      console.log('[toggle-processing] Unpausing campaign')
    }

    console.log('[toggle-processing] Update data:', JSON.stringify(updateData))
    console.log('[toggle-processing] Updating campaign in database:', campaignId)
    const { error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('campaign_id', campaignId)

    if (updateError) {
      console.error('[toggle-processing] Error updating campaign:', updateError)
      return NextResponse.json(
        { error: 'Failed to update campaign', details: updateError.message },
        { status: 500 }
      )
    }
    
    console.log('[toggle-processing] Campaign updated successfully in database')

    return NextResponse.json({
      success: true,
      paused,
      message: paused 
        ? `Campaign processing paused - emails will not be sent by cron job`
        : `Campaign processing resumed - emails will be sent normally`
    })
  } catch (error: any) {
    console.error('[toggle-processing] Unexpected error:', error)
    console.error('[toggle-processing] Error stack:', error?.stack)
    return NextResponse.json(
      { error: 'Failed to toggle processing', details: error.message },
      { status: 500 }
    )
  }
}

