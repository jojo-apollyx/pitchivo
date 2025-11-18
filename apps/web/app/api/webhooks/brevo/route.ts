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
  const startTime = Date.now()
  
  try {
    console.log('============================================')
    console.log('🔔 BREVO WEBHOOK RECEIVED')
    console.log('Timestamp:', new Date().toISOString())
    console.log('Headers:', {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
      'authorization': request.headers.get('authorization') ? 'Bearer [PRESENT]' : '[MISSING]',
    })
    
    const body = await request.json()
    
    console.log('📦 Raw payload:', JSON.stringify(body, null, 2))

    // Brevo can send single event or array of events
    // Brevo 2025 API sends events in this format:
    // Single: { event: "delivered", email: "...", ... }
    // Batch: [{ event: "...", ... }, { event: "...", ... }]
    const events = Array.isArray(body) ? body : [body]
    console.log(`📊 Processing ${events.length} event(s)`)

    const results = []
    for (let i = 0; i < events.length; i++) {
      console.log(`\n--- Processing Event ${i + 1}/${events.length} ---`)
      const result = await processBrevoEvent(events[i])
      results.push(result)
      console.log(`Result:`, result.success ? '✅ SUCCESS' : '❌ FAILED', result)
    }

    const duration = Date.now() - startTime
    console.log(`\n⏱️ Total processing time: ${duration}ms`)
    console.log('✅ WEBHOOK PROCESSING COMPLETE')
    console.log('============================================\n')

    return NextResponse.json({ 
      success: true, 
      processed: events.length,
      results,
      processingTimeMs: duration,
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error('============================================')
    console.error('❌ ERROR PROCESSING BREVO WEBHOOK')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error.message)
    console.error('Stack trace:', error.stack)
    console.error(`⏱️ Failed after: ${duration}ms`)
    console.error('============================================\n')
    
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

    console.log(`📧 Event Type: ${eventType}`)
    console.log(`👤 Recipient: ${email}`)
    console.log(`📬 Message ID: ${messageId || 'N/A'}`)
    console.log(`📅 Date: ${date || (ts ? new Date(ts * 1000).toISOString() : 'N/A')}`)

    // Map Brevo event to our event type
    // Brevo 2025 uses: delivered, request, opened, click, hard_bounce, soft_bounce, etc.
    const normalizedEvent = eventType?.toLowerCase().replace(/-/g, '_')
    console.log(`🔄 Normalized event: ${normalizedEvent}`)
    
    const ourEventType = BREVO_EVENT_MAP[normalizedEvent]

    if (!ourEventType) {
      console.warn(`⚠️  Unknown Brevo event type: ${eventType}`)
      console.warn('Available mappings:', Object.keys(BREVO_EVENT_MAP))
      return { success: false, error: 'Unknown event type', eventType }
    }
    
    console.log(`✅ Mapped to our event type: ${ourEventType}`)

    // Extract campaign ID from tags
    // Brevo sends tags as array or single tag
    const allTags = tags || (tag ? [tag] : [])
    console.log(`🏷️  All tags:`, allTags)
    
    const campaignTag = allTags.find((t: string) => 
      t?.startsWith('campaign_')
    )
    
    if (!campaignTag) {
      console.warn('⚠️  No campaign tag found in event')
      console.warn('Tags received:', { tags, tag, allTags })
      return { success: false, error: 'No campaign tag' }
    }

    const campaignId = campaignTag.replace('campaign_', '')
    console.log(`🎯 Campaign ID: ${campaignId}`)

    // Map our event type to activity type
    const activityType = mapEventToActivityType(ourEventType)
    console.log(`📝 Activity type: ${activityType}`)

    // Create activity record
    console.log(`💾 Inserting activity record into database...`)
    const { error: insertError } = await supabaseAdmin
      .from('campaign_activities')
      .insert({
        campaign_id: campaignId,
        activity_type: activityType,
        contact_email: email,
        metadata: {
          event: ourEventType,
          messageId,
          timestamp: date || (ts ? new Date(ts * 1000).toISOString() : new Date().toISOString()),
          reason,
          link,
          ip,
          subject,
          custom,
          ...rest
        }
      })

    if (insertError) {
      console.error('❌ Error inserting activity:', insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
    } else {
      console.log('✅ Activity record created successfully')
    }

    // Update campaign metrics based on event type
    console.log(`📊 Updating campaign metrics...`)
    await updateCampaignMetrics(campaignId, ourEventType)

    // Handle specific events
    console.log(`🔧 Handling special events...`)
    await handleSpecialEvents(campaignId, ourEventType, email, event)

    console.log(`✅ Event processed successfully`)
    return { 
      success: true, 
      campaignId, 
      eventType: ourEventType, 
      email,
      activityType,
    }

  } catch (error) {
    console.error('❌ Error processing individual event')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('Event data:', JSON.stringify(event, null, 2))
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    }
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
  if (!metric) {
    console.log(`ℹ️  No metric mapping for event type: ${eventType}`)
    return
  }

  console.log(`📈 Incrementing metric: ${metric}`)
  
  const { data, error } = await supabaseAdmin.rpc('increment_campaign_metric', {
    p_campaign_id: campaignId,
    p_metric: metric,
    p_increment: 1
  })

  if (error) {
    console.error(`❌ Failed to increment metric ${metric}:`, error)
    console.error('RPC error details:', JSON.stringify(error, null, 2))
  } else {
    console.log(`✅ Metric ${metric} incremented successfully`)
    if (data) console.log('RPC response:', data)
  }

  // Also update old emails_bounced metric for hard/soft bounces
  if (eventType === EMAIL_EVENT_TYPES.HARD_BOUNCED || eventType === EMAIL_EVENT_TYPES.SOFT_BOUNCED) {
    console.log(`📈 Also incrementing emails_bounced (legacy metric)`)
    
    const { data: bounceData, error: bounceError } = await supabaseAdmin.rpc('increment_campaign_metric', {
      p_campaign_id: campaignId,
      p_metric: 'emails_bounced',
      p_increment: 1
    })

    if (bounceError) {
      console.error('❌ Failed to increment emails_bounced:', bounceError)
      console.error('RPC error details:', JSON.stringify(bounceError, null, 2))
    } else {
      console.log('✅ emails_bounced incremented successfully')
      if (bounceData) console.log('RPC response:', bounceData)
    }
  }
}

async function handleSpecialEvents(campaignId: string, eventType: string, email: string, event: any) {
  // Handle unsubscribes - add to suppression list
  if (eventType === EMAIL_EVENT_TYPES.UNSUBSCRIBED) {
    console.log(`🚫 UNSUBSCRIBE EVENT`)
    console.log(`   Campaign: ${campaignId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Reason: ${event.reason || 'Not specified'}`)
    // TODO: Add to suppression list or mark contact as unsubscribed
  }

  // Handle spam complaints - serious issue
  if (eventType === EMAIL_EVENT_TYPES.COMPLAINT) {
    console.warn(`⚠️  🚨 SPAM COMPLAINT 🚨`)
    console.warn(`   Campaign: ${campaignId}`)
    console.warn(`   Email: ${email}`)
    console.warn(`   This is a CRITICAL issue that needs immediate attention!`)
    console.warn(`   Event details:`, JSON.stringify(event, null, 2))
    // TODO: Alert admins, add to suppression list
  }

  // Handle hard bounces - invalid email
  if (eventType === EMAIL_EVENT_TYPES.HARD_BOUNCED || eventType === EMAIL_EVENT_TYPES.INVALID) {
    console.log(`❌ HARD BOUNCE / INVALID EMAIL`)
    console.log(`   Campaign: ${campaignId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Reason: ${event.reason || 'Not specified'}`)
    console.log(`   Code: ${event.code || 'N/A'}`)
    // TODO: Mark email as invalid in database
  }

  // Handle blocks
  if (eventType === EMAIL_EVENT_TYPES.BLOCKED) {
    console.warn(`🛑 EMAIL BLOCKED`)
    console.warn(`   Campaign: ${campaignId}`)
    console.warn(`   Email: ${email}`)
    console.warn(`   Reason: ${event.reason || 'Not specified'}`)
  }

  // Handle deferrals (temporary issues)
  if (eventType === EMAIL_EVENT_TYPES.DEFERRED) {
    console.log(`⏸️  EMAIL DEFERRED (will retry)`)
    console.log(`   Campaign: ${campaignId}`)
    console.log(`   Email: ${email}`)
    console.log(`   Reason: ${event.reason || 'Not specified'}`)
  }
}

// GET endpoint for webhook verification (if needed by Brevo)
export async function GET(request: NextRequest) {
  console.log('ℹ️  Brevo webhook verification/health check requested')
  console.log('Timestamp:', new Date().toISOString())
  console.log('Request URL:', request.url)
  console.log('User-Agent:', request.headers.get('user-agent'))
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Brevo webhook endpoint is active',
    timestamp: new Date().toISOString(),
    version: '2.0',
  })
}
