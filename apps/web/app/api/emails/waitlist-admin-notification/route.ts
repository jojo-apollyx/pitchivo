/**
 * API Route for Sending Waitlist Admin Notification Emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'
import { createWaitlistAdminNotificationEmail } from '@/lib/emails/templates/admin/waitlist-notification'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminEmails, waitlistEntry } = body

    if (!adminEmails || !waitlistEntry) {
      return NextResponse.json(
        { error: 'Admin emails and waitlist entry are required' },
        { status: 400 }
      )
    }

    // Check authentication (admin emails should require auth)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const template = createWaitlistAdminNotificationEmail({
      waitlistEntry,
    })

    // Handle multiple admin emails
    const recipients = Array.isArray(adminEmails) ? adminEmails : [adminEmails]
    const results = await Promise.all(
      recipients.map(recipient =>
        sendTrackedEmail({
          to: recipient,
          subject: template.subject,
          htmlContent: template.html,
          textContent: template.text,
          emailType: 'waitlist_admin_notification',
          recipientName: recipient.split('@')[0],
        })
      )
    )

    // Return success if at least one email was sent successfully
    const success = results.some(r => r.success)
    const firstResult = results[0]

    if (!success) {
      return NextResponse.json(
        { error: firstResult?.error || 'Failed to send waitlist admin notification emails' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: firstResult?.messageId,
      brevoEmailId: firstResult?.brevoEmailId,
    })
  } catch (error: any) {
    console.error('[api/emails/waitlist-admin-notification] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send waitlist admin notification emails' },
      { status: 500 }
    )
  }
}

