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
    // We use brevo_email_ tag to find the email record
    const allTags = tags || (tag ? [tag] : [])
    console.log(`🏷️  All tags:`, allTags)
    
    // Look for brevo_email_ tag
    const brevoEmailTag = allTags.find((t: string) => 
      t?.startsWith('brevo_email_')
    )
    
    let brevoEmailId: string | null = null
    let campaignId: string | null = null
    
    if (brevoEmailTag) {
      brevoEmailId = brevoEmailTag.replace('brevo_email_', '')
      console.log(`📧 Brevo Email ID: ${brevoEmailId}`)
      
      // Look up campaign_id from brevo_transactional_emails
      const { data: scheduledEmail, error: lookupError } = await supabaseAdmin
        .from('brevo_transactional_emails')
        .select('campaign_id')
        .eq('brevo_email_id', brevoEmailId)
        .maybeSingle()
      
      if (lookupError || !scheduledEmail) {
        console.warn('⚠️  Could not find brevo transactional email:', brevoEmailId)
      } else {
        campaignId = scheduledEmail.campaign_id
        if (campaignId) {
          console.log(`🎯 Campaign ID (from brevo_transactional_emails): ${campaignId}`)
        }
      }
    } else if (messageId) {
      // Fallback: try to find by message ID and email
      console.log('🔍 No brevo_email_ tag, looking up by message ID')
      
      // Brevo webhooks send message IDs in SMTP format: <id@domain>
      // But Brevo API might return just the ID part
      // Try multiple matching strategies
      let scheduledEmail = null
      let lookupError = null
      
      // Strategy 1: Exact match
      console.log('🔍 Strategy 1: Trying exact message ID match')
      let { data, error } = await supabaseAdmin
        .from('brevo_transactional_emails')
        .select('brevo_email_id, campaign_id')
        .eq('brevo_message_id', messageId)
        .eq('recipient_email', email)
        .maybeSingle()
      
      if (!error && data) {
        scheduledEmail = data
        console.log('✅ Strategy 1: Found email by exact message ID match')
      } else {
        if (error) {
          console.log('❌ Strategy 1: No match (error:', error.message || 'not found)')
        }
        
        // Strategy 2: Try without angle brackets (if present)
        const messageIdWithoutBrackets = messageId.replace(/^<|>$/g, '')
        if (!scheduledEmail && messageIdWithoutBrackets !== messageId) {
          console.log('🔍 Strategy 2: Trying message ID without angle brackets:', messageIdWithoutBrackets)
          const { data: data2, error: error2 } = await supabaseAdmin
            .from('brevo_transactional_emails')
            .select('brevo_email_id, campaign_id')
            .eq('brevo_message_id', messageIdWithoutBrackets)
            .eq('recipient_email', email)
            .maybeSingle()
          
          if (!error2 && data2) {
            scheduledEmail = data2
            console.log('✅ Strategy 2: Found email by message ID without brackets')
          } else if (error2) {
            console.log('❌ Strategy 2: No match')
            lookupError = error2
          }
        }
        
        // Strategy 3: Try matching by extracting core ID from SMTP format
        // Extract the part before @ if it looks like an SMTP message ID
        if (!scheduledEmail && messageId.includes('@')) {
          const coreId = messageId.split('@')[0].replace(/^<|>$/g, '')
          if (coreId && coreId !== messageId && coreId !== messageIdWithoutBrackets) {
            console.log('🔍 Strategy 3: Trying extracted core ID from SMTP format:', coreId)
            const { data: data3, error: error3 } = await supabaseAdmin
              .from('brevo_transactional_emails')
              .select('brevo_email_id, campaign_id')
              .eq('brevo_message_id', coreId)
              .eq('recipient_email', email)
              .maybeSingle()
            
            if (!error3 && data3) {
              scheduledEmail = data3
              console.log('✅ Strategy 3: Found email by extracted core ID')
            } else if (error3) {
              console.log('❌ Strategy 3: No match')
            }
          }
        }
        
        // Strategy 4: Fallback - find by email + subject + recent timestamp (within last 24 hours)
        if (!scheduledEmail && subject) {
          console.log('🔍 Strategy 4: Fallback - Looking up by email + subject + recent timestamp')
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          const { data: data4, error: error4 } = await supabaseAdmin
            .from('brevo_transactional_emails')
            .select('brevo_email_id, campaign_id')
            .eq('recipient_email', email)
            .eq('subject', subject)
            .gte('created_at', oneDayAgo)
            .eq('status', 'sent')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (!error4 && data4) {
            scheduledEmail = data4
            console.log('✅ Strategy 4: Found email by fallback lookup (email + subject + recent timestamp)')
          } else if (error4) {
            console.log('❌ Strategy 4: No match')
          }
        }
        
        // Strategy 5: Last resort - find by email only (most recent sent email within 24 hours)
        if (!scheduledEmail) {
          console.log('🔍 Strategy 5: Last resort - Looking up by email only (most recent)')
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          const { data: data5, error: error5 } = await supabaseAdmin
            .from('brevo_transactional_emails')
            .select('brevo_email_id, campaign_id')
            .eq('recipient_email', email)
            .gte('created_at', oneDayAgo)
            .eq('status', 'sent')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (!error5 && data5) {
            scheduledEmail = data5
            console.log('✅ Strategy 5: Found email by email-only lookup (most recent)')
          } else if (error5) {
            console.log('❌ Strategy 5: No match')
          }
        }
      }
      
      if (scheduledEmail) {
        brevoEmailId = scheduledEmail.brevo_email_id
        campaignId = scheduledEmail.campaign_id
        console.log(`📧 Found Brevo Email ID: ${brevoEmailId}`)
        console.log(`🎯 Campaign ID: ${campaignId}`)
      } else {
        console.warn('⚠️  Could not find brevo transactional email by message ID:', messageId)
        console.warn('   This email may not be tracked in our database (e.g., Supabase Auth emails)')
        if (lookupError) {
          console.warn('   Lookup error:', lookupError)
        }
      }
    }
    
    // If we still don't have any identifiers, we can still record the event
    // but we can't update campaign metrics or transactional email status
    if (!brevoEmailId && !campaignId) {
      console.warn('⚠️  Could not determine brevo_email_id or campaign_id from tags or message ID')
      console.warn('   Tags received:', { tags, tag, allTags, messageId, email })
      console.warn('   This may be an untracked email (e.g., Supabase Auth). Recording event without tracking.')
      
      // Still record the event in brevo_email_events for historical purposes
      // even if we can't link it to a campaign or brevo transactional email
      await recordEmailEvent(null, null, email, messageId, ourEventType, event)
      
      return { 
        success: true, 
        warning: 'Email not found in tracking database, but event was recorded',
        eventType: ourEventType,
        email,
      }
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
    // This uses brevoEmailId (brevo_email_id) directly if available
    console.log(`📧 Updating Brevo transactional email record...`)
    await updateBrevoTransactionalEmailStatus(brevoEmailId, campaignId, email, messageId, ourEventType)

    // Record event in brevo_email_events history table
    // This uses brevoEmailId directly if available
    console.log(`📝 Recording event in brevo_email_events history...`)
    await recordEmailEvent(brevoEmailId, campaignId, email, messageId, ourEventType, event)

    console.log(`✅ Event processed successfully`)
    return { 
      success: true, 
      campaignId, 
      brevoEmailId,
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

async function recordEmailEvent(brevoEmailId: string | null, campaignId: string | null, email: string, messageId: string | undefined, eventType: string, eventData: any) {
  try {
    // If we don't have brevoEmailId (brevo_email_id), try to find it
    let finalBrevoEmailId = brevoEmailId
    let finalCampaignId = campaignId
    
    if (!finalBrevoEmailId) {
      // Try to find by message ID with improved matching
      let scheduledEmails = null
      let findError = null
      
      if (messageId) {
        // Strategy 1: Exact match
        let query = supabaseAdmin
          .from('brevo_transactional_emails')
          .select('brevo_email_id, campaign_id')
          .eq('recipient_email', email)
          .eq('status', 'sent')
          .eq('brevo_message_id', messageId)
        
        if (campaignId) {
          query = query.eq('campaign_id', campaignId)
        }
        
        let { data, error } = await query.limit(1)
        
        if (!error && data && data.length > 0) {
          scheduledEmails = data
        } else {
          // Strategy 2: Try without angle brackets
          const messageIdWithoutBrackets = messageId.replace(/^<|>$/g, '')
          if (messageIdWithoutBrackets !== messageId) {
            query = supabaseAdmin
              .from('brevo_transactional_emails')
              .select('brevo_email_id, campaign_id')
              .eq('recipient_email', email)
              .eq('status', 'sent')
              .eq('brevo_message_id', messageIdWithoutBrackets)
            
            if (campaignId) {
              query = query.eq('campaign_id', campaignId)
            }
            
            const { data: data2, error: error2 } = await query.limit(1)
            if (!error2 && data2 && data2.length > 0) {
              scheduledEmails = data2
            } else {
              findError = error2 || error
            }
          } else {
            findError = error
          }
        }
      } else {
        // No message ID, try by email + campaign
        let query = supabaseAdmin
          .from('brevo_transactional_emails')
          .select('brevo_email_id, campaign_id')
          .eq('recipient_email', email)
          .eq('status', 'sent')
        
        if (campaignId) {
          query = query.eq('campaign_id', campaignId)
        }
        
        const { data, error } = await query.order('created_at', { ascending: false }).limit(1)
        if (!error && data && data.length > 0) {
          scheduledEmails = data
        } else {
          findError = error
        }
      }

      if (findError) {
        console.error(`❌ Error finding Brevo transactional email for event recording:`, findError)
        return
      }

      if (!scheduledEmails || scheduledEmails.length === 0) {
        console.warn(`⚠️  No Brevo transactional email found for event recording. Email: ${email}, MessageID: ${messageId}`)
        return
      }

      finalBrevoEmailId = scheduledEmails[0].brevo_email_id
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

    // Insert event into brevo_email_events table
    const { error: insertError } = await supabaseAdmin
      .from('brevo_email_events')
      .insert({
        brevo_email_id: finalBrevoEmailId,
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

async function updateBrevoTransactionalEmailStatus(brevoEmailId: string | null, campaignId: string | null, email: string, messageId: string | undefined, eventType: string) {
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
  // Priority: brevoEmailId (brevo_email_id) > messageId > campaign + email
  let query = supabaseAdmin
    .from('brevo_transactional_emails')
    .update(updateData)

  if (brevoEmailId) {
    // Best case: we have the brevo_email_id directly
    query = query.eq('brevo_email_id', brevoEmailId)
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
    console.log(`ℹ️  No Brevo transactional email found to update. BrevoEmailID: ${brevoEmailId}, Campaign: ${campaignId}, Email: ${email}`)
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
