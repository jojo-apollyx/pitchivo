/**
 * API Route for Sending Waitlist Confirmation Emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'
import { createWaitlistConfirmationEmail } from '@/lib/emails/templates/client/waitlist-confirmation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, fullName, company } = body

    if (!to || !fullName || !company) {
      return NextResponse.json(
        { error: 'Recipient email, full name, and company are required' },
        { status: 400 }
      )
    }

    const template = createWaitlistConfirmationEmail({
      fullName,
      company,
    })

    const result = await sendTrackedEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
      emailType: 'waitlist_confirmation',
      recipientName: fullName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send waitlist confirmation email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
    })
  } catch (error: any) {
    console.error('[api/emails/waitlist-confirmation] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send waitlist confirmation email' },
      { status: 500 }
    )
  }
}

