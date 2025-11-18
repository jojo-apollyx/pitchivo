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
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
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
    if (!campaignId || !to || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Fetch campaign details for placeholder replacement
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

    if (campaignError || !campaign) {
      console.error('Campaign fetch error:', campaignError)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const orgId = campaign.products?.org_id

    // Check quota before sending (skip for test campaigns)
    if (orgId && !campaign.is_test) {
      const quotaCheck = await checkEmailQuota(orgId, 1)
      if (!quotaCheck.canSend) {
        console.error('Quota exceeded for organization:', orgId)
        return NextResponse.json(
          { 
            error: 'Email quota exceeded',
            remaining: quotaCheck.remaining,
            quota: quotaCheck.quota
          },
          { status: 429 }
        )
      }
    }

    // Extract recipient company name from email
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

    // Replace placeholders in content and subject
    let processedContent = content
    let processedSubject = subject

    Object.entries(placeholders).forEach(([placeholder, value]) => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g')
      processedContent = processedContent.replace(regex, value)
      processedSubject = processedSubject.replace(regex, value)
    })

    // Create scheduled_emails record first (for tracking)
    const scheduledEmailId = `scheduled_${campaignId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    const { error: insertError } = await supabaseAdmin
      .from('scheduled_emails')
      .insert({
        scheduled_email_id: scheduledEmailId,
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error creating scheduled email record:', insertError)
      return NextResponse.json(
        { error: 'Failed to create email record', details: insertError.message },
        { status: 500 }
      )
    }

    // Send email via Brevo/Sendinblue with campaign tracking tag
    try {
      const emailResult = await sendEmail({
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
      })

      // Update scheduled_emails record to 'sent' status
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
        console.error('Error updating scheduled email status:', updateError)
      }

      // Increment campaign emails_sent counter
      const { error: metricError } = await supabaseAdmin.rpc('increment_campaign_metric', {
        p_campaign_id: campaignId,
        p_metric: 'emails_sent',
        p_increment: 1
      })

      if (metricError) {
        console.error('Error incrementing campaign metric:', metricError)
      }

      // Increment email usage after successful send (skip for test campaigns)
      if (orgId && !campaign.is_test) {
        await incrementEmailUsage(orgId, 1)
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        campaignId,
        to,
        scheduledEmailId,
        messageId: emailResult?.messageId
      })
    } catch (emailError: any) {
      console.error('Error sending email:', emailError)
      
      // Mark scheduled email as failed
      await supabaseAdmin
        .from('scheduled_emails')
        .update({
          status: 'failed',
          error: emailError.message,
          updated_at: new Date().toISOString()
        })
        .eq('scheduled_email_id', scheduledEmailId)

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in send campaign email API:', error)
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

