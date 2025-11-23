/**
 * Smartlead Webhook Handler
 * 
 * Receives webhook events from Smartlead for campaign email tracking
 * Events: sent, delivered, opened, clicked, bounced, replied, unsubscribed
 * 
 * Documentation: https://docs.smartlead.ai/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
);

/**
 * Smartlead Webhook Event Types
 * Reference: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
 * 
 * Official Smartlead webhook event types (from API documentation):
 * - EMAIL_SENT: When an email is sent
 * - EMAIL_OPEN: When a lead opens an email (note: EMAIL_OPEN, not EMAIL_OPENED)
 * - EMAIL_LINK_CLICK: When a lead clicks a link in an email (note: EMAIL_LINK_CLICK, not LINK_CLICKED)
 * - EMAIL_REPLY: When a lead replies to an email
 * - LEAD_UNSUBSCRIBED: When a lead unsubscribes
 * - LEAD_CATEGORY_UPDATED: When lead category/status changes
 * 
 * Additional event types that may be sent (not in official docs but referenced elsewhere):
 * - EMAIL_BOUNCE: When an email bounces
 * - EMAIL_DELIVERED: When an email is delivered
 * - THREADED_REPLIES: For threaded conversation replies
 * - CAMPAIGN_STATUS_CHANGE: When campaign status changes
 * - CAMPAIGN_DELETED: When a campaign is deleted
 * - CAMPAIGN_UPDATED: When campaign settings are updated
 * - UNTRACKED_REPLIES: Replies that aren't tracked
 * - MANUAL_STEP_REACHED: When manual step is reached in sequence
 */
const SMARTLEAD_EVENT_TYPES = {
  EMAIL_SENT: 'sent',
  EMAIL_DELIVERED: 'delivered',
  EMAIL_OPEN: 'opened', // Official: EMAIL_OPEN (not EMAIL_OPENED)
  EMAIL_LINK_CLICK: 'clicked', // Official: EMAIL_LINK_CLICK (not LINK_CLICKED)
  EMAIL_BOUNCE: 'bounced', // Not in official docs but may be sent
  EMAIL_REPLY: 'replied',
  LEAD_UNSUBSCRIBED: 'unsubscribed',
  LEAD_CATEGORY_UPDATED: 'category_updated',
  THREADED_REPLIES: 'threaded_reply', // Not in official docs
  CAMPAIGN_STATUS_CHANGE: 'status_change', // Not in official docs
  CAMPAIGN_DELETED: 'campaign_deleted', // Not in official docs
  CAMPAIGN_UPDATED: 'campaign_updated', // Not in official docs
  UNTRACKED_REPLIES: 'untracked_reply', // Not in official docs
  MANUAL_STEP_REACHED: 'manual_step', // Not in official docs
} as const;

// Map Smartlead events to our internal event types
// Based on official documentation: https://helpcenter.smartlead.ai/en/articles/125-full-api-documentation
const EVENT_TYPE_MAPPING: Record<string, string> = {
  'EMAIL_SENT': 'sent',
  'EMAIL_DELIVERED': 'delivered', // Email successfully delivered
  'EMAIL_OPEN': 'opened', // Official event type
  'EMAIL_OPENED': 'opened', // Handle both for backwards compatibility
  'EMAIL_LINK_CLICK': 'clicked', // Official event type
  'LINK_CLICKED': 'clicked', // Handle both for backwards compatibility
  'EMAIL_BOUNCE': 'bounced', // May be sent but not in official docs
  'EMAIL_REPLY': 'replied',
  'LEAD_UNSUBSCRIBED': 'unsubscribed',
  'LEAD_CATEGORY_UPDATED': 'category_updated',
};

// Map event types to campaign activity types
function mapEventToActivityType(eventType: string): string {
  const activityMapping: Record<string, string> = {
    'sent': 'email_sent',
    'delivered': 'email_delivered',
    'opened': 'email_opened',
    'clicked': 'email_clicked',
    'bounced': 'email_bounced',
    'replied': 'email_replied',
    'unsubscribed': 'email_unsubscribed',
    'category_updated': 'lead_category_updated',
  };
  return activityMapping[eventType] || `email_${eventType}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log('============================================');
    console.log('🚀 SMARTLEAD WEBHOOK RECEIVED');
    console.log('Request ID:', requestId);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment:', process.env.NODE_ENV || 'unknown');
    
    // Log request metadata
    const url = request.url;
    const method = request.method;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    console.log('📡 Request Details:');
    console.log('  Method:', method);
    console.log('  URL:', url);
    console.log('  Headers:', JSON.stringify(headers, null, 2));
    
    // Log IP address if available
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    console.log('  IP Address:', ip);
    
    // Log user agent
    const userAgent = request.headers.get('user-agent') || 'unknown';
    console.log('  User-Agent:', userAgent);
    
    // Check environment variables
    console.log('🔧 Environment Check:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    
    // Note: Smartlead does not provide webhook signatures or secrets
    // Security recommendations:
    // 1. Use HTTPS
    // 2. Implement IP whitelist if Smartlead provides their IPs
    // 3. Monitor for suspicious activity
    // 4. Implement rate limiting
    
    console.log('📥 Reading request body...');
    const bodyStartTime = Date.now();
    let body: any;
    try {
      body = await request.json();
      const bodyReadTime = Date.now() - bodyStartTime;
      console.log(`✅ Body read in ${bodyReadTime}ms`);
    } catch (bodyError: any) {
      console.error('❌ ERROR READING REQUEST BODY');
      console.error('  Error type:', bodyError.constructor.name);
      console.error('  Error message:', bodyError.message);
      console.error('  Stack trace:', bodyError.stack);
      throw bodyError;
    }
    
    console.log('📦 Raw payload:');
    console.log(JSON.stringify(body, null, 2));
    console.log('📦 Payload type:', Array.isArray(body) ? 'Array' : typeof body);
    console.log('📦 Payload keys:', Object.keys(body));

    // Smartlead can send single event or batch
    const events = Array.isArray(body) ? body : [body];
    console.log(`📊 Processing ${events.length} event(s)`);
    console.log(`📊 Event structure:`, events.map((e: any, idx: number) => ({
      index: idx,
      hasEventType: !!e.event_type,
      eventType: e.event_type || 'N/A',
      hasCampaignId: !!e.campaign_id,
      campaignId: e.campaign_id || 'N/A',
      keys: Object.keys(e)
    })));

    const results = [];
    for (let i = 0; i < events.length; i++) {
      const eventStartTime = Date.now();
      console.log(`\n--- Processing Event ${i + 1}/${events.length} ---`);
      console.log(`Event ${i + 1} start time:`, new Date().toISOString());
      
      try {
        const result = await processSmartleadEvent(events[i], requestId);
        const eventDuration = Date.now() - eventStartTime;
        results.push(result);
        console.log(`Event ${i + 1} result:`, result.success ? '✅ SUCCESS' : '❌ FAILED');
        console.log(`Event ${i + 1} duration:`, `${eventDuration}ms`);
        console.log(`Event ${i + 1} details:`, JSON.stringify(result, null, 2));
      } catch (eventError: any) {
        const eventDuration = Date.now() - eventStartTime;
        console.error(`❌ Event ${i + 1} threw exception after ${eventDuration}ms`);
        console.error('  Error type:', eventError.constructor.name);
        console.error('  Error message:', eventError.message);
        console.error('  Stack trace:', eventError.stack);
        results.push({ 
          success: false, 
          error: eventError.message,
          exception: true 
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n⏱️ Total processing time: ${duration}ms`);
    console.log('✅ WEBHOOK PROCESSING COMPLETE');
    console.log('============================================\n');

    return NextResponse.json({ 
      success: true, 
      processed: events.length,
      results,
      processingTimeMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('============================================');
    console.error('❌ ERROR PROCESSING SMARTLEAD WEBHOOK');
    console.error('Request ID:', requestId);
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Stack trace:', error.stack);
    console.error(`⏱️ Failed after: ${duration}ms`);
    
    // Log additional error details if available
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
    if (error.code) {
      console.error('Error code:', error.code);
    }
    
    console.error('============================================\n');
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        requestId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function processSmartleadEvent(event: any, requestId?: string) {
  const eventStartTime = Date.now();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`\n🔍 [${eventId}] Starting event processing`);
    console.log(`🔍 [${eventId}] Request ID:`, requestId || 'N/A');
    console.log(`🔍 [${eventId}] Full event object keys:`, Object.keys(event));
    console.log(`🔍 [${eventId}] Full event object:`, JSON.stringify(event, null, 2));
    
    // Smartlead webhook payload structure based on official guide:
    // https://help.smartlead.ai/Webhook-Guide-Updated-4d0ae6b2fa6a4db1b4c1ead824a86866
    const eventType = event.event_type; // Official field name
    const smartleadCampaignId = event.campaign_id; // Always present in payload
    
    console.log(`🔍 [${eventId}] Extracted fields:`);
    console.log(`  event_type:`, eventType);
    console.log(`  campaign_id:`, smartleadCampaignId, `(type: ${typeof smartleadCampaignId})`);
    // According to official Smartlead API docs:
    // - sl_lead_email: Original lead email (target recipient in campaign) - WHO YOU SENT TO
    // - to_email: Recipient email (could be same or different) - WHO ACTUALLY RECEIVED/REPLIED
    // 
    // Why they differ:
    // 1. Direct reply: Both same (original recipient replies)
    // 2. Colleague reply: Different person from same company replies (e.g., you email CEO, CTO replies)
    // 3. Forwarded: Email forwarded to someone at different company
    // 4. Aliases: Original target uses alias, reply from different address
    //
    // Prefer sl_lead_email as it's the original target, fall back to to_email
    const leadEmail = event.sl_lead_email || event.to_email; // Official field names per https://api.smartlead.ai/reference/email-reply-webhooks
    const fromEmail = event.from_email;
    const toName = event.to_name;
    const leadCorrespondence = event.leadCorrespondence; // Enhanced correspondence info (targetLeadEmail, replyReceivedFrom, repliedCompanyDomain)
    const statsId = event.stats_id; // Message/statistics ID
    const messageId = event.sent_message?.message_id || statsId; // From sent_message object or stats_id
    const timestamp = event.time_opened || event.time_clicked || event.time_replied || event.event_timestamp || event.timestamp;
    const link = event.link || event.clicked_link;
    const replyText = event.reply_body || event.reply_text;
    const replySubject = event.subject || event.reply_subject;
    const bounceReason = event.bounce_reason;
    const bounceType = event.bounce_type;
    // For CAMPAIGN_STATUS_CHANGED events, use current_status; otherwise use campaign_status
    const newCampaignStatus = event.current_status || event.campaign_status;
    const previousCampaignStatus = event.previous_status;
    const campaignName = event.campaign_name;
    const sequenceNumber = event.sequence_number;
    const subject = event.subject;
    const sentMessageBody = event.sent_message_body;
    const sentMessage = event.sent_message; // Object with message_id, html, text
    const clientId = event.client_id;
    const smartleadMetadata = event.metadata || {};
    
    console.log(`  sl_lead_email:`, event.sl_lead_email || 'N/A');
    console.log(`  to_email:`, event.to_email || 'N/A');
    console.log(`  lead_email (using):`, leadEmail);
    console.log(`  from_email:`, fromEmail);
    console.log(`  to_name:`, toName);
    console.log(`  leadCorrespondence:`, leadCorrespondence ? JSON.stringify(leadCorrespondence, null, 2) : 'N/A');
    console.log(`  stats_id:`, statsId);
    console.log(`  message_id:`, messageId);
    console.log(`  timestamp:`, timestamp);
    console.log(`  link:`, link);
    console.log(`  reply_text:`, replyText ? `${replyText.substring(0, 100)}...` : null);
    console.log(`  reply_subject:`, replySubject);
    console.log(`  bounce_reason:`, bounceReason);
    console.log(`  bounce_type:`, bounceType);
    console.log(`  campaign_status:`, newCampaignStatus);
    console.log(`  campaign_name:`, campaignName);
    console.log(`  sequence_number:`, sequenceNumber);
    console.log(`  subject:`, subject);
    console.log(`  client_id:`, clientId);
    console.log(`  metadata:`, JSON.stringify(smartleadMetadata, null, 2));
    
    // Capture any additional fields for metadata
    const rest = { ...event };
    // Remove fields we've explicitly extracted
    delete rest.event_type;
    delete rest.campaign_id;
    delete rest.sl_lead_email;
    delete rest.to_email;
    delete rest.from_email;
    delete rest.to_name;
    delete rest.leadCorrespondence;
    delete rest.stats_id;
    delete rest.sent_message;
    delete rest.time_opened;
    delete rest.time_clicked;
    delete rest.time_replied;
    delete rest.event_timestamp;
    delete rest.timestamp;
    delete rest.link;
    delete rest.clicked_link;
    delete rest.reply_body;
    delete rest.reply_text;
    delete rest.subject;
    delete rest.reply_subject;
    delete rest.bounce_reason;
    delete rest.bounce_type;
    delete rest.campaign_status;
    delete rest.campaign_name;
    delete rest.sequence_number;
    delete rest.sent_message_body;
    delete rest.client_id;
    delete rest.metadata;
    delete rest.webhook_url;
    delete rest.webhook_id;
    delete rest.webhook_name;
    delete rest.secret_key;
    delete rest.app_url;
    delete rest.ui_master_inbox_link;
    delete rest.description;

    console.log(`\n📋 [${eventId}] Event Summary:`);
    console.log(`  Event Type: ${eventType}`);
    console.log(`  Lead Email: ${leadEmail || 'N/A'}`);
    console.log(`  From Email: ${fromEmail || 'N/A'}`);
    console.log(`  Smartlead Campaign ID: ${smartleadCampaignId || 'N/A'}`);
    console.log(`  Stats ID: ${statsId || 'N/A'}`);
    console.log(`  Timestamp: ${timestamp || 'N/A'}`);

    // Check if this is a campaign-level event
    const isCampaignEvent = eventType && (
      eventType.includes('CAMPAIGN') || 
      eventType === 'CAMPAIGN_STATUS_CHANGE' || 
      eventType === 'CAMPAIGN_STATUS_CHANGED' || // Smartlead sends both variants
      eventType === 'CAMPAIGN_DELETED' || 
      eventType === 'CAMPAIGN_UPDATED'
    );
    
    console.log(`  Is Campaign Event: ${isCampaignEvent}`);

    // Validate required fields based on event type
    if (!eventType) {
      console.error(`❌ [${eventId}] Missing event_type`);
      console.error(`❌ [${eventId}] Available fields:`, Object.keys(event));
      console.error(`❌ [${eventId}] Full event:`, JSON.stringify(event, null, 2));
      return { success: false, error: 'Missing required event_type', eventId };
    }

    // According to Smartlead webhook guide, campaign_id is always present
    if (!smartleadCampaignId) {
      console.error(`❌ [${eventId}] Missing campaign_id`);
      console.error(`❌ [${eventId}] Available fields:`, Object.keys(event));
      console.error(`❌ [${eventId}] Event payload:`, JSON.stringify(event, null, 2));
      return { success: false, error: 'Missing required campaign_id', eventId };
    }

    // For lead-level events, require either sl_lead_email or to_email (recipient)
    if (!isCampaignEvent && !leadEmail) {
      console.error(`❌ [${eventId}] Missing sl_lead_email or to_email for lead-level event`);
      console.error(`❌ [${eventId}] Event type:`, eventType);
      console.error(`❌ [${eventId}] Campaign ID:`, smartleadCampaignId);
      console.error(`❌ [${eventId}] Full event:`, JSON.stringify(event, null, 2));
      return { success: false, error: 'Missing sl_lead_email or to_email for lead-level event', eventId };
    }

    // Handle campaign-level events
    if (isCampaignEvent) {
      console.log(`🎯 [${eventId}] Handling campaign-level event`);
      const campaignEventResult = await handleCampaignEvent(eventType, smartleadCampaignId.toString(), {
        status: newCampaignStatus,
        previous_status: previousCampaignStatus,
        current_status: event.current_status,
        name: campaignName,
        timestamp,
        ...rest
      }, eventId);
      console.log(`✅ [${eventId}] Campaign event handled:`, campaignEventResult);
      return campaignEventResult;
    }

    // Map Smartlead event type to our internal type
    const ourEventType = EVENT_TYPE_MAPPING[eventType] || eventType.toLowerCase().replace(/_/g, '_');
    console.log(`🔄 [${eventId}] Mapped event type: ${eventType} → ${ourEventType}`);

    // Find our campaign by smartlead_campaign_id
    // Convert to string to handle both numeric and string IDs from Smartlead
    console.log(`🔍 [${eventId}] Looking up campaign in database...`);
    console.log(`  Searching for smartlead_campaign_id:`, smartleadCampaignId.toString(), `(type: ${typeof smartleadCampaignId})`);
    
    const campaignLookupStart = Date.now();
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, org_id')
      .eq('smartlead_campaign_id', smartleadCampaignId.toString())
      .single();
    
    const campaignLookupTime = Date.now() - campaignLookupStart;
    console.log(`  Campaign lookup took ${campaignLookupTime}ms`);
    console.log(`  Campaign data:`, campaign ? JSON.stringify(campaign, null, 2) : 'null');
    console.log(`  Campaign error:`, campaignError ? JSON.stringify(campaignError, null, 2) : 'null');

    if (campaignError || !campaign) {
      console.error(`❌ [${eventId}] Campaign not found for Smartlead ID:`, smartleadCampaignId);
      console.error(`❌ [${eventId}] Attempted lookup with:`, smartleadCampaignId.toString());
      console.error(`❌ [${eventId}] Database error:`, campaignError);
      
      // Log available campaigns for debugging (first 10)
      console.log(`🔍 [${eventId}] Fetching sample campaigns for debugging...`);
      const sampleStart = Date.now();
      const { data: sampleCampaigns, error: sampleError } = await supabaseAdmin
        .from('campaigns')
        .select('campaign_id, smartlead_campaign_id, campaign_name')
        .not('smartlead_campaign_id', 'is', null)
        .limit(10);
      const sampleTime = Date.now() - sampleStart;
      console.log(`  Sample query took ${sampleTime}ms`);
      console.log(`  Sample error:`, sampleError);
      console.log(`📋 [${eventId}] Sample campaigns with smartlead_campaign_id:`, JSON.stringify(sampleCampaigns, null, 2));
      
      // Also try to find campaigns with similar IDs (in case of type mismatch)
      if (typeof smartleadCampaignId === 'string') {
        const numericId = parseInt(smartleadCampaignId, 10);
        if (!isNaN(numericId)) {
          console.log(`🔍 [${eventId}] Trying numeric lookup:`, numericId);
          const { data: numericCampaign } = await supabaseAdmin
            .from('campaigns')
            .select('campaign_id, smartlead_campaign_id, campaign_name')
            .eq('smartlead_campaign_id', numericId.toString())
            .limit(1);
          console.log(`  Numeric lookup result:`, JSON.stringify(numericCampaign, null, 2));
        }
      }
      
      return { success: false, error: 'Campaign not found', eventId, smartleadCampaignId };
    }

    const campaignId = campaign.campaign_id;
    console.log(`✅ [${eventId}] Found campaign: ${campaignId} (org_id: ${campaign.org_id})`);

    // Find lead in our database (if exists)
    console.log(`🔍 [${eventId}] Looking up lead in database...`);
    console.log(`  Campaign ID:`, campaignId);
    console.log(`  Lead Email:`, leadEmail);
    
    const leadLookupStart = Date.now();
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('campaign_leads')
      .select('lead_id')
      .eq('campaign_id', campaignId)
      .eq('email', leadEmail)
      .single();
    
    const leadLookupTime = Date.now() - leadLookupStart;
    console.log(`  Lead lookup took ${leadLookupTime}ms`);
    console.log(`  Lead data:`, lead ? JSON.stringify(lead, null, 2) : 'null');
    console.log(`  Lead error:`, leadError ? JSON.stringify(leadError, null, 2) : 'null (not found is OK)');

    const leadId = lead?.lead_id;
    console.log(`  Lead ID:`, leadId || 'Not found (will create event without lead_id)');

    // Prepare metadata from Smartlead payload
    const metadata: any = {
      stats_id: statsId,
      from_email: fromEmail,
      to_name: toName,
      sequence_number: sequenceNumber,
      subject: subject,
      sent_message_body: sentMessageBody,
      sent_message: sentMessage,
      client_id: clientId,
      original_event_type: eventType,
      sl_lead_email: event.sl_lead_email, // Original target lead email
      to_email: event.to_email, // Actual recipient email
      leadCorrespondence: leadCorrespondence, // Enhanced correspondence info
      ...smartleadMetadata, // Include metadata from Smartlead
      ...rest // Include any additional fields
    };

    if (link) metadata.link = link;
    if (event.clicked_link) metadata.clicked_link = event.clicked_link;
    if (replyText) metadata.reply_text = replyText;
    if (replySubject) metadata.reply_subject = replySubject;
    if (bounceReason) metadata.bounce_reason = bounceReason;
    if (bounceType) metadata.bounce_type = bounceType;

    // Insert event into smartlead_email_events table
    console.log(`💾 [${eventId}] Inserting Smartlead email event...`);
    const insertData = {
      campaign_id: campaignId,
      lead_id: leadId,
      smartlead_campaign_id: smartleadCampaignId.toString(), // Ensure string format
      smartlead_lead_id: null, // Smartlead doesn't provide lead_id in webhook payload
      lead_email: leadEmail,
      event_type: ourEventType,
      event_timestamp: timestamp || new Date().toISOString(),
      metadata
    };
    console.log(`  Insert data:`, JSON.stringify(insertData, null, 2));
    
    const insertStart = Date.now();
    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('smartlead_email_events')
      .insert(insertData)
      .select();
    
    const insertTime = Date.now() - insertStart;
    console.log(`  Insert took ${insertTime}ms`);
    console.log(`  Insert result:`, insertResult ? JSON.stringify(insertResult, null, 2) : 'null');
    console.log(`  Insert error:`, insertError ? JSON.stringify(insertError, null, 2) : 'null');

    if (insertError) {
      console.error(`❌ [${eventId}] Error inserting email event:`, insertError);
      console.error(`❌ [${eventId}] Insert data was:`, JSON.stringify(insertData, null, 2));
      return { success: false, error: 'Failed to insert event', eventId, insertError };
    }

    console.log(`✅ [${eventId}] Email event recorded successfully`);

    // Also insert into lead_events for detailed tracking
    if (leadId) {
      console.log(`💾 [${eventId}] Inserting lead event...`);
      const leadEventData = {
        lead_id: leadId,
        campaign_id: campaignId,
        event_type: ourEventType,
        event_timestamp: timestamp || new Date().toISOString(),
        metadata
      };
      console.log(`  Lead event data:`, JSON.stringify(leadEventData, null, 2));
      
      const leadEventStart = Date.now();
      const { data: leadEventResult, error: leadEventError } = await supabaseAdmin
        .from('lead_events')
        .insert(leadEventData)
        .select();
      
      const leadEventTime = Date.now() - leadEventStart;
      console.log(`  Lead event insert took ${leadEventTime}ms`);
      console.log(`  Lead event result:`, leadEventResult ? JSON.stringify(leadEventResult, null, 2) : 'null');
      console.log(`  Lead event error:`, leadEventError ? JSON.stringify(leadEventError, null, 2) : 'null');
      
      if (leadEventError) {
        console.error(`❌ [${eventId}] Error inserting lead event:`, leadEventError);
      } else {
        console.log(`✅ [${eventId}] Lead event recorded`);
      }
    } else {
      console.log(`⏭️ [${eventId}] Skipping lead event (no lead_id)`);
    }

    // Create campaign activity for UI display (critical for user dashboard)
    console.log(`💾 [${eventId}] Creating campaign activity for UI display...`);
    const activityType = mapEventToActivityType(ourEventType);
    console.log(`  Activity type: ${activityType} (from ${ourEventType})`);
    
    const activityData = {
      campaign_id: campaignId,
      activity_type: activityType,
      contact_email: leadEmail,
      buyer_company: metadata.to_name || null,
      metadata: {
        event: ourEventType,
        event_type: eventType, // Original Smartlead event type
        timestamp: timestamp || new Date().toISOString(),
        name: toName,
        from_email: fromEmail,
        subject: subject,
        sequence_number: sequenceNumber,
        stats_id: statsId,
        message_id: messageId,
        link: link,
        reply_text: replyText,
        reply_subject: replySubject,
        bounce_reason: bounceReason,
        bounce_type: bounceType,
        user_agent: smartleadMetadata.user_agent,
        ip_address: smartleadMetadata.ip_address,
        device_used: smartleadMetadata.device_used,
        ...rest
      }
    };
    console.log(`  Activity data:`, JSON.stringify(activityData, null, 2));
    
    const activityStart = Date.now();
    const { data: activityResult, error: activityError } = await supabaseAdmin
      .from('campaign_activities')
      .insert(activityData)
      .select();
    
    const activityTime = Date.now() - activityStart;
    console.log(`  Activity insert took ${activityTime}ms`);
    console.log(`  Activity result:`, activityResult ? JSON.stringify(activityResult, null, 2) : 'null');
    console.log(`  Activity error:`, activityError ? JSON.stringify(activityError, null, 2) : 'null');

    if (activityError) {
      console.error(`❌ [${eventId}] Error inserting campaign activity:`, activityError);
    } else {
      console.log(`✅ [${eventId}] Campaign activity created for UI display`);
    }

    // Update campaign metrics
    console.log(`📊 [${eventId}] Updating campaign metrics...`);
    const metricsStart = Date.now();
    await updateCampaignMetricsFromSmartlead(campaignId, ourEventType, eventId);
    const metricsTime = Date.now() - metricsStart;
    console.log(`  Metrics update took ${metricsTime}ms`);

    // Update lead status if exists
    if (leadId) {
      console.log(`👤 [${eventId}] Updating lead status...`);
      const statusStart = Date.now();
      await updateLeadStatus(leadId, ourEventType, eventId);
      const statusTime = Date.now() - statusStart;
      console.log(`  Status update took ${statusTime}ms`);
    } else {
      console.log(`⏭️ [${eventId}] Skipping lead status update (no lead_id)`);
    }

    // Handle special events
    if (eventType === 'EMAIL_REPLY' || ourEventType === 'replied') {
      console.log(`💬 [${eventId}] REPLY RECEIVED - Creating reply record`);
      const replyStart = Date.now();
      await handleReply(campaignId, leadId, leadEmail, replyText, replySubject || subject, timestamp, eventId);
      const replyTime = Date.now() - replyStart;
      console.log(`  Reply handling took ${replyTime}ms`);
    }

    if (eventType === 'LEAD_UNSUBSCRIBED' || ourEventType === 'unsubscribed') {
      console.log(`🚫 [${eventId}] UNSUBSCRIBE - Marking lead as unsubscribed`);
      const unsubscribeStart = Date.now();
      await handleUnsubscribe(campaignId, leadId, leadEmail, eventId);
      const unsubscribeTime = Date.now() - unsubscribeStart;
      console.log(`  Unsubscribe handling took ${unsubscribeTime}ms`);
    }

    const totalEventTime = Date.now() - eventStartTime;
    console.log(`✅ [${eventId}] Event processed successfully in ${totalEventTime}ms`);
    return { 
      success: true, 
      campaignId,
      smartleadCampaignId,
      eventType: ourEventType, 
      leadEmail: leadEmail,
      eventId,
      processingTimeMs: totalEventTime
    };

  } catch (error: any) {
    const totalEventTime = Date.now() - eventStartTime;
    console.error(`❌ [${eventId}] Error processing individual event after ${totalEventTime}ms`);
    console.error(`❌ [${eventId}] Error type:`, error.constructor.name);
    console.error(`❌ [${eventId}] Error message:`, error.message);
    console.error(`❌ [${eventId}] Error name:`, error.name);
    console.error(`❌ [${eventId}] Stack trace:`, error.stack);
    if (error.cause) {
      console.error(`❌ [${eventId}] Error cause:`, error.cause);
    }
    if (error.code) {
      console.error(`❌ [${eventId}] Error code:`, error.code);
    }
    console.error(`❌ [${eventId}] Event that failed:`, JSON.stringify(event, null, 2));
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      eventId,
      processingTimeMs: totalEventTime
    };
  }
}

async function updateCampaignMetricsFromSmartlead(campaignId: string, eventType: string, eventId?: string) {
  const logPrefix = eventId ? `[${eventId}]` : '';
  try {
    console.log(`  ${logPrefix} Mapping event type to metric column...`);
    // Map event types to metric columns
    let metricColumn: string | null = null;

    switch (eventType) {
      case 'sent':
        metricColumn = 'emails_sent';
        break;
      case 'delivered':
        metricColumn = 'emails_delivered';
        break;
      case 'opened':
        metricColumn = 'emails_opened';
        break;
      case 'clicked':
        metricColumn = 'emails_clicked';
        break;
      case 'bounced':
        metricColumn = 'emails_bounced';
        break;
      case 'replied':
      case 'threaded_reply':
        metricColumn = 'replies_received';
        break;
      case 'unsubscribed':
        metricColumn = 'emails_unsubscribed';
        break;
    }

    console.log(`  ${logPrefix} Event type: ${eventType} → Metric: ${metricColumn || 'none'}`);

    if (metricColumn) {
      console.log(`  ${logPrefix} Calling RPC to increment ${metricColumn}...`);
      // Use RPC function to safely increment
      const rpcStart = Date.now();
      const { data: rpcResult, error } = await supabaseAdmin.rpc('increment_campaign_metric', {
        p_campaign_id: campaignId,
        p_metric: metricColumn,
        p_increment: 1
      });
      const rpcTime = Date.now() - rpcStart;
      console.log(`  ${logPrefix} RPC call took ${rpcTime}ms`);
      console.log(`  ${logPrefix} RPC result:`, rpcResult);
      console.log(`  ${logPrefix} RPC error:`, error ? JSON.stringify(error, null, 2) : 'null');

      if (error) {
        console.error(`❌ ${logPrefix} Error incrementing ${metricColumn}:`, error);
      } else {
        console.log(`✅ ${logPrefix} ${metricColumn} incremented`);
      }
    } else {
      console.log(`⏭️ ${logPrefix} No metric column for event type: ${eventType}`);
    }
  } catch (error: any) {
    console.error(`❌ ${logPrefix} Error updating campaign metrics:`, error);
    console.error(`❌ ${logPrefix} Error type:`, error.constructor.name);
    console.error(`❌ ${logPrefix} Error message:`, error.message);
    console.error(`❌ ${logPrefix} Stack trace:`, error.stack);
  }
}

async function updateLeadStatus(leadId: string, eventType: string, eventId?: string) {
  const logPrefix = eventId ? `[${eventId}]` : '';
  try {
    console.log(`  ${logPrefix} Preparing lead status updates...`);
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    // Update last_contacted for any activity, and status based on event type
    // Also increment event counters
    switch (eventType) {
      case 'sent':
        updates.last_contacted = new Date().toISOString();
        break;
      case 'delivered':
        updates.last_contacted = new Date().toISOString();
        break;
      case 'opened':
        updates.last_contacted = new Date().toISOString();
        // Increment open_count using Postgres function
        console.log(`  ${logPrefix} Incrementing open_count...`);
        const openRpcStart = Date.now();
        const { data: openRpcResult, error: openRpcError } = await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'open_count'
        });
        const openRpcTime = Date.now() - openRpcStart;
        console.log(`  ${logPrefix} Open count RPC took ${openRpcTime}ms`);
        console.log(`  ${logPrefix} Open count RPC result:`, openRpcResult);
        console.log(`  ${logPrefix} Open count RPC error:`, openRpcError);
        break;
      case 'clicked':
        updates.last_contacted = new Date().toISOString();
        // Increment click_count
        console.log(`  ${logPrefix} Incrementing click_count...`);
        const clickRpcStart = Date.now();
        const { data: clickRpcResult, error: clickRpcError } = await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'click_count'
        });
        const clickRpcTime = Date.now() - clickRpcStart;
        console.log(`  ${logPrefix} Click count RPC took ${clickRpcTime}ms`);
        console.log(`  ${logPrefix} Click count RPC result:`, clickRpcResult);
        console.log(`  ${logPrefix} Click count RPC error:`, clickRpcError);
        break;
      case 'replied':
      case 'threaded_reply':
        updates.last_contacted = new Date().toISOString();
        // Increment reply_count
        console.log(`  ${logPrefix} Incrementing reply_count...`);
        const replyRpcStart = Date.now();
        const { data: replyRpcResult, error: replyRpcError } = await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'reply_count'
        });
        const replyRpcTime = Date.now() - replyRpcStart;
        console.log(`  ${logPrefix} Reply count RPC took ${replyRpcTime}ms`);
        console.log(`  ${logPrefix} Reply count RPC result:`, replyRpcResult);
        console.log(`  ${logPrefix} Reply count RPC error:`, replyRpcError);
        break;
      case 'bounced':
        updates.status = 'bounced';
        break;
      case 'unsubscribed':
        updates.status = 'unsubscribed';
        break;
    }

    console.log(`  ${logPrefix} Updates to apply:`, JSON.stringify(updates, null, 2));
    const updateStart = Date.now();
    const { data: updateResult, error } = await supabaseAdmin
      .from('campaign_leads')
      .update(updates)
      .eq('lead_id', leadId)
      .select();
    const updateTime = Date.now() - updateStart;
    console.log(`  ${logPrefix} Lead update took ${updateTime}ms`);
    console.log(`  ${logPrefix} Lead update result:`, updateResult ? JSON.stringify(updateResult, null, 2) : 'null');
    console.log(`  ${logPrefix} Lead update error:`, error ? JSON.stringify(error, null, 2) : 'null');

    if (error) {
      console.error(`❌ ${logPrefix} Error updating lead status:`, error);
    } else {
      console.log(`✅ ${logPrefix} Lead status updated`);
    }
  } catch (error: any) {
    console.error(`❌ ${logPrefix} Error in updateLeadStatus:`, error);
    console.error(`❌ ${logPrefix} Error type:`, error.constructor.name);
    console.error(`❌ ${logPrefix} Error message:`, error.message);
    console.error(`❌ ${logPrefix} Stack trace:`, error.stack);
  }
}

async function handleReply(
  campaignId: string, 
  leadId: string | undefined, 
  leadEmail: string, 
  replyText: string, 
  replySubject: string, 
  timestamp: string,
  eventId?: string
) {
  const logPrefix = eventId ? `[${eventId}]` : '';
  try {
    console.log(`  ${logPrefix} Storing reply in campaign_replies table...`);
    const replyData = {
      campaign_id: campaignId,
      lead_id: leadId,
      lead_email: leadEmail,
      reply_subject: replySubject,
      reply_text: replyText,
      replied_at: timestamp || new Date().toISOString(),
      sentiment: null, // Can be analyzed later
      is_read: false
    };
    console.log(`  ${logPrefix} Reply data:`, JSON.stringify(replyData, null, 2));
    
    const replyStart = Date.now();
    const { data: replyResult, error } = await supabaseAdmin
      .from('campaign_replies')
      .insert(replyData)
      .select();
    const replyTime = Date.now() - replyStart;
    console.log(`  ${logPrefix} Reply insert took ${replyTime}ms`);
    console.log(`  ${logPrefix} Reply result:`, replyResult ? JSON.stringify(replyResult, null, 2) : 'null');
    console.log(`  ${logPrefix} Reply error:`, error ? JSON.stringify(error, null, 2) : 'null');

    if (error) {
      console.error(`❌ ${logPrefix} Error storing reply:`, error);
    } else {
      console.log(`✅ ${logPrefix} Reply stored successfully`);
    }
  } catch (error: any) {
    console.error(`❌ ${logPrefix} Error in handleReply:`, error);
    console.error(`❌ ${logPrefix} Error type:`, error.constructor.name);
    console.error(`❌ ${logPrefix} Error message:`, error.message);
    console.error(`❌ ${logPrefix} Stack trace:`, error.stack);
  }
}

/**
 * Handle campaign-level events from Smartlead
 * Used for bi-directional sync when campaigns are updated/deleted in Smartlead
 */
async function handleCampaignEvent(
  eventType: string,
  smartleadCampaignId: string | number,
  eventData: {
    status?: string;
    name?: string;
    data?: any;
    timestamp?: string;
    [key: string]: any;
  },
  eventId?: string
) {
  const logPrefix = eventId ? `[${eventId}]` : '';
  try {
    console.log(`🎯 ${logPrefix} Handling campaign event: ${eventType} for campaign ${smartleadCampaignId}`);
    console.log(`  ${logPrefix} Event data:`, JSON.stringify(eventData, null, 2));

    // Find our campaign by smartlead_campaign_id
    // Convert to string to handle both numeric and string IDs from Smartlead
    console.log(`  ${logPrefix} Looking up campaign...`);
    console.log(`  ${logPrefix} Searching for smartlead_campaign_id:`, smartleadCampaignId.toString());
    
    const campaignLookupStart = Date.now();
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, campaign_name, status')
      .eq('smartlead_campaign_id', smartleadCampaignId.toString())
      .single();
    const campaignLookupTime = Date.now() - campaignLookupStart;
    console.log(`  ${logPrefix} Campaign lookup took ${campaignLookupTime}ms`);
    console.log(`  ${logPrefix} Campaign data:`, campaign ? JSON.stringify(campaign, null, 2) : 'null');
    console.log(`  ${logPrefix} Campaign error:`, campaignError ? JSON.stringify(campaignError, null, 2) : 'null');

    // Handle different campaign event types
    // Note: For CAMPAIGN_STATUS_CHANGED, we log the status change even if campaign is not found
    // (e.g., when paused from local environment)
    switch (eventType) {
      case 'CAMPAIGN_STATUS_CHANGE':
      case 'CAMPAIGN_STATUS_CHANGED': // Handle both variants
        const previousStatus = eventData.previous_status;
        const currentStatus = eventData.current_status || eventData.status;
        console.log(`📊 ${logPrefix} Campaign status changed from ${previousStatus || 'unknown'} to ${currentStatus || 'unknown'}`);
        console.log(`  ${logPrefix} Previous status: ${previousStatus || 'N/A'}`);
        console.log(`  ${logPrefix} Current status: ${currentStatus || 'N/A'}`);
        console.log(`  ${logPrefix} Campaign name: ${eventData.name || 'N/A'}`);
        
        if (campaignError || !campaign) {
          console.log(`ℹ️ ${logPrefix} Campaign not found in database (Smartlead ID: ${smartleadCampaignId})`);
          console.log(`  ${logPrefix} This is expected if campaign was paused/updated from local environment or external system`);
          console.log(`  ${logPrefix} Webhook payload was correctly parsed: previous_status="${previousStatus}", current_status="${currentStatus}"`);
          // Return success since payload was handled correctly, even if campaign doesn't exist
          return { success: true, error: null, eventId, message: 'Campaign not found in database, but payload handled correctly' };
        }

        const campaignId = campaign.campaign_id;
        console.log(`✅ ${logPrefix} Found campaign: ${campaignId} (${campaign.campaign_name})`);
        
        // Use Smartlead status directly (convert to lowercase for database)
        const normalizedStatus = normalizeSmartleadStatus(currentStatus || '');
        console.log(`  ${logPrefix} Normalized status: ${normalizedStatus}`);
        
        const statusStart = Date.now();
        const { data: statusResult, error: statusError } = await supabaseAdmin
          .from('campaigns')
          .update({
            status: normalizedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId)
          .select();
        const statusTime = Date.now() - statusStart;
        console.log(`  ${logPrefix} Status update took ${statusTime}ms`);
        console.log(`  ${logPrefix} Status result:`, statusResult ? JSON.stringify(statusResult, null, 2) : 'null');
        console.log(`  ${logPrefix} Status error:`, statusError ? JSON.stringify(statusError, null, 2) : 'null');
        
        if (statusError) {
          console.error(`❌ ${logPrefix} Error updating campaign status:`, statusError);
        } else {
          console.log(`✅ ${logPrefix} Campaign status updated to: ${normalizedStatus}`);
        }
        break;

      case 'CAMPAIGN_DELETED':
        if (campaignError || !campaign) {
          console.log(`ℹ️ ${logPrefix} Campaign not found in database (Smartlead ID: ${smartleadCampaignId})`);
          console.log(`  ${logPrefix} Campaign may have already been deleted or doesn't exist in our system`);
          return { success: true, error: null, eventId, message: 'Campaign not found, but payload handled correctly' };
        }

        const campaignIdForDelete = campaign.campaign_id;
        console.log(`🗑️ ${logPrefix} Campaign deleted in Smartlead, marking as deleted in our DB`);
        const deleteStart = Date.now();
        const { data: deleteResult, error: deleteError } = await supabaseAdmin
          .from('campaigns')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignIdForDelete)
          .select();
        const deleteTime = Date.now() - deleteStart;
        console.log(`  ${logPrefix} Delete update took ${deleteTime}ms`);
        console.log(`  ${logPrefix} Delete result:`, deleteResult ? JSON.stringify(deleteResult, null, 2) : 'null');
        console.log(`  ${logPrefix} Delete error:`, deleteError ? JSON.stringify(deleteError, null, 2) : 'null');
        
        if (deleteError) {
          console.error(`❌ ${logPrefix} Error deleting campaign:`, deleteError);
        } else {
          console.log(`✅ ${logPrefix} Campaign marked as deleted in our database`);
        }
        break;

      case 'CAMPAIGN_UPDATED':
        console.log(`✏️ ${logPrefix} Campaign settings updated in Smartlead`);
        console.log(`  ${logPrefix} Campaign name in payload: ${eventData.name || 'N/A'}`);
        
        if (campaignError || !campaign) {
          console.log(`ℹ️ ${logPrefix} Campaign not found in database (Smartlead ID: ${smartleadCampaignId})`);
          console.log(`  ${logPrefix} This is expected if campaign was updated from local environment or external system`);
          console.log(`  ${logPrefix} Webhook payload was correctly parsed: campaign_name="${eventData.name || 'N/A'}"`);
          return { success: true, error: null, eventId, message: 'Campaign not found in database, but payload handled correctly' };
        }

        const campaignIdForUpdate = campaign.campaign_id;
        const updates: any = {
          updated_at: new Date().toISOString(),
        };
        
        if (eventData.name && eventData.name !== campaign.campaign_name) {
          updates.campaign_name = eventData.name;
          console.log(`  ${logPrefix} Updating campaign name: ${campaign.campaign_name} → ${eventData.name}`);
        }
        
        console.log(`  ${logPrefix} Updates to apply:`, JSON.stringify(updates, null, 2));
        const updateStart = Date.now();
        const { data: updateResult, error: updateError } = await supabaseAdmin
          .from('campaigns')
          .update(updates)
          .eq('campaign_id', campaignIdForUpdate)
          .select();
        const updateTime = Date.now() - updateStart;
        console.log(`  ${logPrefix} Update took ${updateTime}ms`);
        console.log(`  ${logPrefix} Update result:`, updateResult ? JSON.stringify(updateResult, null, 2) : 'null');
        console.log(`  ${logPrefix} Update error:`, updateError ? JSON.stringify(updateError, null, 2) : 'null');
        
        if (updateError) {
          console.error(`❌ ${logPrefix} Error updating campaign:`, updateError);
        } else {
          console.log(`✅ ${logPrefix} Campaign updated in our database`);
        }
        break;

      default:
        console.log(`⚠️ ${logPrefix} Unknown campaign event type: ${eventType}`);
    }

    return { success: true, eventId };
  } catch (error: any) {
    console.error(`❌ ${logPrefix} Error handling campaign event:`, error);
    console.error(`❌ ${logPrefix} Error type:`, error.constructor.name);
    console.error(`❌ ${logPrefix} Error message:`, error.message);
    console.error(`❌ ${logPrefix} Stack trace:`, error.stack);
    return { success: false, error: 'Failed to handle campaign event', eventId };
  }
}

import { normalizeSmartleadStatus } from '@/lib/smartlead/utils';

async function handleUnsubscribe(campaignId: string, leadId: string | undefined, leadEmail: string, eventId?: string) {
  const logPrefix = eventId ? `[${eventId}]` : '';
  try {
    console.log(`  ${logPrefix} Handling unsubscribe...`);
    // Update lead status
    if (leadId) {
      console.log(`  ${logPrefix} Updating lead status to unsubscribed...`);
      const unsubscribeStart = Date.now();
      const { data: unsubscribeResult, error: unsubscribeError } = await supabaseAdmin
        .from('campaign_leads')
        .update({ 
          status: 'unsubscribed',
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId)
        .select();
      const unsubscribeTime = Date.now() - unsubscribeStart;
      console.log(`  ${logPrefix} Unsubscribe update took ${unsubscribeTime}ms`);
      console.log(`  ${logPrefix} Unsubscribe result:`, unsubscribeResult ? JSON.stringify(unsubscribeResult, null, 2) : 'null');
      console.log(`  ${logPrefix} Unsubscribe error:`, unsubscribeError ? JSON.stringify(unsubscribeError, null, 2) : 'null');
      
      if (unsubscribeError) {
        console.error(`❌ ${logPrefix} Error updating lead unsubscribe status:`, unsubscribeError);
      }
    } else {
      console.log(`  ${logPrefix} No lead_id, skipping lead status update`);
    }

    // Add to global suppression list (optional)
    // await addToSuppressionList(leadEmail)

    console.log(`✅ ${logPrefix} Unsubscribe handled`);
  } catch (error: any) {
    console.error(`❌ ${logPrefix} Error in handleUnsubscribe:`, error);
    console.error(`❌ ${logPrefix} Error type:`, error.constructor.name);
    console.error(`❌ ${logPrefix} Error message:`, error.message);
    console.error(`❌ ${logPrefix} Stack trace:`, error.stack);
  }
}

