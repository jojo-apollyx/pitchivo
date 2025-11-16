import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params
    
    const supabase = await createClient()

    // Get campaign to verify access
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get all email event counts from campaign_activities
    const { data: activities, error: activitiesError } = await supabase
      .from('campaign_activities')
      .select('activity_type')
      .eq('campaign_id', campaignId)
      .like('activity_type', 'email_%')

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return NextResponse.json(
        { error: 'Failed to fetch email statistics' },
        { status: 500 }
      )
    }

    // Count events by type
    const stats: Record<string, number> = {}
    
    activities?.forEach(activity => {
      const eventType = mapActivityTypeToEventType(activity.activity_type)
      if (eventType) {
        stats[eventType] = (stats[eventType] || 0) + 1
      }
    })

    // Also include campaign-level metrics for accuracy
    const campaignStats = {
      sent: campaign.emails_sent || 0,
      delivered: campaign.emails_delivered || 0,
      opened: campaign.emails_opened || 0,
      unique_opened: campaign.emails_unique_opened || 0,
      clicked: campaign.emails_clicked || 0,
      soft_bounced: campaign.emails_soft_bounced || 0,
      hard_bounced: campaign.emails_hard_bounced || 0,
      blocked: campaign.emails_blocked || 0,
      invalid: campaign.emails_invalid || 0,
      complaint: campaign.emails_complaint || 0,
      unsubscribed: campaign.emails_unsubscribed || 0,
      bounced: campaign.emails_bounced || 0,
    }

    // Merge stats, preferring campaign-level metrics if they exist
    const mergedStats = { ...stats, ...campaignStats }

    return NextResponse.json({
      stats: mergedStats,
      campaignId,
      lastUpdated: campaign.updated_at
    })
  } catch (error: any) {
    console.error('Error in email stats API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

function mapActivityTypeToEventType(activityType: string): string | null {
  // Remove 'email_' prefix to get event type
  if (!activityType.startsWith('email_')) return null
  
  return activityType.replace('email_', '')
}

