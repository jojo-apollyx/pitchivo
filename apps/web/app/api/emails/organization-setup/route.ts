/**
 * API Route for Sending Organization Setup Emails
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTrackedEmail } from '@/lib/emails/tracking'
import { createOrganizationSetupEmail } from '@/lib/emails/templates/client/organization-setup'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, userName, companyName } = body

    if (!to || !userName || !companyName) {
      return NextResponse.json(
        { error: 'Recipient email, user name, and company name are required' },
        { status: 400 }
      )
    }

    // Check authentication
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const template = createOrganizationSetupEmail({
      userName,
      companyName,
    })

    const result = await sendTrackedEmail({
      to,
      subject: template.subject,
      htmlContent: template.html,
      textContent: template.text,
      emailType: 'organization_setup',
      recipientName: userName,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send organization setup email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      brevoEmailId: result.brevoEmailId,
    })
  } catch (error: any) {
    console.error('[api/emails/organization-setup] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send organization setup email' },
      { status: 500 }
    )
  }
}

