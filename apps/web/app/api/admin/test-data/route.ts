import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Test Data Management API
 * Allows admins to preview and delete test data with cascade
 */

// GET - Preview test data that would be deleted
export async function GET() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pitchivo admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Call the preview function
    const { data: previewData, error } = await supabase.rpc('preview_test_data_cleanup')

    if (error) {
      console.error('❌ Error previewing test data:', error)
      return NextResponse.json(
        { error: 'Failed to preview test data', details: error.message },
        { status: 500 }
      )
    }

    // Transform the data for better readability
    const summary = previewData.reduce(
      (acc: any, row: any) => {
        acc.tables[row.table_name] = {
          count: Number(row.record_count),
          ids: row.record_ids || [],
        }
        acc.totalRecords += Number(row.record_count)
        return acc
      },
      { tables: {}, totalRecords: 0 }
    )

    return NextResponse.json({
      success: true,
      preview: summary,
      message: `Found ${summary.totalRecords} test records across ${Object.keys(summary.tables).length} tables`,
    })
  } catch (error) {
    console.error('❌ Error in test data preview:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete all test data with cascade
export async function DELETE() {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pitchivo admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    console.log('🗑️ Starting test data deletion...')

    // Call the delete function
    const { data: deleteResults, error } = await supabase.rpc('delete_test_data')

    if (error) {
      console.error('❌ Error deleting test data:', error)
      return NextResponse.json(
        { error: 'Failed to delete test data', details: error.message },
        { status: 500 }
      )
    }

    // Transform the results for better readability
    const summary = deleteResults.reduce(
      (acc: any, row: any) => {
        acc.tables[row.table_name] = Number(row.deleted_count)
        acc.totalDeleted += Number(row.deleted_count)
        return acc
      },
      { tables: {}, totalDeleted: 0 }
    )

    console.log('✅ Test data deletion completed:', summary)

    return NextResponse.json({
      success: true,
      deleted: summary,
      message: `Successfully deleted ${summary.totalDeleted} test records from ${Object.keys(summary.tables).length} tables`,
    })
  } catch (error) {
    console.error('❌ Error in test data deletion:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST - Mark specific records as test data
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is Pitchivo admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { table, id, isTest } = body

    if (!table || !id || typeof isTest !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body. Required: table, id, isTest' },
        { status: 400 }
      )
    }

    // Validate table name to prevent SQL injection
    const allowedTables = ['organizations', 'products', 'campaigns', 'product_rfqs']
    if (!allowedTables.includes(table)) {
      return NextResponse.json(
        { error: `Invalid table. Must be one of: ${allowedTables.join(', ')}` },
        { status: 400 }
      )
    }

    // Map table name to ID column
    const idColumns: Record<string, string> = {
      organizations: 'id',
      products: 'product_id',
      campaigns: 'campaign_id',
      product_rfqs: 'rfq_id',
    }

    const idColumn = idColumns[table]

    // Update the is_test flag
    const { error: updateError } = await supabase
      .from(table)
      .update({ is_test: isTest })
      .eq(idColumn, id)

    if (updateError) {
      console.error(`❌ Error updating ${table}:`, updateError)
      return NextResponse.json(
        { error: `Failed to update ${table}`, details: updateError.message },
        { status: 500 }
      )
    }

    console.log(`✅ Updated ${table} ${id} is_test to ${isTest}`)

    return NextResponse.json({
      success: true,
      message: `Successfully marked ${table} record as ${isTest ? 'test' : 'production'} data`,
    })
  } catch (error) {
    console.error('❌ Error marking test data:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

