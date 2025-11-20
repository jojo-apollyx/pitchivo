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
 * Reference: https://help.outboundsync.com/articles/643692-smartlead-webhook-guide
 * 
 * Smartlead sends these event types:
 * - EMAIL_SENT: When an email is sent
 * - EMAIL_REPLY: When a lead replies to an email
 * - EMAIL_OPENED: When a lead opens an email
 * - LINK_CLICKED: When a lead clicks a link in an email
 * - EMAIL_BOUNCE: When an email bounces
 * - LEAD_UNSUBSCRIBED: When a lead unsubscribes
 * - LEAD_CATEGORY_UPDATED: When lead category/status changes
 * - THREADED_REPLIES: For threaded conversation replies
 * - CAMPAIGN_STATUS_CHANGE: When campaign status changes
 * - UNTRACKED_REPLIES: Replies that aren't tracked
 * - MANUAL_STEP_REACHED: When manual step is reached in sequence
 */
const SMARTLEAD_EVENT_TYPES = {
  EMAIL_SENT: 'sent',
  EMAIL_OPENED: 'opened',
  LINK_CLICKED: 'clicked',
  EMAIL_BOUNCE: 'bounced',
  EMAIL_REPLY: 'replied',
  LEAD_UNSUBSCRIBED: 'unsubscribed',
  LEAD_CATEGORY_UPDATED: 'category_updated',
  THREADED_REPLIES: 'threaded_reply',
  CAMPAIGN_STATUS_CHANGE: 'status_change',
  UNTRACKED_REPLIES: 'untracked_reply',
  MANUAL_STEP_REACHED: 'manual_step',
} as const;

// Map Smartlead events to our internal event types
const EVENT_TYPE_MAPPING: Record<string, string> = {
  'EMAIL_SENT': 'sent',
  'EMAIL_OPENED': 'opened',
  'LINK_CLICKED': 'clicked',
  'EMAIL_BOUNCE': 'bounced',
  'EMAIL_REPLY': 'replied',
  'LEAD_UNSUBSCRIBED': 'unsubscribed',
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
      // Additional fields Smartlead may include
      ...rest
    } = event;

    console.log(`📧 Event Type: ${eventType}`);
    console.log(`👤 Lead Email: ${leadEmail}`);
    console.log(`🎯 Smartlead Campaign ID: ${smartleadCampaignId}`);
    console.log(`📬 Message ID: ${messageId || 'N/A'}`);
    console.log(`📅 Timestamp: ${timestamp}`);

    // Validate required fields
    if (!eventType || !smartleadCampaignId || !leadEmail) {
      console.error('❌ Missing required fields:', { eventType, smartleadCampaignId, leadEmail });
      return { success: false, error: 'Missing required fields' };
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
    switch (eventType) {
      case 'sent':
      case 'opened':
      case 'clicked':
        updates.last_contacted = new Date().toISOString();
        break;
      case 'replied':
      case 'threaded_reply':
        updates.last_contacted = new Date().toISOString();
        // Note: 'replied' is not a valid status in campaign_leads, keeping as 'active'
        // Status values are: 'active', 'unsubscribed', 'bounced', 'invalid'
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

