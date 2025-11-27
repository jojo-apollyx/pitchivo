/**
 * API Route for Sending Welcome Emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'
import { createWelcomeEmail } from '@/lib/emails/templates/client/welcome'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, userName, companyName } = body

    if (!to || !userName) {
      return NextResponse.json(
        { error: 'Recipient email and user name are required' },
        { status: 400 }
      )
    }

    // Check authentication (optional - welcome emails might be sent during signup)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const template = createWelcomeEmail({
      userName,
      companyName,
    })

    const result = await sendTrackedEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
      emailType: 'welcome',
      recipientName: userName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send welcome email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
    })
  } catch (error: any) {
    console.error('[api/emails/welcome] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}

