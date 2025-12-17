import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/admin/ingredients/companies/[companyId]
 * 
 * Delete a company and all associated data:
 * - All signals for this company
 * - All contacts for this company
 * - The company itself
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { companyId } = await params

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('leads_organizations')
      .select('id, name')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    // Delete all signals for this company
    const { error: signalsError } = await supabase
      .from('leads_signals')
      .delete()
      .eq('org_id', companyId)

    if (signalsError) {
      console.error('Error deleting signals:', signalsError)
      return NextResponse.json(
        { error: 'Failed to delete company signals', details: signalsError.message },
        { status: 500 }
      )
    }

    // Delete all contacts for this company
    const { error: contactsError } = await supabase
      .from('leads_contacts')
      .delete()
      .eq('org_id', companyId)

    if (contactsError) {
      console.error('Error deleting contacts:', contactsError)
      return NextResponse.json(
        { error: 'Failed to delete company contacts', details: contactsError.message },
        { status: 500 }
      )
    }

    // Delete the company itself
    const { error: deleteError } = await supabase
      .from('leads_organizations')
      .delete()
      .eq('id', companyId)

    if (deleteError) {
      console.error('Error deleting company:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete company', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Company "${company.name}" and all associated data deleted successfully`
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/ingredients/companies/[companyId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

