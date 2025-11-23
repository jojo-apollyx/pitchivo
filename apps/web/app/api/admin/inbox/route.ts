import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSmartleadClient } from '@/lib/smartlead/client'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await requireAdmin()

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const categoryId = searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined
    const campaignId = searchParams.get('campaign_id') ? parseInt(searchParams.get('campaign_id')!) : undefined
    const clientId = searchParams.get('client_id') ? parseInt(searchParams.get('client_id')!) : undefined
    const status = searchParams.get('status') as 'UNREAD' | 'READ' | 'SNOOZED' | undefined
    const search = searchParams.get('search') || undefined

    const smartlead = createSmartleadClient()

    const result = await smartlead.fetchInboxReplies({
      limit,
      offset,
      category_id: categoryId,
      campaign_id: campaignId,
      client_id: clientId,
      status,
      search
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to fetch inbox replies' },
        { status: result.error?.status_code || 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error: any) {
    console.error('[Admin Inbox API] Error:', error)
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

