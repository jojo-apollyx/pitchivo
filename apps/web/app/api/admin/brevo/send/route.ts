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

// POST - Send email via Brevo
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

    // Send email via Brevo - NO placeholder replacement
    const result = await sendEmail({
      to,
      subject,
      html: content,
      text: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      tags: ['admin-transactional'] // Tag for tracking
    })

    console.log('[admin/brevo/send] Email sent successfully:', result?.messageId)

    // Store initial 'sent' event in database for tracking
    if (result?.messageId) {
      try {
        await supabaseAdmin.from('email_events').insert({
          brevo_message_id: result.messageId,
          recipient_email: to,
          event_type: 'sent',
          event_timestamp: new Date().toISOString(),
          tags: ['admin-transactional'],
          metadata: {
            subject,
            sent_by: 'admin',
            sent_at: new Date().toISOString()
          }
        })
        console.log('[admin/brevo/send] Stored sent event in database')
      } catch (dbError) {
        console.error('[admin/brevo/send] Failed to store event:', dbError)
        // Don't fail the request if event storage fails
      }
    }

    return NextResponse.json({
      success: true,
      messageId: result?.messageId
    })
  } catch (error: any) {
    console.error('[admin/brevo/send] Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

