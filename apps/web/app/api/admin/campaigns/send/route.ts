import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import { createClient } from '@supabase/supabase-js'
import { checkEmailQuota, incrementEmailUsage } from '@/lib/utils/quotas'

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

export async function POST(request: NextRequest) {
  console.log('[campaigns/send] Route handler called')
  console.log('[campaigns/send] Request URL:', request.url)
  console.log('[campaigns/send] Request method:', request.method)
  
  try {
    // Verify admin access
    console.log('[campaigns/send] Checking admin access')
    await requireAdmin()
    console.log('[campaigns/send] Admin access verified')

    console.log('[campaigns/send] Parsing request body')
    let body
    try {
      body = await request.json()
      console.log('[campaigns/send] Request body parsed:', JSON.stringify({ 
        campaignId: body.campaignId, 
        to: body.to, 
        hasSubject: !!body.subject, 
        hasContent: !!body.content,
        leadId: body.leadId 
      }))
    } catch (error) {
      console.error('[campaigns/send] Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400 }
      )
    }
    
    const { 
      campaignId, 
      to, 
      subject, 
      content,
      leadId,
      recipientName,
      recipientTitle,
      recipientCompany
    } = body

    // Validate input
    console.log('[campaigns/send] Validating input')
    if (!campaignId || !to || !subject || !content) {
      console.log('[campaigns/send] Missing required fields:', { campaignId: !!campaignId, to: !!to, subject: !!subject, content: !!content })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      console.log('[campaigns/send] Invalid email format:', to)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }
    console.log('[campaigns/send] Input validation passed')

    // Fetch campaign details for placeholder replacement
    console.log('[campaigns/send] Fetching campaign:', campaignId)
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        products (
          product_id,
          product_name,
          org_id,
          organizations (
            name,
            slug
          )
        )
      `)
      .eq('campaign_id', campaignId)
      .single()

    if (campaignError) {
      console.error('[campaigns/send] Campaign fetch error:', campaignError)
    }
    
    if (campaignError || !campaign) {
      console.log('[campaigns/send] Campaign not found. Error:', campaignError?.message, 'Campaign:', campaign)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    console.log('[campaigns/send] Campaign found:', campaign.campaign_name, 'Org ID:', campaign.products?.org_id, 'Is test:', campaign.is_test)

    const orgId = campaign.products?.org_id

    // Check quota before sending (skip for test campaigns)
    if (orgId && !campaign.is_test) {
      console.log('[campaigns/send] Checking email quota for org:', orgId)
      try {
        const quotaCheck = await checkEmailQuota(orgId, 1)
        console.log('[campaigns/send] Quota check result:', quotaCheck)
        if (!quotaCheck.canSend) {
          console.error('[campaigns/send] Quota exceeded for organization:', orgId, 'Remaining:', quotaCheck.remaining, 'Quota:', quotaCheck.quota)
          return NextResponse.json(
            { 
              error: 'Email quota exceeded',
              remaining: quotaCheck.remaining,
              quota: quotaCheck.quota
            },
            { status: 429 }
          )
        }
      } catch (quotaError) {
        console.error('[campaigns/send] Error checking quota:', quotaError)
        throw quotaError
      }
    } else {
      console.log('[campaigns/send] Skipping quota check (test campaign or no org ID)')
    }

    // Extract recipient company name from email
    console.log('[campaigns/send] Processing placeholders')
    const buyerName = to.split('@')[1]?.split('.')[0] || 'Valued Partner'

    // Build placeholder values
    const orgName = campaign.products?.organizations?.name || 'Pitchivo'
    const placeholders: Record<string, string> = {
      '{{product_link}}': campaign.products 
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://pitchivo.com'}/products/${campaign.products.product_id}`
        : '',
      '{{product_name}}': campaign.products?.product_name || 'Our Product',
      '{{buyer_name}}': buyerName.charAt(0).toUpperCase() + buyerName.slice(1),
      '{{org_name}}': orgName,
      '{{organization_name}}': orgName  // Support both placeholder formats
    }
    console.log('[campaigns/send] Placeholders:', placeholders)

    // Replace placeholders in content and subject
    let processedContent = content
    let processedSubject = subject

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
      processedContent = processedContent.replace(regex, value)
      processedSubject = processedSubject.replace(regex, value)
    })
    console.log('[campaigns/send] Placeholders replaced')

    // Create scheduled_emails record first (for tracking)
    // Let the database generate the UUID automatically (DEFAULT gen_random_uuid())
    console.log('[campaigns/send] Creating scheduled_emails record')
    
    // Get next send sequence number if leadId is provided
    let sendSequenceNumber = 1
    if (leadId) {
      const { data: sequenceData } = await supabaseAdmin
        .rpc('get_next_send_sequence', { 
          p_lead_id: leadId, 
          p_campaign_id: campaignId 
        })
      
      if (sequenceData) {
        sendSequenceNumber = sequenceData
        console.log('[campaigns/send] Using send sequence number:', sendSequenceNumber)
      }
    }
    
    const scheduledEmailData = {
      // Don't provide scheduled_email_id - let database generate UUID
      campaign_id: campaignId,
      lead_id: leadId || null,
      recipient_email: to,
      recipient_name: recipientName || to.split('@')[0],
      recipient_title: recipientTitle || null,
      recipient_company: recipientCompany || to.split('@')[1]?.split('.')[0] || null,
      subject: processedSubject,
      content: processedContent,
      scheduled_time: new Date().toISOString(),
      status: 'pending', // Will be updated to 'sent' after successful send
      send_sequence_number: sendSequenceNumber,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    console.log('[campaigns/send] Scheduled email data:', JSON.stringify({ ...scheduledEmailData, content: '[truncated]' }))
    
    // Insert and get the generated UUID back
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('scheduled_emails')
      .insert(scheduledEmailData)
      .select('scheduled_email_id')
      .single()

    if (insertError) {
      console.error('[campaigns/send] Error creating scheduled email record:', insertError)
      console.error('[campaigns/send] Insert error details:', JSON.stringify(insertError))
      return NextResponse.json(
        { error: 'Failed to create email record', details: insertError.message },
        { status: 500 }
      )
    }
    
    const scheduledEmailId = insertedData.scheduled_email_id
    console.log('[campaigns/send] Scheduled email record created with ID:', scheduledEmailId)

    // Send email via Brevo/Sendinblue with campaign tracking tag
    console.log('[campaigns/send] Preparing to send email via Brevo')
    try {
      const emailPayload = {
        to,
        subject: processedSubject,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .content { background: #ffffff; border-radius: 8px; padding: 30px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
                a { color: #10B981; text-decoration: none; }
                a:hover { text-decoration: underline; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  ${processedContent.replace(/\n/g, '<br>')}
                </div>
                <div class="footer">
                  <p>This email was sent via Pitchivo Campaign Management</p>
                  <p>Campaign ID: ${campaignId}</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: processedContent,
        // Add campaign tag for webhook tracking - CRITICAL for Brevo webhooks to update campaign stats
        tags: [`campaign_${campaignId}`]
      }
      console.log('[campaigns/send] Email payload tags:', emailPayload.tags)
      console.log('[campaigns/send] Calling sendEmail function')
      const emailResult = await sendEmail(emailPayload)
      console.log('[campaigns/send] Email sent successfully. Message ID:', emailResult?.messageId)

      // Update scheduled_emails record to 'sent' status
      console.log('[campaigns/send] Updating scheduled_emails status to sent')
      const { error: updateError } = await supabaseAdmin
        .from('scheduled_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          brevo_message_id: emailResult?.messageId || null,
          updated_at: new Date().toISOString()
        })
        .eq('scheduled_email_id', scheduledEmailId)

      if (updateError) {
        console.error('[campaigns/send] Error updating scheduled email status:', updateError)
      } else {
        console.log('[campaigns/send] Scheduled email status updated to sent')
      }

      // Increment campaign emails_sent counter
      console.log('[campaigns/send] Incrementing campaign metric')
      const { error: metricError } = await supabaseAdmin.rpc('increment_campaign_metric', {
        p_campaign_id: campaignId,
        p_metric: 'emails_sent',
        p_increment: 1
      })

      if (metricError) {
        console.error('[campaigns/send] Error incrementing campaign metric:', metricError)
      } else {
        console.log('[campaigns/send] Campaign metric incremented')
      }

      // Increment email usage after successful send (skip for test campaigns)
      if (orgId && !campaign.is_test) {
        console.log('[campaigns/send] Incrementing email usage for org:', orgId)
        try {
          await incrementEmailUsage(orgId, 1)
          console.log('[campaigns/send] Email usage incremented')
        } catch (usageError) {
          console.error('[campaigns/send] Error incrementing email usage:', usageError)
          // Don't fail the request if usage increment fails
        }
      }

      console.log('[campaigns/send] Email send process completed successfully')
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        campaignId,
        to,
        scheduledEmailId,
        messageId: emailResult?.messageId
      })
    } catch (emailError: any) {
      console.error('[campaigns/send] Error sending email:', emailError)
      console.error('[campaigns/send] Email error stack:', emailError?.stack)
      console.error('[campaigns/send] Email error details:', JSON.stringify({
        message: emailError?.message,
        name: emailError?.name,
        code: emailError?.code
      }))
      
      // Mark scheduled email as failed
      console.log('[campaigns/send] Marking scheduled email as failed')
      try {
        await supabaseAdmin
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error: emailError.message,
            updated_at: new Date().toISOString()
          })
          .eq('scheduled_email_id', scheduledEmailId)
        console.log('[campaigns/send] Scheduled email marked as failed')
      } catch (updateErr) {
        console.error('[campaigns/send] Error updating scheduled email to failed status:', updateErr)
      }

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[campaigns/send] Unexpected error in route handler:', error)
    console.error('[campaigns/send] Error type:', error?.constructor?.name)
    console.error('[campaigns/send] Error message:', error?.message)
    console.error('[campaigns/send] Error stack:', error?.stack)
    console.error('[campaigns/send] Full error:', JSON.stringify({
      name: error?.name,
      message: error?.message,
      code: error?.code,
      cause: error?.cause
    }, null, 2))
    
    if (error.message === 'Unauthorized') {
      console.log('[campaigns/send] Unauthorized error - returning 403')
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('[campaigns/send] Returning 500 error response')
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
}

