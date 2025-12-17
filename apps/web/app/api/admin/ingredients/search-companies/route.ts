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
 * GET /api/admin/ingredients/search-companies
 * Search for existing companies by name or domain
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkAdminAuth()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    const { supabase } = authResult

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ companies: [] })
    }

    const searchTerm = `%${query.toLowerCase().trim()}%`

    // Search by name or domain
    const { data: companies, error } = await supabase
      .from('leads_organizations')
      .select('id, name, domain, location_country, location_city, location_state, profile_data')
      .or(`name.ilike.${searchTerm},domain.ilike.${searchTerm},normalized_name.ilike.${searchTerm}`)
      .limit(limit)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error searching companies:', error)
      return NextResponse.json(
        { error: 'Failed to search companies', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      companies: companies || []
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/ingredients/search-companies:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

