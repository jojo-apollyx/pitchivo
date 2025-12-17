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
 * GET /api/admin/ingredients/manage
 * Get all companies, contacts, and signals for a specific ingredient
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
    const ingredientName = searchParams.get('ingredient')
    const ingredientId = searchParams.get('ingredientId')

    if (!ingredientName && !ingredientId) {
      return NextResponse.json(
        { error: 'ingredient or ingredientId is required' },
        { status: 400 }
      )
    }

    // Find the ingredient (market item)
    let itemId: string | null = null
    let item: any = null

    if (ingredientId) {
      const { data: foundItem, error: itemError } = await supabase
        .from('leads_market_items')
        .select('id, name, category, aliases')
        .eq('id', ingredientId)
        .single()

      if (itemError || !foundItem) {
        return NextResponse.json(
          { error: 'Ingredient not found' },
          { status: 404 }
        )
      }
      itemId = foundItem.id
      item = foundItem
    } else {
      // Search by name (normalized)
      const normalizedName = ingredientName!.toLowerCase().trim()
      const { data: foundItems, error: itemError } = await supabase
        .from('leads_market_items')
        .select('id, name, category, aliases')
        .eq('normalized_name', normalizedName)
        .limit(1)

      if (itemError || !foundItems || foundItems.length === 0) {
        return NextResponse.json(
          { error: 'Ingredient not found' },
          { status: 404 }
        )
      }
      itemId = foundItems[0].id
      item = foundItems[0]
    }

    // Get all signals for this ingredient
    const { data: allSignals, error: allSignalsError } = await supabase
      .from('leads_signals')
      .select('id, org_id, item_id, contact_id, interaction_type, event_date, created_at, is_verified')
      .eq('item_id', itemId)

    if (allSignalsError) {
      console.error('Error fetching signals:', allSignalsError)
      return NextResponse.json(
        { error: 'Failed to fetch signals', details: allSignalsError.message },
        { status: 500 }
      )
    }

    // Get excluded signal IDs and filter them out
    const signalIds = allSignals?.map(s => s.id) || []
    let signals = allSignals || []
    
    if (signalIds.length > 0) {
      const { data: exclusions } = await supabase
        .from('leads_signal_exclusions')
        .select('signal_id')
        .in('signal_id', signalIds)

      const excludedSignalIds = new Set(exclusions?.map(e => e.signal_id) || [])
      signals = signals.filter(s => !excludedSignalIds.has(s.id))
    }

    // Get unique organization IDs
    const orgIds = [...new Set(signals.map(s => s.org_id).filter(Boolean))]

    if (orgIds.length === 0) {
      return NextResponse.json({
        ingredient: item,
        companies: [],
        totalCompanies: 0,
        totalSignals: 0,
        totalContacts: 0
      })
    }

    // Get organizations
    const { data: organizations, error: orgsError } = await supabase
      .from('leads_organizations')
      .select('id, name, domain, location_country, location_city, location_state, profile_data')
      .in('id', orgIds)

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return NextResponse.json(
        { error: 'Failed to fetch organizations', details: orgsError.message },
        { status: 500 }
      )
    }

    // Get all contacts for these organizations
    const { data: contacts, error: contactsError } = await supabase
      .from('leads_contacts')
      .select('id, org_id, first_name, last_name, full_name, email, title, linkedin_url, email_status')
      .in('org_id', orgIds)

    if (contactsError) {
      console.error('Error fetching contacts:', contactsError)
    }

    // Group signals by organization
    const signalsByOrg = new Map<string, typeof signals>()
    signals.forEach(signal => {
      if (!signal.org_id) return
      if (!signalsByOrg.has(signal.org_id)) {
        signalsByOrg.set(signal.org_id, [])
      }
      signalsByOrg.get(signal.org_id)!.push(signal)
    })

    // Group contacts by organization
    const contactsByOrg = new Map<string, typeof contacts>()
    contacts?.forEach(contact => {
      if (!contact.org_id) return
      if (!contactsByOrg.has(contact.org_id)) {
        contactsByOrg.set(contact.org_id, [])
      }
      contactsByOrg.get(contact.org_id)!.push(contact)
    })

    // Build response with companies, their signals, and contacts
    const companies = (organizations || []).map(org => ({
      id: org.id,
      name: org.name,
      domain: org.domain,
      location: [org.location_city, org.location_state, org.location_country]
        .filter(Boolean)
        .join(', ') || null,
      country: org.location_country,
      profileData: org.profile_data || {},
      signals: signalsByOrg.get(org.id) || [],
      contacts: contactsByOrg.get(org.id) || []
    }))

    return NextResponse.json({
      ingredient: item,
      companies: companies.sort((a, b) => a.name.localeCompare(b.name)),
      totalCompanies: companies.length,
      totalSignals: signals.length,
      totalContacts: contacts?.length || 0
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/ingredients/manage:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

