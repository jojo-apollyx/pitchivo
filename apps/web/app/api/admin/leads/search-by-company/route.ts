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
 * GET - Search by company name
 * Returns company details, related products, and contacts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ companies: [], total: 0 })
    }

    const term = `%${searchTerm.toLowerCase()}%`

    // Search organizations by name
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('leads_organizations')
      .select('id, name, location_country, location_city, location_state, business_type, industry_categories, domain, profile_data')
      .or(`name.ilike.${term},normalized_name.ilike.${term},domain.ilike.${term}`)
      .limit(limit)
      .order('name', { ascending: true })

    if (orgError) throw orgError

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({ companies: [], total: 0 })
    }

    const orgIds = organizations.map(org => org.id)

    // Get contacts for these organizations
    const { data: contacts, error: contactsError } = await supabaseAdmin
      .from('leads_contacts')
      .select('id, org_id, first_name, last_name, full_name, email, title, phone, linkedin_url, email_status')
      .in('org_id', orgIds)
      .eq('is_current', true)
      .not('email', 'is', null)
      .order('full_name', { ascending: true })

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
    }

    // Get products related to these organizations via signals
    const { data: signals, error: signalsError } = await supabaseAdmin
      .from('leads_signals')
      .select('org_id, item_id, interaction_type')
      .in('org_id', orgIds)
      .in('interaction_type', ['purchased', 'requested_quote', 'viewed_item', 'added_to_cart', 'manufactured', 'sold', 'supplied'])

    if (signalsError) {
      console.error('Error fetching signals:', signalsError)
    }

    // Get unique item IDs
    const itemIds = signals ? [...new Set(signals.map(s => s.item_id).filter(Boolean))] : []

    // Get market items (products)
    let products: any[] = []
    if (itemIds.length > 0) {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('leads_market_items')
        .select('id, name, category, item_type, aliases')
        .in('id', itemIds)
        .order('name', { ascending: true })

      if (!itemsError && items) {
        products = items
      }
    }

    // Group contacts by organization
    const contactsByOrg = new Map<string, any[]>()
    if (contacts) {
      contacts.forEach(contact => {
        if (contact.org_id) {
          if (!contactsByOrg.has(contact.org_id)) {
            contactsByOrg.set(contact.org_id, [])
          }
          contactsByOrg.get(contact.org_id)!.push({
            lead_id: contact.id,
            email: contact.email,
            name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
            title: contact.title || '',
            phone: contact.phone || null,
            linkedin_url: contact.linkedin_url || null,
            status: contact.email_status || 'unknown'
          })
        }
      })
    }

    // Group products by organization via signals
    const productsByOrg = new Map<string, any[]>()
    if (signals && products.length > 0) {
      signals.forEach(signal => {
        if (signal.org_id && signal.item_id) {
          const product = products.find(p => p.id === signal.item_id)
          if (product) {
            if (!productsByOrg.has(signal.org_id)) {
              productsByOrg.set(signal.org_id, [])
            }
            const orgProducts = productsByOrg.get(signal.org_id)!
            // Avoid duplicates
            if (!orgProducts.find(p => p.id === product.id)) {
              orgProducts.push({
                id: product.id,
                name: product.name,
                category: product.category,
                item_type: product.item_type,
                interaction_type: signal.interaction_type
              })
            }
          }
        }
      })
    }

    // Build response
    const companies = organizations.map(org => {
      const locationParts: string[] = []
      if (org.location_city) locationParts.push(org.location_city)
      if (org.location_state) locationParts.push(org.location_state)
      if (org.location_country) locationParts.push(org.location_country)
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown'

      // Get industry from industry_categories or profile_data
      let industry = ''
      if (org.industry_categories && org.industry_categories.length > 0) {
        industry = org.industry_categories[0]
      } else if (org.profile_data && typeof org.profile_data === 'object') {
        const profile = org.profile_data as any
        if (profile.industry) {
          industry = profile.industry
        }
      }

      return {
        id: org.id,
        company: org.name,
        industry: industry,
        country: org.location_country || '',
        location: location,
        domain: org.domain || null,
        business_type: org.business_type || [],
        contacts: contactsByOrg.get(org.id) || [],
        products: productsByOrg.get(org.id) || []
      }
    })

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length
    })
  } catch (error: any) {
    console.error('Error searching by company:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search by company' },
      { status: 500 }
    )
  }
}

