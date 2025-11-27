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
 * GET - Autocomplete suggestions for product names
 * Returns up to 10 matching product names
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

    // Search market items by name or normalized name
    const { data: marketItems, error } = await supabaseAdmin
      .from('leads_market_items')
      .select('id, name, category, item_type, aliases')
      .or(`name.ilike.${term},normalized_name.ilike.${term}`)
      .limit(limit)
      .order('name', { ascending: true })

    if (error) throw error

    const suggestions = (marketItems || []).map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      item_type: item.item_type,
      aliases: item.aliases || [],
      display: item.name + (item.category ? ` (${item.category})` : '')
    }))

    return NextResponse.json({
      success: true,
      suggestions
    })
  } catch (error: any) {
    console.error('Error autocompleting product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to autocomplete product' },
      { status: 500 }
    )
  }
}

