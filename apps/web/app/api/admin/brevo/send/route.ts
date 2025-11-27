import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'

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

    // Use shared tracked email service
    const result = await sendTrackedEmail({
      to,
      subject,
      htmlContent: content,
      textContent: content.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      emailType: 'admin-transactional',
      recipientName: to.split('@')[0],
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId
    })
  } catch (error: any) {
    console.error('[admin/brevo/send] Error sending email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

