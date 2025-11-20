/**
 * Brevo Webhook Handler - TRANSACTIONAL EMAILS ONLY
 * 
 * Receives webhook events from Brevo for ALL NON-CAMPAIGN email delivery tracking:
 * - User notifications (order confirmations, updates)
 * - Admin notifications (alerts, reports)
 * - System emails (password resets, welcome emails)
 * - Test emails (admin sends to arbitrary addresses)
 * - ANY email that's NOT part of a marketing campaign
 * 
 * Campaign emails are handled by Smartlead - see /api/webhooks/smartlead
 * 
 * Events: delivered, opened, clicked, bounced, etc.
 * Documentation: https://developers.brevo.com/docs/webhooks
 */

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

    // Extract tracking IDs from tags
    // Brevo sends tags as array or single tag
    // We now use scheduled_email_id or email_id tags instead of campaign tags
    const allTags = tags || (tag ? [tag] : [])
    console.log(`🏷️  All tags:`, allTags)
    
    // Look for scheduled_email_id tag (preferred)
    const scheduledEmailTag = allTags.find((t: string) => 
      t?.startsWith('scheduled_email_')
    )
    
    let scheduledEmailId: string | null = null
    let campaignId: string | null = null
    
    if (scheduledEmailTag) {
      scheduledEmailId = scheduledEmailTag.replace('scheduled_email_', '')
      console.log(`📧 Scheduled Email ID: ${scheduledEmailId}`)
      
      // Look up campaign_id from scheduled_email
      const { data: scheduledEmail, error: lookupError } = await supabaseAdmin
        .from('brevo_transactional_emails')
        .select('campaign_id')
        .eq('brevo_email_id', scheduledEmailId)
        .single()
      
      if (lookupError || !scheduledEmail) {
        console.warn('⚠️  Could not find campaign for scheduled email:', scheduledEmailId)
      } else {
        campaignId = scheduledEmail.campaign_id
        console.log(`🎯 Campaign ID (from scheduled_email): ${campaignId}`)
      }
    } else if (messageId) {
      // Fallback: try to find by message ID and email
      console.log('🔍 No scheduled_email_id tag, looking up by message ID')
      const { data: scheduledEmail, error: lookupError } = await supabaseAdmin
        .from('brevo_transactional_emails')
        .select('brevo_email_id, campaign_id')
        .eq('brevo_message_id', messageId)
        .eq('recipient_email', email)
        .single()
      
      if (lookupError || !scheduledEmail) {
        console.warn('⚠️  Could not find scheduled email by message ID:', messageId)
      } else {
        scheduledEmailId = scheduledEmail.brevo_email_id
        campaignId = scheduledEmail.campaign_id
        console.log(`📧 Found Scheduled Email ID: ${scheduledEmailId}`)
        console.log(`🎯 Campaign ID: ${campaignId}`)
      }
    }
    
    if (!scheduledEmailId && !campaignId) {
      console.warn('⚠️  Could not determine scheduled_email_id or campaign_id from tags or message ID')
      console.warn('Tags received:', { tags, tag, allTags, messageId, email })
      return { success: false, error: 'No tracking identifiers found' }
    }

    // Map our event type to activity type (only if we have campaignId)
    if (campaignId) {
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
    } else {
      console.log('⚠️  Skipping campaign-specific operations (no campaign_id)')
    }

    // Update brevo_transactional_emails record with Brevo status
    // This uses scheduledEmailId (brevo_email_id) directly if available
    console.log(`📧 Updating Brevo transactional email record...`)
    await updateBrevoTransactionalEmailStatus(scheduledEmailId, campaignId, email, messageId, ourEventType)

    // Record event in email_events history table
    // This uses scheduledEmailId directly if available
    console.log(`📝 Recording event in email_events history...`)
    await recordEmailEvent(scheduledEmailId, campaignId, email, messageId, ourEventType, event)

    console.log(`✅ Event processed successfully`)
    return { 
      success: true, 
      campaignId, 
      scheduledEmailId,
      eventType: ourEventType, 
      email,
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

async function recordEmailEvent(scheduledEmailId: string | null, campaignId: string | null, email: string, messageId: string | undefined, eventType: string, eventData: any) {
  try {
    // If we don't have scheduledEmailId (brevo_email_id), try to find it
    let finalScheduledEmailId = scheduledEmailId
    let finalCampaignId = campaignId
    
    if (!finalScheduledEmailId) {
      let query = supabaseAdmin
        .from('brevo_transactional_emails')
        .select('brevo_email_id, campaign_id')
        .eq('recipient_email', email)
        .eq('status', 'sent')

      if (campaignId) {
        query = query.eq('campaign_id', campaignId)
      }

      if (messageId) {
        query = query.eq('brevo_message_id', messageId)
      }

      const { data: scheduledEmails, error: findError } = await query.limit(1)

      if (findError) {
        console.error(`❌ Error finding Brevo transactional email for event recording:`, findError)
        return
      }

      if (!scheduledEmails || scheduledEmails.length === 0) {
        console.warn(`⚠️  No Brevo transactional email found for event recording. Email: ${email}, MessageID: ${messageId}`)
        return
      }

      finalScheduledEmailId = scheduledEmails[0].brevo_email_id
      finalCampaignId = scheduledEmails[0].campaign_id
    }

    // Extract metadata from event
    const metadata: any = {
      brevo_event_id: eventData.id,
      subject: eventData.subject,
      sending_ip: eventData.sending_ip,
      ts: eventData.ts,
      ts_epoch: eventData.ts_epoch,
      ts_event: eventData.ts_event,
    }

    // Add optional fields if present
    if (eventData.link) metadata.link = eventData.link
    if (eventData.user_agent) metadata.user_agent = eventData.user_agent
    if (eventData.device_used) metadata.device_used = eventData.device_used
    if (eventData.reason) metadata.reason = eventData.reason
    if (eventData.code) metadata.code = eventData.code
    if (eventData.ip) metadata.ip = eventData.ip
    if (eventData.tags) metadata.tags = eventData.tags
    if (eventData.tag) metadata.tag = eventData.tag

    // Determine event timestamp
    const eventTimestamp = eventData.date || 
                          (eventData.ts ? new Date(eventData.ts * 1000).toISOString() : null) ||
                          (eventData.ts_event ? new Date(eventData.ts_event * 1000).toISOString() : null) ||
                          new Date().toISOString()

    // Insert event into email_events table
    const { error: insertError } = await supabaseAdmin
      .from('email_events')
      .insert({
        brevo_email_id: finalScheduledEmailId,
        campaign_id: finalCampaignId,
        event_type: eventType,
        event_timestamp: eventTimestamp,
        recipient_email: email,
        brevo_message_id: messageId,
        metadata
      })

    if (insertError) {
      console.error(`❌ Error inserting email event:`, insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
    } else {
      console.log(`✅ Email event recorded successfully: ${eventType} at ${eventTimestamp}`)
    }
  } catch (error) {
    console.error(`❌ Exception in recordEmailEvent:`, error)
  }
}

async function updateBrevoTransactionalEmailStatus(scheduledEmailId: string | null, campaignId: string | null, email: string, messageId: string | undefined, eventType: string) {
  // Map event types to brevo_status values
  const brevoStatusMapping: Record<string, string> = {
    [EMAIL_EVENT_TYPES.SENT]: 'sent',
    [EMAIL_EVENT_TYPES.DELIVERED]: 'delivered',
    [EMAIL_EVENT_TYPES.OPENED]: 'opened',
    [EMAIL_EVENT_TYPES.UNIQUE_OPENED]: 'opened',
    [EMAIL_EVENT_TYPES.FIRST_OPENING]: 'opened',
    [EMAIL_EVENT_TYPES.CLICKED]: 'clicked',
    [EMAIL_EVENT_TYPES.HARD_BOUNCED]: 'hard_bounce',
    [EMAIL_EVENT_TYPES.SOFT_BOUNCED]: 'soft_bounce',
    [EMAIL_EVENT_TYPES.BLOCKED]: 'blocked',
    [EMAIL_EVENT_TYPES.COMPLAINT]: 'spam',
    [EMAIL_EVENT_TYPES.UNSUBSCRIBED]: 'unsubscribed',
    [EMAIL_EVENT_TYPES.ERROR]: 'error',
  }

  const brevoStatus = brevoStatusMapping[eventType]
  if (!brevoStatus) {
    console.log(`ℹ️  No brevo_status mapping for event type: ${eventType}`)
    return
  }

  // Build update object with timestamp fields based on event type
  const now = new Date().toISOString()
  const updateData: any = {
    brevo_status: brevoStatus,
    updated_at: now
  }

  // Add timestamp fields based on event type
  if (eventType === EMAIL_EVENT_TYPES.DELIVERED) {
    updateData.delivered_at = now
  } else if (eventType === EMAIL_EVENT_TYPES.OPENED || 
             eventType === EMAIL_EVENT_TYPES.UNIQUE_OPENED || 
             eventType === EMAIL_EVENT_TYPES.FIRST_OPENING) {
    updateData.opened_at = now
  } else if (eventType === EMAIL_EVENT_TYPES.CLICKED) {
    updateData.clicked_at = now
  } else if (eventType === EMAIL_EVENT_TYPES.HARD_BOUNCED || 
             eventType === EMAIL_EVENT_TYPES.SOFT_BOUNCED) {
    updateData.bounced_at = now
  } else if (eventType === EMAIL_EVENT_TYPES.COMPLAINT) {
    updateData.spam_reported_at = now
  } else if (eventType === EMAIL_EVENT_TYPES.UNSUBSCRIBED) {
    updateData.unsubscribed_at = now
  }

  // Try to find and update the Brevo transactional email
  // Priority: scheduledEmailId (brevo_email_id) > messageId > campaign + email
  let query = supabaseAdmin
    .from('brevo_transactional_emails')
    .update(updateData)

  if (scheduledEmailId) {
    // Best case: we have the brevo_email_id directly
    query = query.eq('brevo_email_id', scheduledEmailId)
  } else if (messageId) {
    // Second best: we have the Brevo message ID
    query = query.eq('brevo_message_id', messageId)
  } else if (campaignId) {
    // Fallback: find by campaign and recipient email
    query = query
      .eq('campaign_id', campaignId)
      .eq('recipient_email', email)
      .eq('status', 'sent') // Only update sent emails
  } else {
    // Last resort: find by recipient email only
    query = query
      .eq('recipient_email', email)
      .eq('status', 'sent')
  }

  const { data, error } = await query.select()

  if (error) {
    console.error(`❌ Failed to update Brevo transactional email status:`, error)
    console.error('Update error details:', JSON.stringify(error, null, 2))
  } else if (data && data.length > 0) {
    console.log(`✅ Updated ${data.length} Brevo transactional email(s) with brevo_status: ${brevoStatus}`)
    console.log(`   Timestamp fields updated:`, Object.keys(updateData).filter(k => k.endsWith('_at')))
  } else {
    console.log(`ℹ️  No Brevo transactional email found to update. BrevoEmailID: ${scheduledEmailId}, Campaign: ${campaignId}, Email: ${email}`)
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
