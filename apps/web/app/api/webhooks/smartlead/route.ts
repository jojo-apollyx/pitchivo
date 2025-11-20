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

// Smartlead event type mapping
const SMARTLEAD_EVENT_TYPES = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  OPENED: 'opened',
  CLICKED: 'clicked',
  BOUNCED: 'bounced',
  SOFT_BOUNCED: 'soft_bounced',
  HARD_BOUNCED: 'hard_bounced',
  REPLIED: 'replied',
  UNSUBSCRIBED: 'unsubscribed',
  SPAM_COMPLAINT: 'spam_complaint',
  ERROR: 'error',
} as const;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('============================================');
    console.log('🚀 SMARTLEAD WEBHOOK RECEIVED');
    console.log('Timestamp:', new Date().toISOString());
    
    // Verify webhook signature (if Smartlead provides one)
    const signature = request.headers.get('x-smartlead-signature');
    const webhookSecret = process.env.SMARTLEAD_WEBHOOK_SECRET;
    
    if (webhookSecret && signature) {
      // TODO: Implement signature verification based on Smartlead docs
      // const isValid = verifySignature(body, signature, webhookSecret)
      // if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
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
    const {
      event_type,
      campaign_id: smartleadCampaignId,
      lead_email,
      lead_id: smartleadLeadId,
      email_account,
      message_id,
      timestamp,
      link,
      reply_text,
      reply_subject,
      bounce_reason,
      bounce_type,
      user_agent,
      device,
      location,
      ...rest
    } = event;

    console.log(`📧 Event Type: ${event_type}`);
    console.log(`👤 Lead Email: ${lead_email}`);
    console.log(`🎯 Smartlead Campaign ID: ${smartleadCampaignId}`);
    console.log(`📬 Message ID: ${message_id || 'N/A'}`);
    console.log(`📅 Timestamp: ${timestamp}`);

    // Validate required fields
    if (!event_type || !smartleadCampaignId || !lead_email) {
      console.error('❌ Missing required fields:', { event_type, smartleadCampaignId, lead_email });
      return { success: false, error: 'Missing required fields' };
    }

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
      .from('leads')
      .select('lead_id')
      .eq('campaign_id', campaignId)
      .eq('email', lead_email)
      .single();

    const leadId = lead?.lead_id;

    // Prepare metadata
    const metadata: any = {
      smartlead_lead_id: smartleadLeadId,
      email_account,
      message_id,
      user_agent,
      device,
      location,
      ...rest
    };

    if (link) metadata.link = link;
    if (reply_text) metadata.reply_text = reply_text;
    if (reply_subject) metadata.reply_subject = reply_subject;
    if (bounce_reason) metadata.bounce_reason = bounce_reason;
    if (bounce_type) metadata.bounce_type = bounce_type;

    // Insert event into smartlead_email_events table
    console.log(`💾 Inserting Smartlead email event...`);
    const { error: insertError } = await supabaseAdmin
      .from('smartlead_email_events')
      .insert({
        campaign_id: campaignId,
        lead_id: leadId,
        smartlead_campaign_id: smartleadCampaignId,
        smartlead_lead_id: smartleadLeadId,
        lead_email,
        event_type,
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
    await updateCampaignMetricsFromSmartlead(campaignId, event_type);

    // Update lead status if exists
    if (leadId) {
      console.log(`👤 Updating lead status...`);
      await updateLeadStatus(leadId, event_type);
    }

    // Handle special events
    if (event_type === SMARTLEAD_EVENT_TYPES.REPLIED) {
      console.log(`💬 REPLY RECEIVED - Creating reply record`);
      await handleReply(campaignId, leadId, lead_email, reply_text, reply_subject, timestamp);
    }

    if (event_type === SMARTLEAD_EVENT_TYPES.UNSUBSCRIBED) {
      console.log(`🚫 UNSUBSCRIBE - Marking lead as unsubscribed`);
      await handleUnsubscribe(campaignId, leadId, lead_email);
    }

    console.log(`✅ Event processed successfully`);
    return { 
      success: true, 
      campaignId,
      smartleadCampaignId,
      eventType: event_type, 
      leadEmail: lead_email,
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
      case SMARTLEAD_EVENT_TYPES.SENT:
        metricColumn = 'emails_sent';
        break;
      case SMARTLEAD_EVENT_TYPES.DELIVERED:
        metricColumn = 'emails_delivered';
        break;
      case SMARTLEAD_EVENT_TYPES.OPENED:
        metricColumn = 'emails_opened';
        break;
      case SMARTLEAD_EVENT_TYPES.CLICKED:
        metricColumn = 'emails_clicked';
        break;
      case SMARTLEAD_EVENT_TYPES.BOUNCED:
      case SMARTLEAD_EVENT_TYPES.HARD_BOUNCED:
      case SMARTLEAD_EVENT_TYPES.SOFT_BOUNCED:
        metricColumn = 'emails_bounced';
        break;
      case SMARTLEAD_EVENT_TYPES.REPLIED:
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

    // Update last activity based on event type
    switch (eventType) {
      case SMARTLEAD_EVENT_TYPES.SENT:
        updates.last_email_sent_at = new Date().toISOString();
        break;
      case SMARTLEAD_EVENT_TYPES.OPENED:
        updates.last_opened_at = new Date().toISOString();
        break;
      case SMARTLEAD_EVENT_TYPES.CLICKED:
        updates.last_clicked_at = new Date().toISOString();
        break;
      case SMARTLEAD_EVENT_TYPES.REPLIED:
        updates.last_replied_at = new Date().toISOString();
        updates.status = 'replied';
        break;
      case SMARTLEAD_EVENT_TYPES.BOUNCED:
      case SMARTLEAD_EVENT_TYPES.HARD_BOUNCED:
        updates.status = 'bounced';
        break;
      case SMARTLEAD_EVENT_TYPES.UNSUBSCRIBED:
        updates.status = 'unsubscribed';
        break;
    }

    const { error } = await supabaseAdmin
      .from('leads')
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
        .from('leads')
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString()
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

