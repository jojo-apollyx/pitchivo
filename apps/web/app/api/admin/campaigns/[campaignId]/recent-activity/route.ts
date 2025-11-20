/**
 * Campaign Recent Activity API
 * GET /api/admin/campaigns/[campaignId]/recent-activity
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20')

    // Get recent activity from campaign_activities or email_events
    const { data: activities, error } = await supabase
      .from('campaign_activities')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({
      success: true,
      activities: activities || []
    })

  } catch (error) {
    console.error('[Recent Activity API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to load recent activity',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

