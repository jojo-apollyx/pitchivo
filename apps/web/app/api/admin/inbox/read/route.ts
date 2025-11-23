import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSmartleadClient } from '@/lib/smartlead/client'

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const body = await request.json()
    const { lead_id, email_stats_id, is_read } = body

    if (!lead_id || !email_stats_id || is_read === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const smartlead = createSmartleadClient()

    const result = await smartlead.updateReadStatus({
      lead_id,
      email_stats_id,
      is_read
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update read status' },
        { status: result.error?.status_code || 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Admin Inbox Read API] Error:', error)
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

