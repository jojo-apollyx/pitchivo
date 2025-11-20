/**
 * Email Account Settings API
 * POST /api/admin/email-accounts/[accountId]/settings
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

    // Update settings in Smartlead
    const smartlead = createSmartleadClient()
    const result = await smartlead.updateEmailAccountSettings(parseInt(accountId), {
      max_email_per_day: body.max_email_per_day,
      custom_tracking_url: body.custom_tracking_url,
      bcc: body.bcc,
      signature: body.signature,
      time_to_wait_in_mins: body.time_to_wait_in_mins,
    })

    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update settings')
    }

    return NextResponse.json({
      success: true,
      message: 'Email account settings updated successfully'
    })

  } catch (error) {
    console.error('[Email Account Settings API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update email account settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

