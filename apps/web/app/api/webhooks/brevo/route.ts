import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client (bypasses RLS)
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

/**
 * Brevo Webhook Handler
 * 
 * Handles real-time email events from Brevo (Sendinblue):
 * - delivered: Email successfully delivered
 * - opened: Email opened by recipient
 * - clicked: Link clicked in email
 * - soft_bounce: Temporary delivery failure
 * - hard_bounce: Permanent delivery failure
 * - spam: Marked as spam
 * - blocked: Email blocked
 * 
 * Webhook Setup in Brevo:
 * 1. Go to https://app.brevo.com/settings/transactional-webhooks
 * 2. Create new webhook
 * 3. Set URL: https://your-domain.com/api/webhooks/brevo
 * 4. Select Authentication: Token Authentication (recommended)
 * 5. Generate and save a secure token
 * 6. Set BREVO_WEBHOOK_TOKEN environment variable with the token
 * 7. Select events: delivered, opened, clicked, soft_bounce, hard_bounce
 * 8. Save webhook
 * 
 * Security:
 * - Token is validated on every request via Authorization header
 * - If BREVO_WEBHOOK_TOKEN is not set, authentication is skipped (not recommended for production)
 */

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authentication token
    const authHeader = request.headers.get('authorization')
    const webhookToken = process.env.BREVO_WEBHOOK_TOKEN
    
    if (webhookToken) {
      // Token authentication: Brevo sends token in Authorization header as "Bearer <token>"
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Brevo webhook: Missing or invalid Authorization header')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      
      const token = authHeader.replace('Bearer ', '')
      if (token !== webhookToken) {
        console.warn('Brevo webhook: Invalid token')
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }
    
    const body = await request.json()
    
    console.log('Brevo webhook received:', JSON.stringify(body, null, 2))

    // Extract event data
    const {
      event,           // Event type: delivered, opened, clicked, soft_bounce, hard_bounce, etc.
      email,           // Recipient email
      'message-id': messageId,  // Brevo message ID
      tag,             // Custom tag (we'll use this for campaign_id)
      ts,              // Unix timestamp
      date,            // ISO date string
    } = body

    if (!event || !email) {
      console.warn('Invalid webhook payload: missing event or email')
      return NextResponse.json({ success: true }) // Return 200 to avoid retries
    }

    // Extract campaign_id from tag or message-id
    // Format: "campaign_{campaign_id}"
    let campaignId: string | null = null
    
    if (tag && typeof tag === 'string' && tag.startsWith('campaign_')) {
      campaignId = tag.replace('campaign_', '')
    }

    if (!campaignId) {
      console.log('No campaign_id found in webhook, skipping metric update')
      return NextResponse.json({ success: true })
    }

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id, emails_sent, emails_delivered, emails_opened, emails_clicked, emails_bounced')
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError || !campaign) {
      console.warn(`Campaign not found: ${campaignId}`)
      return NextResponse.json({ success: true })
    }

    // Update metrics based on event type
    const updates: Record<string, number> = {}

    switch (event) {
      case 'delivered':
        updates.emails_delivered = (campaign.emails_delivered || 0) + 1
        break

      case 'request':
      case 'unique_opened':
        updates.emails_opened = (campaign.emails_opened || 0) + 1
        break

      case 'click':
      case 'unique_clicked':
        updates.emails_clicked = (campaign.emails_clicked || 0) + 1
        break

      case 'soft_bounce':
      case 'hard_bounce':
      case 'invalid_email':
        updates.emails_bounced = (campaign.emails_bounced || 0) + 1
        break

      default:
        console.log(`Unhandled event type: ${event}`)
        return NextResponse.json({ success: true })
    }

    // Update campaign metrics
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('campaigns')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (updateError) {
        console.error('Error updating campaign metrics:', updateError)
        throw updateError
      }

      console.log(`Campaign ${campaignId} updated:`, updates)
    }

    // Create activity record
    let activityType: string | null = null
    switch (event) {
      case 'unique_opened':
        activityType = 'email_opened'
        break
      case 'click':
      case 'unique_clicked':
        activityType = 'email_clicked'
        break
      case 'soft_bounce':
      case 'hard_bounce':
        activityType = 'email_bounced'
        break
    }

    if (activityType) {
      await supabaseAdmin
        .from('campaign_activities')
        .insert({
          campaign_id: campaignId,
          activity_type: activityType,
          contact_email: email,
          metadata: {
            event,
            messageId,
            timestamp: ts || date,
            raw_event: body
          }
        })
    }

    return NextResponse.json({
      success: true,
      campaignId,
      event,
      updates
    })

  } catch (error: any) {
    console.error('Error processing Brevo webhook:', error)
    
    // Return 200 even on error to prevent Brevo from retrying
    // Log errors for debugging but don't fail the webhook
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}

// Allow GET for webhook verification
// Brevo may send GET requests with or without authentication to verify the endpoint
export async function GET(request: NextRequest) {
  // Optionally verify token if provided (for security)
  // But don't require it for verification requests
  const authHeader = request.headers.get('authorization')
  const webhookToken = process.env.BREVO_WEBHOOK_TOKEN
  
  // If token is provided, verify it; otherwise allow access for verification
  if (webhookToken && authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '')
    if (token !== webhookToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'Brevo webhook endpoint is active',
    events: [
      'delivered',
      'opened',
      'clicked',
      'soft_bounce',
      'hard_bounce',
      'spam',
      'blocked'
    ]
  })
}

