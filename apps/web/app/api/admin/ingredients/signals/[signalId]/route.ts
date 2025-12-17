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
 * PUT /api/admin/ingredients/signals/[signalId]
 * Update a signal
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const authResult = await checkAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const { supabase } = authResult

    const { signalId } = await params
    const body = await request.json()
    const { interactionType, eventDate } = body

    if (!interactionType && !eventDate) {
      return NextResponse.json(
        { error: 'At least one field (interactionType or eventDate) is required' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (interactionType) updateData.interaction_type = interactionType
    if (eventDate) updateData.event_date = eventDate

    const { data: updatedSignal, error } = await supabase
      .from('leads_signals')
      .update(updateData)
      .eq('id', signalId)
      .select('id, org_id, item_id, interaction_type, event_date')
      .single()

    if (error || !updatedSignal) {
      console.error('Error updating signal:', error)
      return NextResponse.json(
        { error: 'Failed to update signal', details: error?.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      signal: updatedSignal
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/ingredients/signals/[signalId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/ingredients/signals/[signalId]
 * Delete a signal (soft delete via exclusions)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ signalId: string }> }
) {
  try {
    const authResult = await checkAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const { user, supabase } = authResult

    const { signalId } = await params

    // Get signal details first
    const { data: signal, error: signalError } = await supabase
      .from('leads_signals')
      .select('id, org_id, item_id')
      .eq('id', signalId)
      .single()

    if (signalError || !signal) {
      return NextResponse.json(
        { error: 'Signal not found' },
        { status: 404 }
      )
    }

    // Check if already excluded
    const { data: existingExclusion } = await supabase
      .from('leads_signal_exclusions')
      .select('id')
      .eq('signal_id', signalId)
      .single()

    if (existingExclusion) {
      return NextResponse.json({
        success: true,
        message: 'Signal already excluded'
      })
    }

    // Create exclusion (soft delete)
    const { error: exclusionError } = await supabase
      .from('leads_signal_exclusions')
      .insert({
        signal_id: signalId,
        org_id: signal.org_id,
        item_id: signal.item_id,
        exclusion_reason: 'admin_deleted',
        excluded_by: user.id
      })

    if (exclusionError) {
      console.error('Error creating exclusion:', exclusionError)
      return NextResponse.json(
        { error: 'Failed to delete signal', details: exclusionError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/ingredients/signals/[signalId]:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

