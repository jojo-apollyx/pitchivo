import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * GET - Autocomplete suggestions for company names
 * Returns up to 10 matching company names
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!searchTerm || searchTerm.trim().length < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    const term = `%${searchTerm.toLowerCase()}%`

    // Search organizations by name, normalized name, or domain
    const { data: organizations, error } = await supabaseAdmin
      .from('leads_organizations')
      .select('id, name, domain, location_country')
      .or(`name.ilike.${term},normalized_name.ilike.${term},domain.ilike.${term}`)
      .limit(limit)
      .order('name', { ascending: true })

    if (error) throw error

    const suggestions = (organizations || []).map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      country: org.location_country,
      display: org.name + (org.domain ? ` (${org.domain})` : '') + (org.location_country ? ` - ${org.location_country}` : '')
    }))

    return NextResponse.json({
      success: true,
      suggestions
    })
  } catch (error: any) {
    console.error('Error autocompleting company:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to autocomplete company' },
      { status: 500 }
    )
  }
}

