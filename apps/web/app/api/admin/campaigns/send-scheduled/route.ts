import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
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

// POST: Send a scheduled email immediately
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { scheduledEmailId } = body

    if (!scheduledEmailId) {
      return NextResponse.json(
        { error: 'Missing scheduledEmailId' },
        { status: 400 }
      )
    }

    // Fetch scheduled email
    const { data: scheduledEmail, error: fetchError } = await supabaseAdmin
      .from('scheduled_emails')
      .select('*')
      .eq('scheduled_email_id', scheduledEmailId)
      .single()

    if (fetchError || !scheduledEmail) {
      return NextResponse.json(
        { error: 'Scheduled email not found' },
        { status: 404 }
      )
    }

    // Check if already sent
    if (scheduledEmail.status === 'sent') {
      return NextResponse.json(
        { error: 'Email has already been sent' },
        { status: 400 }
      )
    }

    // Send the email
    try {
      const result = await sendEmail({
        to: scheduledEmail.recipient_email,
        subject: scheduledEmail.subject,
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
                  ${scheduledEmail.content.replace(/\n/g, '<br>')}
                </div>
                <div class="footer">
                  <p>This email was sent via Pitchivo Campaign Management</p>
                  <p>Campaign ID: ${scheduledEmail.campaign_id}</p>
                </div>
              </div>
            </body>
          </html>
        `,
        text: scheduledEmail.content,
        tags: [`campaign_${scheduledEmail.campaign_id}`] // CRITICAL: Campaign tag for webhook tracking
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      // Update scheduled email status with Brevo message ID
      const { error: updateError } = await supabaseAdmin
        .from('scheduled_emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          brevo_message_id: result.messageId || null,
          updated_at: new Date().toISOString()
        })
        .eq('scheduled_email_id', scheduledEmailId)

      if (updateError) {
        console.error('Error updating scheduled email status:', updateError)
      }

      // Update campaign metrics
      // Note: emails_delivered will be incremented by Brevo webhook when actually delivered
      const { error: sentMetricError } = await supabaseAdmin.rpc('increment_campaign_metric', {
        p_campaign_id: scheduledEmail.campaign_id,
        p_metric: 'emails_sent',
        p_increment: 1
      })
      if (sentMetricError) console.error('Error incrementing emails_sent metric:', sentMetricError)

      // Log activity
      const { error: activityError } = await supabaseAdmin
        .from('campaign_activities')
        .insert({
          campaign_id: scheduledEmail.campaign_id,
          activity_type: 'email_sent',
          buyer_company: scheduledEmail.recipient_company,
          contact_email: scheduledEmail.recipient_email,
          metadata: {
            event: 'sent',
            name: scheduledEmail.recipient_name,
            company: scheduledEmail.recipient_company,
            messageId: result.messageId,
            scheduled_email_id: scheduledEmailId
          }
        })
      if (activityError) console.error('Error logging activity:', activityError)

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      })
    } catch (emailError: any) {
      console.error('Error sending scheduled email:', emailError)

      // Update status to failed
      const { error: updateFailedError } = await supabaseAdmin
        .from('scheduled_emails')
        .update({
          status: 'failed',
          error_message: emailError.message,
          updated_at: new Date().toISOString()
        })
        .eq('scheduled_email_id', scheduledEmailId)
      if (updateFailedError) console.error('Error updating scheduled email to failed status:', updateFailedError)

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in send scheduled email:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
