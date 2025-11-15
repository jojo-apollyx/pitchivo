import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
    const { campaignId, metric, increment } = body

    // Validate input
    if (!campaignId || !metric || increment === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: campaignId, metric, increment' },
        { status: 400 }
      )
    }

    // Validate metric name
    const allowedMetrics = [
      'emails_sent',
      'emails_delivered',
      'emails_opened',
      'emails_clicked',
      'emails_bounced',
      'rfqs_received'
    ]

    if (!allowedMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Allowed: ${allowedMetrics.join(', ')}` },
        { status: 400 }
      )
    }

    // Get current campaign
    const { data: campaign, error: fetchError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    if (fetchError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Calculate new value
    const currentValue = campaign[metric] || 0
    const newValue = Math.max(0, currentValue + increment) // Don't go below 0

    // Update campaign
    const { error: updateError } = await supabaseAdmin
      .from('campaigns')
      .update({
        [metric]: newValue,
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaignId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      campaignId,
      metric,
      oldValue: currentValue,
      newValue,
      increment
    })
  } catch (error: any) {
    console.error('Error updating campaign metric:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

