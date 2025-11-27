/**
 * Notifications API
 * Fetches recent RFQs and completed campaigns for notifications
 * Also returns which notifications have been read
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({
        rfqs: [],
        campaigns: [],
        readIds: [],
      })
    }

    // Fetch recent RFQs (last 10, ordered by submitted_at)
    const { data: rfqs } = await supabase
      .from('product_rfqs')
      .select('rfq_id, name, company, submitted_at, status, product_id')
      .eq('org_id', profile.organization_id)
      .order('submitted_at', { ascending: false })
      .limit(10)

    // Fetch recent completed campaigns (last 10, ordered by completed_at)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('campaign_id, campaign_name, completed_at, product_id')
      .eq('org_id', profile.organization_id)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(10)

    // Fetch read notifications for this user
    const { data: readNotifications } = await supabase
      .from('notification_reads')
      .select('notification_type, notification_id')
      .eq('user_id', user.id)

    // Create a set of read notification IDs
    const readIds = new Set<string>()
    if (readNotifications) {
      readNotifications.forEach((read) => {
        readIds.add(`${read.notification_type}:${read.notification_id}`)
      })
    }

    // Format RFQs
    const formattedRFQs = (rfqs || []).map((rfq) => ({
      id: rfq.rfq_id,
      type: 'rfq' as const,
      title: `New RFQ from ${rfq.name}`,
      description: `${rfq.company}`,
      timestamp: rfq.submitted_at,
      href: rfq.status === 'new' ? `/dashboard/rfqs?status=new` : `/dashboard/rfqs`,
      metadata: {
        rfq_id: rfq.rfq_id,
        product_id: rfq.product_id,
        status: rfq.status,
      },
    }))

    // Format campaigns
    const formattedCampaigns = (campaigns || []).map((campaign) => ({
      id: campaign.campaign_id,
      type: 'campaign' as const,
      title: `Campaign completed: ${campaign.campaign_name}`,
      description: 'Your campaign has finished running',
      timestamp: campaign.completed_at!,
      href: `/dashboard/campaigns/${campaign.campaign_id}`,
      metadata: {
        campaign_id: campaign.campaign_id,
        product_id: campaign.product_id,
      },
    }))

    return NextResponse.json({
      rfqs: formattedRFQs,
      campaigns: formattedCampaigns,
      readIds: Array.from(readIds),
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

/**
 * Mark notification as read
 * POST /api/notifications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notificationType, notificationId } = body

    if (!notificationType || !notificationId) {
      return NextResponse.json(
        { error: 'notificationType and notificationId are required' },
        { status: 400 }
      )
    }

    if (!['rfq', 'campaign'].includes(notificationType)) {
      return NextResponse.json(
        { error: 'Invalid notificationType. Must be "rfq" or "campaign"' },
        { status: 400 }
      )
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check if already read
    const { data: existing } = await supabase
      .from('notification_reads')
      .select('read_id')
      .eq('user_id', user.id)
      .eq('notification_type', notificationType)
      .eq('notification_id', notificationId)
      .maybeSingle()

    if (existing) {
      // Already read, just update timestamp
      const { error } = await supabase
        .from('notification_reads')
        .update({ read_at: new Date().toISOString() })
        .eq('read_id', existing.read_id)

      if (error) {
        console.error('Error updating notification read:', error)
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        )
      }
    } else {
      // Insert new read record
      const { error } = await supabase
        .from('notification_reads')
        .insert({
          user_id: user.id,
          org_id: profile.organization_id,
          notification_type: notificationType,
          notification_id: notificationId,
          read_at: new Date().toISOString(),
        })

      if (error) {
        // If it's a unique constraint violation, it means another request already inserted it
        // In that case, it's fine - the notification is already marked as read
        if (error.code === '23505') { // PostgreSQL unique violation
          // Already exists, which is fine
          return NextResponse.json({ success: true })
        }
        
        console.error('Error marking notification as read:', error)
        return NextResponse.json(
          { error: 'Failed to mark notification as read' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    )
  }
}

