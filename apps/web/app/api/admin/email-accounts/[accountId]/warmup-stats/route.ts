/**
 * Email Account Warmup Stats API
 * GET /api/admin/email-accounts/[accountId]/warmup-stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { accountId } = await params

    // Get warmup stats from Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.getWarmupStats(parseInt(accountId))

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch warmup stats')
    }

    return NextResponse.json({
      success: true,
      stats: result.data || []
    })

  } catch (error) {
    console.error('[Warmup Stats API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch warmup stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

