import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/emails/brevo'
import { createClient } from '@supabase/supabase-js'

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

// POST - Send email via Brevo (transactional emails only, not for campaigns)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, content } = body

    if (!to || !subject || !content) {
      return NextResponse.json(
        { error: 'Recipient, subject, and content are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    console.log('[admin/brevo/send] Sending email to:', to)

    // Create brevo_transactional_emails record first (for tracking)
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('brevo_transactional_emails')
      .insert({
        recipient_email: to,
        recipient_name: to.split('@')[0],
        subject,
        content,
        scheduled_time: new Date().toISOString(),
        status: 'pending',
        email_type: 'admin-transactional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('brevo_email_id')
      .single()

    if (insertError) {
      console.error('[admin/brevo/send] Error creating email record:', insertError)
      return NextResponse.json(
        { error: 'Failed to create email record', details: insertError.message },
        { status: 500 }
      )
    }

    const brevoEmailId = insertedData.brevo_email_id
    console.log('[admin/brevo/send] Brevo transactional email record created with ID:', brevoEmailId)

    // Send email via Brevo with brevo_email tag for webhook tracking
    const result = await sendEmail({
      to,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      tags: [`brevo_email_${brevoEmailId}`] // Tag for webhook tracking
    })

    console.log('[admin/brevo/send] Email sent successfully:', result?.messageId)

    // Update brevo_transactional_emails record to 'sent' status
    const { error: updateError } = await supabaseAdmin
      .from('brevo_transactional_emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        brevo_message_id: result?.messageId || null,
        updated_at: new Date().toISOString()
      })
      .eq('brevo_email_id', brevoEmailId)

    if (updateError) {
      console.error('[admin/brevo/send] Error updating email status:', updateError)
    } else {
      console.log('[admin/brevo/send] Email status updated to sent')
    }

    return NextResponse.json({
      success: true,
      messageId: result?.messageId,
      brevoEmailId
    })
  } catch (error: any) {
    console.error('[admin/brevo/send] Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

