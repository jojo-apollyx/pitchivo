import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSmartleadClient } from '@/lib/smartlead/client'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
    const { 
      campaign_id,
      email_stats_id, 
      email_body,
      reply_message_id,
      reply_email_time,
      reply_email_body,
      cc, 
      bcc, 
      add_signature,
      attachments
    } = body

    if (!campaign_id || !email_stats_id || !email_body || !reply_message_id || !reply_email_time || !reply_email_body) {
      return NextResponse.json(
        { error: 'Missing required fields: campaign_id, email_stats_id, email_body, reply_message_id, reply_email_time, reply_email_body' },
        { status: 400 }
      )
    }

    const smartlead = createSmartleadClient()

    const result = await smartlead.replyToLeadFromMasterInbox({
      campaign_id,
      email_stats_id,
      email_body,
      reply_message_id,
      reply_email_time,
      reply_email_body,
      cc,
      bcc,
      add_signature,
      attachments
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to reply to lead' },
        { status: result.error?.status_code || 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Admin Inbox Reply API] Error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

