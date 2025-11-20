/**
 * Email Accounts API
 * GET /api/admin/email-accounts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createSmartleadClient } from '@/lib/smartlead'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get email accounts from Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.getAllEmailAccounts()

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to fetch email accounts')
    }

    return NextResponse.json({
      success: true,
      accounts: result.data || []
    })

  } catch (error) {
    console.error('[Email Accounts API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch email accounts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

