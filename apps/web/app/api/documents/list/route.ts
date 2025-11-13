import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * List all documents for the current user's organization
 * GET /api/documents/list
 * GET /api/documents/list?fileIds=id1,id2,id3 (fetch specific documents by IDs)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ 
        error: 'Failed to fetch user data',
        details: userError.message 
      }, { status: 500 })
    }

    if (!userData?.organization_id) {
      return NextResponse.json({ 
        error: 'User organization not found. Please complete organization setup first.',
        details: 'The user account does not have an organization_id assigned. Please set up your organization before accessing documents.'
      }, { status: 400 })
    }

    // Check if specific file IDs are requested
    const fileIdsParam = request.nextUrl.searchParams.get('fileIds')
    let query = supabase
      .from('document_extractions')
      .select('*')
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null)

    if (fileIdsParam) {
      // Parse comma-separated file IDs
      const fileIds = fileIdsParam.split(',').map(id => id.trim()).filter(Boolean)
      if (fileIds.length > 0) {
        query = query.in('id', fileIds)
      }
    }

    // Get documents
    const { data: documents, error: fetchError } = await query
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({
      documents: documents || []
    })

  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

