// Supabase Edge Function to send scheduled emails
// This function should be triggered by a cron job every hour

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const BREVO_SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') || 'noreply@pitchivo.com'
const BREVO_SENDER_NAME = Deno.env.get('BREVO_SENDER_NAME') || 'Pitchivo'

interface ScheduledEmail {
  scheduled_email_id: string
  campaign_id: string
  recipient_email: string
  recipient_company: string | null
  recipient_name: string | null
  subject: string
  content: string
  scheduled_time: string
  status: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify Brevo API key
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time + 10 minutes buffer
    const now = new Date()
    const bufferTime = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes ahead

    console.log(`Checking for emails scheduled before ${bufferTime.toISOString()}`)

    // Fetch pending scheduled emails that should be sent now
    // Join with campaigns to check if processing is paused by admin
    const { data: scheduledEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select(`
        *,
        campaigns!inner(
          campaign_id,
          admin_processing_paused
        )
      `)
      .eq('status', 'pending')
      .eq('campaigns.admin_processing_paused', false)
      .lte('scheduled_time', bufferTime.toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(100) // Process up to 100 emails per run

    if (fetchError) {
      console.error('Error fetching scheduled emails:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch scheduled emails', details: fetchError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!scheduledEmails || scheduledEmails.length === 0) {
      console.log('No emails to send at this time (may be paused by admin or none scheduled)')
      return new Response(
        JSON.stringify({ message: 'No emails to send', processed: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${scheduledEmails.length} emails to send (admin-paused campaigns excluded)`)

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as Array<{ email: string; error: string }>
    }

    // Process each email
    for (const email of scheduledEmails as ScheduledEmail[]) {
      try {
        // Send email via Brevo
        const brevoPayload = {
          sender: {
            email: BREVO_SENDER_EMAIL,
            name: BREVO_SENDER_NAME
          },
          to: [{
            email: email.recipient_email,
            name: email.recipient_name || undefined
          }],
          subject: email.subject,
          htmlContent: `
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
                    ${email.content.replace(/\n/g, '<br>')}
                  </div>
                  <div class="footer">
                    <p>This email was sent via Pitchivo Campaign Management</p>
                    <p>Campaign ID: ${email.campaign_id}</p>
                  </div>
                </div>
              </body>
            </html>
          `,
          textContent: email.content,
          tags: [`campaign_${email.campaign_id}`]
        }

        const brevoResponse = await fetch(BREVO_API_URL, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': BREVO_API_KEY,
            'content-type': 'application/json'
          },
          body: JSON.stringify(brevoPayload)
        })

        if (!brevoResponse.ok) {
          const errorText = await brevoResponse.text()
          throw new Error(`Brevo API error: ${errorText}`)
        }

        const brevoResult = await brevoResponse.json()

        // Update scheduled email status to sent
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('scheduled_email_id', email.scheduled_email_id)

        // Increment campaign metrics
        await supabase.rpc('increment_campaign_metric', {
          p_campaign_id: email.campaign_id,
          p_metric: 'emails_sent',
          p_increment: 1
        })

        await supabase.rpc('increment_campaign_metric', {
          p_campaign_id: email.campaign_id,
          p_metric: 'emails_delivered',
          p_increment: 1
        })

        // Log activity
        await supabase
          .from('campaign_activities')
          .insert({
            campaign_id: email.campaign_id,
            activity_type: 'email_sent',
            buyer_company: email.recipient_company,
            contact_email: email.recipient_email,
            metadata: {
              event: 'delivered',
              name: email.recipient_name,
              company: email.recipient_company,
              messageId: brevoResult.messageId
            }
          })

        results.sent++
        console.log(`✓ Sent email to ${email.recipient_email}`)
      } catch (error: any) {
        console.error(`✗ Failed to send email to ${email.recipient_email}:`, error.message)

        // Update scheduled email status to failed
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('scheduled_email_id', email.scheduled_email_id)

        results.failed++
        results.errors.push({
          email: email.recipient_email,
          error: error.message
        })
      }
    }

    console.log(`Completed: ${results.sent} sent, ${results.failed} failed`)

    return new Response(
      JSON.stringify({
        message: 'Scheduled emails processed',
        processed: scheduledEmails.length,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error: any) {
    console.error('Error in send-scheduled-emails function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

