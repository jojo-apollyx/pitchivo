import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { embed } from 'ai'

interface Buyer {
  company: string
  companyType: string
  location: string
  website: string | null
  employeeCount: string | null
  contacts: number
  contactDetails?: Array<{
    name: string
    title: string | null
  }>
}

interface GenerateBuyersResponse {
  buyers: Buyer[]
  totalBuyers: number
  totalContacts: number
  verifiedFields: number
  countries: number
  avgContactsPerBuyer: number
}

/**
 * POST /api/campaigns/generate-buyers
 * 
 * Search for companies that purchased the product by:
 * 1. Finding market items matching product name or aliases
 * 2. Finding signals where companies purchased those items
 * 3. Returning organizations with contact counts
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { productName, productIndustry } = body

    if (!productName) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    // Step 1: Find market items using semantic/vector search (PRIMARY METHOD)
    // 
    // SEARCH STRATEGY:
    // 1. Semantic/vector search (primary): Uses embeddings to find similar items
    //    - Finds items even with different names (e.g., "Vitamin C" = "Ascorbic Acid")
    //    - More flexible and intelligent matching
    // 2. Exact name matching (fallback): Only if semantic search fails or isn't available
    //    - Match on normalized_name (exact match)
    //    - Match on aliases array (contains check)
    
    let marketItems: Array<{ id: string; name: string; aliases: string[] }> = []

    try {
      // Generate embedding for the product name using Azure OpenAI
      const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME
      const apiKey = process.env.AZURE_OPENAI_API_KEY
      // Use text-embedding-3-large (better) or text-embedding-ada-002 (fallback)
      // Available models: text-embedding-ada-002, text-embedding-3-large
      const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large'

      if (resourceName && apiKey) {
        const azure = createAzure({
          resourceName,
          apiKey
        })

        // Generate embedding using Azure OpenAI embedding model
        const { embedding: queryEmbedding } = await embed({
          model: azure.embedding(embeddingDeployment),
          value: productName
        })

        // Use vector similarity search (cosine distance)
        // Find items with similar embeddings (threshold: 0.7 similarity = 0.3 distance)
        const { data: semanticMatches, error: semanticError } = await supabase.rpc('match_market_items_semantic', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: 20
        })

        if (!semanticError && semanticMatches && semanticMatches.length > 0) {
          marketItems = semanticMatches.map((item: any) => ({
            id: item.id,
            name: item.name,
            aliases: item.aliases || []
          }))
          console.log(`[Generate Buyers] Found ${marketItems.length} items via semantic search`)
        } else if (semanticError) {
          console.warn('[Generate Buyers] Semantic search error:', semanticError.message)
          // Fall through to exact matching fallback
        }
      } else {
        console.warn('[Generate Buyers] Azure OpenAI not configured, falling back to exact matching')
      }
    } catch (semanticError) {
      console.warn('[Generate Buyers] Semantic search failed, falling back to exact matching:', semanticError)
      // Fall through to exact matching fallback
    }

    // Fallback to exact matching if semantic search didn't return results
    if (!marketItems || marketItems.length === 0) {
      console.log('[Generate Buyers] No semantic matches, trying exact name matching...')
      
      const normalizedName = productName.toLowerCase().trim()
      
      // Try exact normalized name match
      const { data: exactMatches, error: exactError } = await supabase
        .from('leads_market_items')
        .select('id, name, aliases')
        .eq('normalized_name', normalizedName)

      // Search for items where aliases contain the product name
      const { data: aliasMatches, error: aliasError } = await supabase
        .from('leads_market_items')
        .select('id, name, aliases')
        .contains('aliases', [normalizedName])

      if (exactError || aliasError) {
        console.error('[Generate Buyers] Error finding market items:', exactError || aliasError)
        return NextResponse.json(
          { error: 'Failed to search market items', details: (exactError || aliasError)?.message },
          { status: 500 }
        )
      }

      // Combine results and deduplicate by id
      const allMatches = [...(exactMatches || []), ...(aliasMatches || [])]
      marketItems = allMatches.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      )
      
      if (marketItems.length > 0) {
        console.log(`[Generate Buyers] Found ${marketItems.length} items via exact matching`)
      }
    }

    if (!marketItems || marketItems.length === 0) {
      // No matching market items found (neither exact nor semantic)
      return NextResponse.json({
        buyers: [],
        totalBuyers: 0,
        totalContacts: 0,
        verifiedFields: 0,
        countries: 0,
        avgContactsPerBuyer: 0
      })
    }

    // Get all item IDs
    const itemIds = marketItems.map(item => item.id)

    // Step 2: Find signals where companies purchased these items
    // Buying activities: 'purchased', 'requested_quote', 'viewed_item', 'added_to_cart'
    const { data: signals, error: signalsError } = await supabase
      .from('leads_signals')
      .select('org_id, item_id, interaction_type')
      .in('item_id', itemIds)
      .in('interaction_type', ['purchased', 'requested_quote', 'viewed_item', 'added_to_cart'])

    if (signalsError) {
      console.error('[Generate Buyers] Error finding signals:', signalsError)
      return NextResponse.json(
        { error: 'Failed to search signals', details: signalsError.message },
        { status: 500 }
      )
    }

    if (!signals || signals.length === 0) {
      // No purchasing signals found
      return NextResponse.json({
        buyers: [],
        totalBuyers: 0,
        totalContacts: 0,
        verifiedFields: 0,
        countries: 0,
        avgContactsPerBuyer: 0
      })
    }

    // Get unique organization IDs
    const orgIds = [...new Set(signals.map(s => s.org_id).filter(Boolean))]

    if (orgIds.length === 0) {
      return NextResponse.json({
        buyers: [],
        totalBuyers: 0,
        totalContacts: 0,
        verifiedFields: 0,
        countries: 0,
        avgContactsPerBuyer: 0
      })
    }

    // Step 3: Get organizations with their details
    const { data: organizations, error: orgsError } = await supabase
      .from('leads_organizations')
      .select('id, name, location_country, location_city, location_state, business_type, industry_categories, profile_data, domain')
      .in('id', orgIds)

    if (orgsError) {
      console.error('[Generate Buyers] Error finding organizations:', orgsError)
      return NextResponse.json(
        { error: 'Failed to search organizations', details: orgsError.message },
        { status: 500 }
      )
    }

    if (!organizations || organizations.length === 0) {
      return NextResponse.json({
        buyers: [],
        totalBuyers: 0,
        totalContacts: 0,
        verifiedFields: 0,
        countries: 0,
        avgContactsPerBuyer: 0
      })
    }

    // Step 4: Get contacts for each organization
    const { data: contacts, error: contactsError } = await supabase
      .from('leads_contacts')
      .select('org_id, first_name, last_name, full_name, title')
      .in('org_id', orgIds)
      .eq('is_current', true)

    if (contactsError) {
      console.error('[Generate Buyers] Error finding contacts:', contactsError)
      // Continue without contacts rather than failing
    }

    // Group contacts by organization
    const contactsByOrg = new Map<string, typeof contacts>()
    if (contacts) {
      for (const contact of contacts) {
        if (contact.org_id) {
          const orgId = contact.org_id
          if (!contactsByOrg.has(orgId)) {
            contactsByOrg.set(orgId, [])
          }
          contactsByOrg.get(orgId)!.push(contact)
        }
      }
    }

    // Step 5: Build buyer list with company information
    const buyers: Buyer[] = organizations.map(org => {
      const orgContacts = contactsByOrg.get(org.id) || []
      
      // Build location string
      const locationParts: string[] = []
      if (org.location_city) locationParts.push(org.location_city)
      if (org.location_state) locationParts.push(org.location_state)
      if (org.location_country) locationParts.push(org.location_country)
      const location = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown'

      // Determine company type from business_type array
      let companyType = 'Manufacturer'
      if (org.business_type && org.business_type.length > 0) {
        // Prefer more specific types
        const typeMap: Record<string, string> = {
          'contract_manufacturer': 'Contract Manufacturer',
          'copacker': 'Copacker',
          'import_distributor': 'Import Distributor',
          'distributor': 'Distributor',
          'retailer': 'Retailer',
          'wholesaler': 'Wholesaler',
          'manufacturer': 'Manufacturer'
        }
        
        for (const bt of org.business_type) {
          const normalizedBt = bt.toLowerCase().replace(/\s+/g, '_')
          if (typeMap[normalizedBt]) {
            companyType = typeMap[normalizedBt]
            break
          }
        }
        
        // Fallback to first business type if no match
        if (companyType === 'Manufacturer' && org.business_type[0]) {
          companyType = org.business_type[0]
            .split('_')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        }
      }

      // Get website from domain or profile_data
      let website: string | null = null
      if (org.domain) {
        website = org.domain.startsWith('http') ? org.domain : `https://www.${org.domain}`
      } else if (org.profile_data && typeof org.profile_data === 'object') {
        const profile = org.profile_data as any
        if (profile.website) {
          website = profile.website
        } else if (profile.domain) {
          website = profile.domain.startsWith('http') ? profile.domain : `https://www.${profile.domain}`
        }
      }

      // Get employee count from profile_data
      let employeeCount: string | null = null
      if (org.profile_data && typeof org.profile_data === 'object') {
        const profile = org.profile_data as any
        if (profile.employee_count) {
          employeeCount = String(profile.employee_count)
        } else if (profile.employees) {
          employeeCount = String(profile.employees)
        }
      }

      // Build contact details
      const contactDetails = orgContacts.slice(0, 10).map(contact => ({
        name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
        title: contact.title
      }))

      return {
        company: org.name,
        companyType,
        location,
        website,
        employeeCount,
        contacts: orgContacts.length,
        contactDetails: contactDetails.length > 0 ? contactDetails : undefined
      }
    })

    // Sort by contact count (descending) and limit to top 10 for display
    buyers.sort((a, b) => b.contacts - a.contacts)
    const topBuyers = buyers.slice(0, 10)

    // Calculate statistics
    const totalBuyers = buyers.length
    const totalContacts = buyers.reduce((sum, b) => sum + b.contacts, 0)
    const countries = new Set(buyers.map(b => {
      const parts = b.location.split(',')
      return parts[parts.length - 1]?.trim() || 'Unknown'
    })).size
    const avgContactsPerBuyer = totalBuyers > 0 ? (totalContacts / totalBuyers) : 0
    
    // Calculate verified fields (count of organizations with profile data)
    const verifiedFields = organizations.filter(org => 
      org.profile_data && 
      typeof org.profile_data === 'object' && 
      Object.keys(org.profile_data).length > 0
    ).length

    const response: GenerateBuyersResponse = {
      buyers: topBuyers,
      totalBuyers,
      totalContacts,
      verifiedFields,
      countries,
      avgContactsPerBuyer: parseFloat(avgContactsPerBuyer.toFixed(1))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Generate Buyers] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate buyers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

