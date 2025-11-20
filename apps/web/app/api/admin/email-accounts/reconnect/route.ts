/**
 * Reconnect Failed Email Accounts API
 * POST /api/admin/email-accounts/reconnect
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function POST(request: NextRequest) {
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

    // Call Smartlead API to reconnect failed accounts
    // Note: This is rate limited to 3 times per 24 hours by Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.bulkReconnectFailedAccounts()

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to reconnect accounts')
    }

    return NextResponse.json({
      success: true,
      message: 'Reconnection initiated. This may take a few minutes.'
    })

  } catch (error) {
    console.error('[Reconnect Accounts API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to reconnect email accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

