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
  'EMAIL_OPEN': 'opened', // Official event type
  'EMAIL_OPENED': 'opened', // Handle both for backwards compatibility
  'EMAIL_LINK_CLICK': 'clicked', // Official event type
  'LINK_CLICKED': 'clicked', // Handle both for backwards compatibility
  'EMAIL_BOUNCE': 'bounced', // May be sent but not in official docs
  'EMAIL_REPLY': 'replied',
  'LEAD_UNSUBSCRIBED': 'unsubscribed',
  'LEAD_CATEGORY_UPDATED': 'category_updated',
};

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
    // Smartlead webhook payload structure (adjust based on actual payload)
    const {
      event: eventType, // or event_type - check actual payload
      campaign_id: smartleadCampaignId,
      email: leadEmail, // or lead_email
      lead_id: smartleadLeadId,
      email_account: emailAccount,
      message_id: messageId,
      timestamp,
      link,
      reply_body: replyText, // or reply_text
      reply_subject: replySubject,
      bounce_reason: bounceReason,
      bounce_type: bounceType,
      // Campaign-level event fields
      campaign_status: newCampaignStatus,
      campaign_name: campaignName,
      campaign_data: campaignData,
      // Additional fields Smartlead may include
      ...rest
    } = event;

    console.log(`📧 Event Type: ${eventType}`);
    console.log(`👤 Lead Email: ${leadEmail || 'N/A'}`);
    console.log(`🎯 Smartlead Campaign ID: ${smartleadCampaignId}`);
    console.log(`📬 Message ID: ${messageId || 'N/A'}`);
    console.log(`📅 Timestamp: ${timestamp}`);

    // Check if this is a campaign-level event (no lead email required)
    const isCampaignEvent = eventType && (
      eventType.includes('CAMPAIGN') || 
      eventType === 'CAMPAIGN_STATUS_CHANGE' || 
      eventType === 'CAMPAIGN_DELETED' || 
      eventType === 'CAMPAIGN_UPDATED'
    );

    // Validate required fields based on event type
    if (!eventType || !smartleadCampaignId) {
      console.error('❌ Missing required fields:', { eventType, smartleadCampaignId });
      return { success: false, error: 'Missing required event type or campaign ID' };
    }

    // For lead-level events, require lead email
    if (!isCampaignEvent && !leadEmail) {
      console.error('❌ Missing lead email for lead-level event:', { eventType, smartleadCampaignId });
      return { success: false, error: 'Missing lead email for lead-level event' };
    }

    // Handle campaign-level events
    if (isCampaignEvent) {
      return await handleCampaignEvent(eventType, smartleadCampaignId, {
        status: newCampaignStatus,
        name: campaignName,
        data: campaignData,
        timestamp,
        ...rest
      });
    }

    // Map Smartlead event type to our internal type
    const ourEventType = EVENT_TYPE_MAPPING[eventType] || eventType.toLowerCase().replace(/_/g, '_');
    console.log(`🔄 Mapped event type: ${eventType} → ${ourEventType}`);

    // Find our campaign by smartlead_campaign_id
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, org_id')
      .eq('smartlead_campaign_id', smartleadCampaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('❌ Campaign not found for Smartlead ID:', smartleadCampaignId);
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

    // Prepare metadata
    const metadata: any = {
      smartlead_lead_id: smartleadLeadId,
      email_account: emailAccount,
      message_id: messageId,
      original_event_type: eventType, // Store original Smartlead event type
      ...rest
    };

    if (link) metadata.link = link;
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
        smartlead_campaign_id: smartleadCampaignId,
        smartlead_lead_id: smartleadLeadId,
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
      await handleReply(campaignId, leadId, leadEmail, replyText, replySubject, timestamp);
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
  smartleadCampaignId: string,
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
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, campaign_name, status')
      .eq('smartlead_campaign_id', smartleadCampaignId)
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
        // Map Smartlead status to our status
        const ourStatus = mapSmartleadStatus(eventData.status || '');
        await supabaseAdmin
          .from('campaigns')
          .update({
            status: ourStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('campaign_id', campaignId);
        
        console.log(`✅ Campaign status updated to: ${ourStatus}`);
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

/**
 * Map Smartlead campaign status to our internal status
 */
function mapSmartleadStatus(smartleadStatus: string): string {
  const statusMap: Record<string, string> = {
    'DRAFTED': 'draft',
    'ACTIVE': 'active',
    'PAUSED': 'paused',
    'STOPPED': 'stopped',
    'COMPLETED': 'completed',
    'START': 'active', // When campaign is started
  };

  return statusMap[smartleadStatus.toUpperCase()] || 'scheduled';
}

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

