import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { BREVO_EVENT_MAP, EMAIL_EVENT_TYPES } from '@/lib/constants/email-events'

// Create admin Supabase client
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
    const body = await request.json()
    
    console.log('Brevo webhook received:', JSON.stringify(body, null, 2))

    // Brevo sends events as an array
    const events = Array.isArray(body) ? body : [body]

    for (const event of events) {
      await processBrevoEvent(event)
    }

    return NextResponse.json({ success: true, processed: events.length })
  } catch (error: any) {
    console.error('Error processing Brevo webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

async function processBrevoEvent(event: any) {
  try {
    const {
      event: eventType,
      email,
      'message-id': messageId,
      date,
      ts,
      tag,
      tags,
      subject,
      reason,
      link,
      ip,
      'X-Mailin-custom': custom,
      ...rest
    } = event

    console.log(`Processing event: ${eventType} for ${email}`)

    // Map Brevo event to our event type
    const normalizedEvent = eventType?.toLowerCase().replace(/-/g, '_')
    const ourEventType = BREVO_EVENT_MAP[normalizedEvent]

    if (!ourEventType) {
      console.warn(`Unknown Brevo event type: ${eventType}`)
      return
    }

    // Extract campaign ID from tags
    const campaignTag = (Array.isArray(tags) ? tags : [tag]).find((t: string) => 
      t?.startsWith('campaign_')
    )
    
    if (!campaignTag) {
      console.warn('No campaign tag found in event')
      return
    }

    const campaignId = campaignTag.replace('campaign_', '')

    // Map our event type to activity type
    const activityType = mapEventToActivityType(ourEventType)

    // Create activity record
    await supabaseAdmin
      .from('campaign_activities')
      .insert({
        campaign_id: campaignId,
        activity_type: activityType,
        contact_email: email,
        metadata: {
          event: ourEventType,
          messageId,
          timestamp: date || new Date(ts * 1000).toISOString(),
          reason,
          link,
          ip,
          subject,
          custom,
          ...rest
        }
      })

    // Update campaign metrics based on event type
    await updateCampaignMetrics(campaignId, ourEventType)

    // Handle specific events
    await handleSpecialEvents(campaignId, ourEventType, email, event)

  } catch (error) {
    console.error('Error processing individual event:', error)
    // Don't throw - continue processing other events
  }
}

function mapEventToActivityType(eventType: string): string {
  // Map our event types to database activity types
  const mapping: Record<string, string> = {
    [EMAIL_EVENT_TYPES.SENT]: 'email_sent',
    [EMAIL_EVENT_TYPES.DELIVERED]: 'email_delivered',
    [EMAIL_EVENT_TYPES.OPENED]: 'email_opened',
    [EMAIL_EVENT_TYPES.CLICKED]: 'email_clicked',
    [EMAIL_EVENT_TYPES.SOFT_BOUNCED]: 'email_soft_bounced',
    [EMAIL_EVENT_TYPES.HARD_BOUNCED]: 'email_hard_bounced',
    [EMAIL_EVENT_TYPES.BLOCKED]: 'email_blocked',
    [EMAIL_EVENT_TYPES.INVALID]: 'email_invalid',
    [EMAIL_EVENT_TYPES.UNIQUE_OPENED]: 'email_unique_opened',
    [EMAIL_EVENT_TYPES.FIRST_OPENING]: 'email_first_opening',
    [EMAIL_EVENT_TYPES.LOADED_BY_PROXY]: 'email_loaded_by_proxy',
    [EMAIL_EVENT_TYPES.COMPLAINT]: 'email_complaint',
    [EMAIL_EVENT_TYPES.UNSUBSCRIBED]: 'email_unsubscribed',
    [EMAIL_EVENT_TYPES.DEFERRED]: 'email_deferred',
    [EMAIL_EVENT_TYPES.ERROR]: 'email_error',
  }

  return mapping[eventType] || 'email_sent'
}

async function updateCampaignMetrics(campaignId: string, eventType: string) {
  // Map event types to campaign metric fields
  const metricMapping: Record<string, string> = {
    [EMAIL_EVENT_TYPES.SENT]: 'emails_sent',
    [EMAIL_EVENT_TYPES.DELIVERED]: 'emails_delivered',
    [EMAIL_EVENT_TYPES.OPENED]: 'emails_opened',
    [EMAIL_EVENT_TYPES.UNIQUE_OPENED]: 'emails_unique_opened',
    [EMAIL_EVENT_TYPES.CLICKED]: 'emails_clicked',
    [EMAIL_EVENT_TYPES.SOFT_BOUNCED]: 'emails_soft_bounced',
    [EMAIL_EVENT_TYPES.HARD_BOUNCED]: 'emails_hard_bounced',
    [EMAIL_EVENT_TYPES.BLOCKED]: 'emails_blocked',
    [EMAIL_EVENT_TYPES.INVALID]: 'emails_invalid',
    [EMAIL_EVENT_TYPES.COMPLAINT]: 'emails_complaint',
    [EMAIL_EVENT_TYPES.UNSUBSCRIBED]: 'emails_unsubscribed',
  }

  const metric = metricMapping[eventType]
  if (!metric) return

  await supabaseAdmin.rpc('increment_campaign_metric', {
    p_campaign_id: campaignId,
    p_metric: metric,
    p_increment: 1
  }).catch(err => {
    console.error(`Failed to increment metric ${metric}:`, err)
  })

  // Also update old emails_bounced metric for hard/soft bounces
  if (eventType === EMAIL_EVENT_TYPES.HARD_BOUNCED || eventType === EMAIL_EVENT_TYPES.SOFT_BOUNCED) {
    await supabaseAdmin.rpc('increment_campaign_metric', {
      p_campaign_id: campaignId,
      p_metric: 'emails_bounced',
      p_increment: 1
    }).catch(err => {
      console.error('Failed to increment emails_bounced:', err)
    })
  }
}

async function handleSpecialEvents(campaignId: string, eventType: string, email: string, event: any) {
  // Handle unsubscribes - add to suppression list
  if (eventType === EMAIL_EVENT_TYPES.UNSUBSCRIBED) {
    // TODO: Add to suppression list or mark contact as unsubscribed
    console.log(`Unsubscribe event for ${email}`)
  }

  // Handle spam complaints - serious issue
  if (eventType === EMAIL_EVENT_TYPES.COMPLAINT) {
    console.warn(`SPAM COMPLAINT for campaign ${campaignId} from ${email}`)
    // TODO: Alert admins, add to suppression list
  }

  // Handle hard bounces - invalid email
  if (eventType === EMAIL_EVENT_TYPES.HARD_BOUNCED || eventType === EMAIL_EVENT_TYPES.INVALID) {
    console.log(`Hard bounce/invalid email: ${email}`)
    // TODO: Mark email as invalid in database
  }
}

// GET endpoint for webhook verification (if needed by Brevo)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'ok',
    message: 'Brevo webhook endpoint is active'
  })
}
