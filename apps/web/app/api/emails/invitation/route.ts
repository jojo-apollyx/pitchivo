/**
 * API Route for Sending Invitation Emails
 * 
 * This route handles sending invitation emails with proper tracking.
 * It creates a tracking record in brevo_transactional_emails and sends
 * the email with the brevo_email_ tag for webhook matching.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'
import { createInvitationEmail } from '@/lib/emails/templates/client/invitation'
import { createClient } from '@/lib/supabase/server'

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      )
    }

    // Check authentication (only authenticated users can send invitations)
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[api/emails/invitation] Sending invitation email:', {
      to,
      fullName,
      company,
      sentBy: user.email,
      timestamp: new Date().toISOString(),
    })

    // Create email template
    const template = createInvitationEmail({
      fullName,
      company,
    })

    // Send tracked email
    const result = await sendTrackedEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
      emailType: 'invitation',
      recipientName: fullName,
    })

    if (!result.success) {
      console.error('[api/emails/invitation] Failed to send email:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to send invitation email' },
        { status: 500 }
      )
    }

    console.log('[api/emails/invitation] Invitation email sent successfully:', {
      to,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
    })
  } catch (error: any) {
    console.error('[api/emails/invitation] Error sending invitation email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send invitation email' },
      { status: 500 }
    )
  }
}

