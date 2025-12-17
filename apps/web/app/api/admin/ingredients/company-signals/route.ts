import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function checkAdminAuth() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized', status: 401 }
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_pitchivo_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_pitchivo_admin) {
    return { error: 'Forbidden', status: 403 }
  }

  return { user, supabase }
}

/**
 * DELETE /api/admin/ingredients/company-signals
 * Delete all signals for a company+ingredient combination
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const { user, supabase } = authResult

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')
    const itemId = searchParams.get('itemId')

    if (!orgId || !itemId) {
      return NextResponse.json(
        { error: 'orgId and itemId are required' },
        { status: 400 }
      )
    }

    // Get all signals for this company+ingredient
    const { data: signals, error: signalsError } = await supabase
      .from('leads_signals')
      .select('id, org_id, item_id')
      .eq('org_id', orgId)
      .eq('item_id', itemId)

    if (signalsError) {
      console.error('Error fetching signals:', signalsError)
      return NextResponse.json(
        { error: 'Failed to fetch signals', details: signalsError.message },
        { status: 500 }
      )
    }

    if (!signals || signals.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'No signals found to delete'
      })
    }

    const signalIds = signals.map(s => s.id)

    // Check which signals are already excluded
    const { data: existingExclusions } = await supabase
      .from('leads_signal_exclusions')
      .select('signal_id')
      .in('signal_id', signalIds)

    const excludedSignalIds = new Set(existingExclusions?.map(e => e.signal_id) || [])
    const signalsToExclude = signals.filter(s => !excludedSignalIds.has(s.id))

    if (signalsToExclude.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'All signals already excluded'
      })
    }

    // Create exclusions for all signals
    const exclusions = signalsToExclude.map(signal => ({
      signal_id: signal.id,
      org_id: signal.org_id,
      item_id: signal.item_id,
      exclusion_reason: 'admin_deleted',
      excluded_by: user.id
    }))

    const { error: exclusionError } = await supabase
      .from('leads_signal_exclusions')
      .insert(exclusions)

    if (exclusionError) {
      console.error('Error creating exclusions:', exclusionError)
      return NextResponse.json(
        { error: 'Failed to delete signals', details: exclusionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: signalsToExclude.length
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/ingredients/company-signals:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

