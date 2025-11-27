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
 * GET - Search by product name
 * Returns products and related companies (with contacts)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ products: [], total: 0 })
    }

    const term = `%${searchTerm.toLowerCase()}%`

    // Search market items by name or aliases
    const { data: marketItems, error: itemsError } = await supabaseAdmin
      .from('leads_market_items')
      .select('id, name, category, item_type, aliases, normalized_name')
      .or(`name.ilike.${term},normalized_name.ilike.${term}`)
      .limit(limit)
      .order('name', { ascending: true })

    if (itemsError) throw itemsError

    if (!marketItems || marketItems.length === 0) {
      return NextResponse.json({ products: [], total: 0 })
    }

    const itemIds = marketItems.map(item => item.id)

    // Get signals (relationships between organizations and products)
    const { data: signals, error: signalsError } = await supabaseAdmin
      .from('leads_signals')
      .select('org_id, item_id, interaction_type')
      .in('item_id', itemIds)
      .in('interaction_type', ['purchased', 'requested_quote', 'viewed_item', 'added_to_cart', 'manufactured', 'sold', 'supplied'])

    if (signalsError) {
      console.error('Error fetching signals:', signalsError)
    }

    if (!signals || signals.length === 0) {
      // Return products without companies
      return NextResponse.json({
        success: true,
        products: marketItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          item_type: item.item_type,
          aliases: item.aliases || [],
          companies: []
        })),
        total: marketItems.length
      })
    }

    // Get unique organization IDs
    const orgIds = [...new Set(signals.map(s => s.org_id).filter(Boolean))]

    // Get organizations
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('leads_organizations')
      .select('id, name, location_country, location_city, location_state, business_type, industry_categories, domain, profile_data')
      .in('id', orgIds)
      .order('name', { ascending: true })

    if (orgError) {
      console.error('Error fetching organizations:', orgError)
    }

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

    // Group companies by product via signals
    const companiesByProduct = new Map<string, any[]>()
    if (signals && organizations) {
      signals.forEach(signal => {
        if (signal.item_id && signal.org_id) {
          const org = organizations.find(o => o.id === signal.org_id)
          if (org) {
            if (!companiesByProduct.has(signal.item_id)) {
              companiesByProduct.set(signal.item_id, [])
            }
            const productCompanies = companiesByProduct.get(signal.item_id)!
            // Avoid duplicates
            if (!productCompanies.find(c => c.id === org.id)) {
              const locationParts: string[] = []
              if (org.location_city) locationParts.push(org.location_city)
              if (org.location_state) locationParts.push(org.location_state)
              if (org.location_country) locationParts.push(org.location_country)
              const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown'

              // Get industry
              let industry = ''
              if (org.industry_categories && org.industry_categories.length > 0) {
                industry = org.industry_categories[0]
              } else if (org.profile_data && typeof org.profile_data === 'object') {
                const profile = org.profile_data as any
                if (profile.industry) {
                  industry = profile.industry
                }
              }

              productCompanies.push({
                id: org.id,
                company: org.name,
                industry: industry,
                country: org.location_country || '',
                location: location,
                domain: org.domain || null,
                business_type: org.business_type || [],
                interaction_type: signal.interaction_type,
                contacts: contactsByOrg.get(org.id) || [],
                contactCount: (contactsByOrg.get(org.id) || []).length
              })
            }
          }
        }
      })
    }

    // Build response
    const products = marketItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      item_type: item.item_type,
      aliases: item.aliases || [],
      companies: companiesByProduct.get(item.id) || []
    }))

    return NextResponse.json({
      success: true,
      products,
      total: products.length
    })
  } catch (error: any) {
    console.error('Error searching by product:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search by product' },
      { status: 500 }
    )
  }
}

