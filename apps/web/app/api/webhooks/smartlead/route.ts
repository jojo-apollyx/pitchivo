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
  
  try {
    console.log('============================================');
    console.log('🚀 SMARTLEAD WEBHOOK RECEIVED');
    console.log('Timestamp:', new Date().toISOString());
    
    // Note: Smartlead does not provide webhook signatures or secrets
    // Security recommendations:
    // 1. Use HTTPS
    // 2. Implement IP whitelist if Smartlead provides their IPs
    // 3. Monitor for suspicious activity
    // 4. Implement rate limiting
    
    const body = await request.json();
    console.log('📦 Raw payload:', JSON.stringify(body, null, 2));

    // Smartlead can send single event or batch
    const events = Array.isArray(body) ? body : [body];
    console.log(`📊 Processing ${events.length} event(s)`);

    const results = [];
    for (let i = 0; i < events.length; i++) {
      console.log(`\n--- Processing Event ${i + 1}/${events.length} ---`);
      const result = await processSmartleadEvent(events[i]);
      results.push(result);
      console.log(`Result:`, result.success ? '✅ SUCCESS' : '❌ FAILED', result);
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
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error(`⏱️ Failed after: ${duration}ms`);
    console.error('============================================\n');
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

async function processSmartleadEvent(event: any) {
  try {
    // Smartlead webhook payload structure based on official guide:
    // https://help.smartlead.ai/Webhook-Guide-Updated-4d0ae6b2fa6a4db1b4c1ead824a86866
    const eventType = event.event_type; // Official field name
    const smartleadCampaignId = event.campaign_id; // Always present in payload
    const leadEmail = event.to_email; // Official field name for recipient
    const fromEmail = event.from_email;
    const toName = event.to_name;
    const statsId = event.stats_id; // Message/statistics ID
    const messageId = event.sent_message?.message_id || statsId; // From sent_message object or stats_id
    const timestamp = event.time_opened || event.time_clicked || event.time_replied || event.event_timestamp || event.timestamp;
    const link = event.link || event.clicked_link;
    const replyText = event.reply_body || event.reply_text;
    const replySubject = event.subject || event.reply_subject;
    const bounceReason = event.bounce_reason;
    const bounceType = event.bounce_type;
    const newCampaignStatus = event.campaign_status;
    const campaignName = event.campaign_name;
    const sequenceNumber = event.sequence_number;
    const subject = event.subject;
    const sentMessageBody = event.sent_message_body;
    const sentMessage = event.sent_message; // Object with message_id, html, text
    const clientId = event.client_id;
    const smartleadMetadata = event.metadata || {};
    
    // Capture any additional fields for metadata
    const rest = { ...event };
    // Remove fields we've explicitly extracted
    delete rest.event_type;
    delete rest.campaign_id;
    delete rest.to_email;
    delete rest.from_email;
    delete rest.to_name;
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

    console.log(`📧 Event Type: ${eventType}`);
    console.log(`👤 Lead Email: ${leadEmail || 'N/A'}`);
    console.log(`📧 From Email: ${fromEmail || 'N/A'}`);
    console.log(`🎯 Smartlead Campaign ID: ${smartleadCampaignId || 'N/A'}`);
    console.log(`📬 Stats ID: ${statsId || 'N/A'}`);
    console.log(`📅 Timestamp: ${timestamp || 'N/A'}`);

    // Check if this is a campaign-level event
    const isCampaignEvent = eventType && (
      eventType.includes('CAMPAIGN') || 
      eventType === 'CAMPAIGN_STATUS_CHANGE' || 
      eventType === 'CAMPAIGN_DELETED' || 
      eventType === 'CAMPAIGN_UPDATED'
    );

    // Validate required fields based on event type
    if (!eventType) {
      console.error('❌ Missing event_type. Available fields:', Object.keys(event));
      return { success: false, error: 'Missing required event_type' };
    }

    // According to Smartlead webhook guide, campaign_id is always present
    if (!smartleadCampaignId) {
      console.error('❌ Missing campaign_id. Available fields:', Object.keys(event));
      console.error('❌ Event payload:', JSON.stringify(event, null, 2));
      return { success: false, error: 'Missing required campaign_id' };
    }

    // For lead-level events, require to_email (recipient)
    if (!isCampaignEvent && !leadEmail) {
      console.error('❌ Missing to_email for lead-level event:', { eventType, smartleadCampaignId });
      return { success: false, error: 'Missing to_email for lead-level event' };
    }

    // Handle campaign-level events
    if (isCampaignEvent) {
      return await handleCampaignEvent(eventType, smartleadCampaignId.toString(), {
        status: newCampaignStatus,
        name: campaignName,
        timestamp,
        ...rest
      });
    }

    // Map Smartlead event type to our internal type
    const ourEventType = EVENT_TYPE_MAPPING[eventType] || eventType.toLowerCase().replace(/_/g, '_');
    console.log(`🔄 Mapped event type: ${eventType} → ${ourEventType}`);

    // Find our campaign by smartlead_campaign_id
    // Convert to string to handle both numeric and string IDs from Smartlead
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, org_id')
      .eq('smartlead_campaign_id', smartleadCampaignId.toString())
      .single();

    if (campaignError || !campaign) {
      console.error('❌ Campaign not found for Smartlead ID:', smartleadCampaignId);
      console.error('❌ Attempted lookup with:', smartleadCampaignId.toString());
      console.error('❌ Database error:', campaignError);
      // Log available campaigns for debugging (first 5)
      const { data: sampleCampaigns } = await supabaseAdmin
        .from('campaigns')
        .select('campaign_id, smartlead_campaign_id, campaign_name')
        .not('smartlead_campaign_id', 'is', null)
        .limit(5);
      console.log('📋 Sample campaigns with smartlead_campaign_id:', sampleCampaigns);
      return { success: false, error: 'Campaign not found' };
    }

    const campaignId = campaign.campaign_id;
    console.log(`✅ Found campaign: ${campaignId}`);

    // Find lead in our database (if exists)
    const { data: lead } = await supabaseAdmin
      .from('campaign_leads')
      .select('lead_id')
      .eq('campaign_id', campaignId)
      .eq('email', leadEmail)
      .single();

    const leadId = lead?.lead_id;

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
    console.log(`💾 Inserting Smartlead email event...`);
    const { error: insertError } = await supabaseAdmin
      .from('smartlead_email_events')
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
        smartlead_campaign_id: smartleadCampaignId.toString(), // Ensure string format
        smartlead_lead_id: null, // Smartlead doesn't provide lead_id in webhook payload
        lead_email: leadEmail,
        event_type: ourEventType,
        event_timestamp: timestamp || new Date().toISOString(),
        metadata
      });

    if (insertError) {
      console.error(`❌ Error inserting email event:`, insertError);
      return { success: false, error: 'Failed to insert event' };
    }

    console.log(`✅ Email event recorded successfully`);

    // Also insert into lead_events for detailed tracking
    if (leadId) {
      await supabaseAdmin
        .from('lead_events')
        .insert({
          lead_id: leadId,
          campaign_id: campaignId,
          event_type: ourEventType,
          event_timestamp: timestamp || new Date().toISOString(),
          metadata
        })
        .then(({ error }) => {
          if (error) {
            console.error('❌ Error inserting lead event:', error);
          } else {
            console.log('✅ Lead event recorded');
          }
        });
    }

    // Create campaign activity for UI display (critical for user dashboard)
    console.log(`💾 Creating campaign activity for UI display...`);
    const activityType = mapEventToActivityType(ourEventType);
    const { error: activityError } = await supabaseAdmin
      .from('campaign_activities')
      .insert({
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
      });

    if (activityError) {
      console.error('❌ Error inserting campaign activity:', activityError);
    } else {
      console.log('✅ Campaign activity created for UI display');
    }

    // Update campaign metrics
    console.log(`📊 Updating campaign metrics...`);
    await updateCampaignMetricsFromSmartlead(campaignId, ourEventType);

    // Update lead status if exists
    if (leadId) {
      console.log(`👤 Updating lead status...`);
      await updateLeadStatus(leadId, ourEventType);
    }

    // Handle special events
    if (eventType === 'EMAIL_REPLY' || ourEventType === 'replied') {
      console.log(`💬 REPLY RECEIVED - Creating reply record`);
      await handleReply(campaignId, leadId, leadEmail, replyText, replySubject || subject, timestamp);
    }

    if (eventType === 'LEAD_UNSUBSCRIBED' || ourEventType === 'unsubscribed') {
      console.log(`🚫 UNSUBSCRIBE - Marking lead as unsubscribed`);
      await handleUnsubscribe(campaignId, leadId, leadEmail);
    }

    console.log(`✅ Event processed successfully`);
    return { 
      success: true, 
      campaignId,
      smartleadCampaignId,
      eventType: ourEventType, 
      leadEmail: leadEmail,
    };

  } catch (error) {
    console.error('❌ Error processing individual event');
    console.error('Error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function updateCampaignMetricsFromSmartlead(campaignId: string, eventType: string) {
  try {
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

    if (metricColumn) {
      // Use RPC function to safely increment
      const { error } = await supabaseAdmin.rpc('increment_campaign_metric', {
        p_campaign_id: campaignId,
        p_metric_name: metricColumn,
        p_increment_by: 1
      });

      if (error) {
        console.error(`❌ Error incrementing ${metricColumn}:`, error);
      } else {
        console.log(`✅ ${metricColumn} incremented`);
      }
    }
  } catch (error) {
    console.error('❌ Error updating campaign metrics:', error);
  }
}

async function updateLeadStatus(leadId: string, eventType: string) {
  try {
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
        await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'open_count'
        });
        break;
      case 'clicked':
        updates.last_contacted = new Date().toISOString();
        // Increment click_count
        await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'click_count'
        });
        break;
      case 'replied':
      case 'threaded_reply':
        updates.last_contacted = new Date().toISOString();
        // Increment reply_count
        await supabaseAdmin.rpc('increment_lead_counter', {
          lead_id_param: leadId,
          counter_name: 'reply_count'
        });
        break;
      case 'bounced':
        updates.status = 'bounced';
        break;
      case 'unsubscribed':
        updates.status = 'unsubscribed';
        break;
    }

    const { error } = await supabaseAdmin
      .from('campaign_leads')
      .update(updates)
      .eq('lead_id', leadId);

    if (error) {
      console.error('❌ Error updating lead status:', error);
    } else {
      console.log('✅ Lead status updated');
    }
  } catch (error) {
    console.error('❌ Error in updateLeadStatus:', error);
  }
}

async function handleReply(
  campaignId: string, 
  leadId: string | undefined, 
  leadEmail: string, 
  replyText: string, 
  replySubject: string, 
  timestamp: string
) {
  try {
    // Store reply in campaign_replies table
    const { error } = await supabaseAdmin
      .from('campaign_replies')
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
        lead_email: leadEmail,
        reply_subject: replySubject,
        reply_text: replyText,
        replied_at: timestamp || new Date().toISOString(),
        sentiment: null, // Can be analyzed later
        is_read: false
      });

    if (error) {
      console.error('❌ Error storing reply:', error);
    } else {
      console.log('✅ Reply stored successfully');
    }
  } catch (error) {
    console.error('❌ Error in handleReply:', error);
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
  }
) {
  try {
    console.log(`🎯 Handling campaign event: ${eventType} for campaign ${smartleadCampaignId}`);

    // Find our campaign by smartlead_campaign_id
    // Convert to string to handle both numeric and string IDs from Smartlead
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, campaign_name, status')
      .eq('smartlead_campaign_id', smartleadCampaignId.toString())
      .single();

    if (campaignError || !campaign) {
      console.error('❌ Campaign not found for Smartlead ID:', smartleadCampaignId);
      return { success: false, error: 'Campaign not found' };
    }

    const campaignId = campaign.campaign_id;
    console.log(`✅ Found campaign: ${campaignId} (${campaign.campaign_name})`);

    // Handle different campaign event types
    switch (eventType) {
      case 'CAMPAIGN_DELETED':
        console.log(`🗑️ Campaign deleted in Smartlead, marking as deleted in our DB`);
        // Soft delete or mark as deleted
        await supabaseAdmin
          .from('campaigns')
          .update({
            status: 'deleted',
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
        
        console.log(`✅ Campaign marked as deleted in our database`);
        break;

      case 'CAMPAIGN_STATUS_CHANGE':
        console.log(`📊 Campaign status changed to: ${eventData.status}`);
        // Use Smartlead status directly (convert to lowercase for database)
        const normalizedStatus = normalizeSmartleadStatus(eventData.status || '');
        await supabaseAdmin
          .from('campaigns')
          .update({
            status: normalizedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
        
        console.log(`✅ Campaign status updated to: ${normalizedStatus}`);
        break;

      case 'CAMPAIGN_UPDATED':
        console.log(`✏️ Campaign settings updated in Smartlead`);
        const updates: any = {
          updated_at: new Date().toISOString(),
        };
        
        if (eventData.name && eventData.name !== campaign.campaign_name) {
          updates.campaign_name = eventData.name;
        }
        
        await supabaseAdmin
          .from('campaigns')
          .update(updates)
          .eq('campaign_id', campaignId);
        
        console.log(`✅ Campaign updated in our database`);
        break;

      default:
        console.log(`⚠️ Unknown campaign event type: ${eventType}`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error handling campaign event:', error);
    return { success: false, error: 'Failed to handle campaign event' };
  }
}

import { normalizeSmartleadStatus } from '@/lib/smartlead/utils';

async function handleUnsubscribe(campaignId: string, leadId: string | undefined, leadEmail: string) {
  try {
    // Update lead status
    if (leadId) {
      await supabaseAdmin
        .from('campaign_leads')
        .update({ 
          status: 'unsubscribed',
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId);
    }

    // Add to global suppression list (optional)
    // await addToSuppressionList(leadEmail)

    console.log('✅ Unsubscribe handled');
  } catch (error) {
    console.error('❌ Error in handleUnsubscribe:', error);
  }
}

