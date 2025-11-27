/**
 * Shared Email Tracking Service
 * 
 * Handles creating tracking records in brevo_transactional_emails
 * and sending emails with proper tags for webhook matching.
 * 
 * This ensures all transactional emails are tracked and can be matched
 * by webhooks via the brevo_email_ tag.
 */

import { createClient } from '@supabase/supabase-js'
import { sendEmail, type SendEmailOptions, type SendEmailResponse } from '../email'

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

export interface TrackedEmailOptions extends Omit<SendEmailOptions, 'tags'> {
  emailType?: string
  campaignId?: string | null
  recipientName?: string
}

export interface TrackedEmailResponse extends SendEmailResponse {
  brevoEmailId?: string
}

/**
 * Send a tracked transactional email via Brevo
 * 
 * This function:
 * 1. Creates a tracking record in brevo_transactional_emails
 * 2. Sends the email with brevo_email_ tag for webhook matching
 * 3. Updates the tracking record with the message ID
 * 
 * @param options Email options including recipient, subject, content, etc.
 * @returns Response with success status, messageId, and brevoEmailId
 */
export async function sendTrackedEmail(
  options: TrackedEmailOptions
): Promise<TrackedEmailResponse> {
  const {
    to,
    subject,
    htmlContent,
    html,
    textContent,
    text,
    emailType = 'transactional',
    campaignId = null,
    recipientName,
    ...restOptions
  } = options

  // Normalize recipient
  // to can be string or string[], so we extract the first email if it's an array
  const recipientEmail = Array.isArray(to) ? to[0] : to
  const recipientNameValue = recipientName || recipientEmail.split('@')[0]

  // Get content (prefer htmlContent/html, fallback to textContent/text)
  const emailContent = htmlContent || html || textContent || text || ''

  console.log('[sendTrackedEmail] Creating tracking record:', {
    recipientEmail,
    subject,
    emailType,
    campaignId,
  })

  // Step 1: Create brevo_transactional_emails record first (for tracking)
  const { data: insertedData, error: insertError } = await supabaseAdmin
    .from('brevo_transactional_emails')
    .insert({
      recipient_email: recipientEmail,
      recipient_name: recipientNameValue,
      subject,
      content: emailContent,
      scheduled_time: new Date().toISOString(),
      status: 'pending',
      email_type: emailType,
      campaign_id: campaignId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select('brevo_email_id')
    .single()

  if (insertError) {
    console.error('[sendTrackedEmail] Error creating email record:', insertError)
    return {
      success: false,
      error: `Failed to create email record: ${insertError.message}`,
    }
  }

  const brevoEmailId = insertedData.brevo_email_id
  console.log('[sendTrackedEmail] Tracking record created:', brevoEmailId)

  // Step 2: Send email via Brevo with brevo_email tag for webhook tracking
  const result = await sendEmail({
    ...restOptions,
    to,
    subject,
    htmlContent: htmlContent || html,
    textContent: textContent || text,
    tags: [`brevo_email_${brevoEmailId}`], // Tag for webhook tracking
  })

  if (!result.success) {
    console.error('[sendTrackedEmail] Email sending failed:', result.error)
    // Update tracking record to failed status
    await supabaseAdmin
      .from('brevo_transactional_emails')
      .update({
        status: 'failed',
        error_message: result.error || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('brevo_email_id', brevoEmailId)
    
    return {
      ...result,
      brevoEmailId,
    }
  }

  console.log('[sendTrackedEmail] Email sent successfully:', result.messageId)

  // Step 3: Update brevo_transactional_emails record to 'sent' status with message ID
  const { error: updateError } = await supabaseAdmin
    .from('brevo_transactional_emails')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      brevo_message_id: result.messageId || null,
      updated_at: new Date().toISOString()
    })
    .eq('brevo_email_id', brevoEmailId)

  if (updateError) {
    console.error('[sendTrackedEmail] Error updating email status:', updateError)
    // Don't fail the request, but log the error
  } else {
    console.log('[sendTrackedEmail] Tracking record updated to sent')
  }

  return {
    ...result,
    brevoEmailId,
  }
}

