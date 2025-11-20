/**
 * Email Account Warmup API
 * POST /api/admin/email-accounts/[accountId]/warmup
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function POST(
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
    const body = await request.json()

    // Update warmup settings in Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.updateWarmupSettings(parseInt(accountId), {
      warmup_enabled: body.warmup_enabled,
      total_warmup_per_day: body.total_warmup_per_day,
      daily_rampup: body.daily_rampup,
      reply_rate_percentage: body.reply_rate_percentage,
      warmup_key_id: body.warmup_key_id,
    })

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update warmup settings')
    }

    return NextResponse.json({
      success: true,
      message: 'Warmup settings updated successfully'
    })

  } catch (error) {
    console.error('[Email Account Warmup API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update warmup settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

