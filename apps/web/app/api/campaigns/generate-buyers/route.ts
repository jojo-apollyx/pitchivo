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
    email: string | null
    title: string | null
  }>
  interactionTypes?: string[] // Most recent 3 distinct interaction types
  categoryFit?: 'High' | 'Medium' | 'Low' | 'Assessment Pending'
  cooperationPotential?: 'Strong' | 'Neutral' | 'Weak' | 'Assessment Pending'
  matchScore?: 'A' | 'B' | 'C' | 'D' | 'Assessment Pending'
}

interface MatchedItem {
  id: string
  name: string
  aliases: string[]
  similarity: number
}

interface GenerateBuyersResponse {
  buyers: Buyer[]
  totalBuyers: number
  totalContacts: number
  verifiedFields: number
  countries: number
  avgContactsPerBuyer: number
  matchedItems: MatchedItem[] // Items matched via semantic search
  searchQuery: string // The query used for semantic search
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

    // Step 1: Find market items using semantic/vector search (ONLY METHOD - no fallback)
    // 
    // SEARCH STRATEGY:
    // Uses embeddings to find semantically similar items
    // - Finds items even with different names (e.g., "Vitamin C" = "Ascorbic Acid")
    // - Handles product variations like "Beta-Carotene Powder 1% CWS-K" matching "Beta Carotene"
    // - More flexible and intelligent matching
    // - Threshold: 0.65 for good recall while maintaining precision
    
    let marketItems: Array<{ id: string; name: string; aliases: string[]; category?: string; similarity?: number }> = []
    let maxSimilarity = 0 // Track max similarity for match score calculation

    // Generate embedding for the product name using Azure OpenAI
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    // Use embedding model from env or fallback to text-embedding-ada-002
    // Available models: text-embedding-ada-002, text-embedding-3-large, etc.
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002'

    if (!resourceName || !apiKey) {
      console.error('[Generate Buyers] Azure OpenAI not configured - semantic search required')
      return NextResponse.json(
        { error: 'Semantic search is not configured. Please contact support.' },
        { status: 503 }
      )
    }

    const azure = createAzure({
      resourceName,
      apiKey
    })

    try {
      // Generate embedding using Azure OpenAI embedding model
      const { embedding: queryEmbedding } = await embed({
        model: azure.embedding(embeddingDeployment),
        value: productName
      })

      // Use vector similarity search (cosine distance)
      // Find items with similar embeddings (threshold: 0.65 for good recall)
      const { data: semanticMatches, error: semanticError } = await supabase.rpc('match_market_items_semantic', {
        query_embedding: queryEmbedding,
        match_threshold: 0.65,
        match_count: 30
      })

      if (semanticError) {
        console.error('[Generate Buyers] Semantic search error:', semanticError.message)
        
        // Check if it's a timeout error
        const isTimeout = semanticError.message?.toLowerCase().includes('timeout') || 
                         semanticError.message?.toLowerCase().includes('statement timeout') ||
                         semanticError.message?.toLowerCase().includes('canceling statement')
        
        if (isTimeout) {
          return NextResponse.json(
            { 
              error: 'Semantic search timed out. The database query took too long. This may happen if the vector index needs optimization or there are too many records.',
              details: semanticError.message,
              suggestion: 'Please try again with a more specific product name, or contact support if the issue persists.'
            },
            { status: 504 } // Gateway Timeout
          )
        }
        
        return NextResponse.json(
          { error: 'Failed to perform semantic search', details: semanticError.message },
          { status: 500 }
        )
      }

      if (semanticMatches && semanticMatches.length > 0) {
        marketItems = semanticMatches.map((item: any) => {
          const similarity = item.similarity || 0
          if (similarity > maxSimilarity) maxSimilarity = similarity
          return {
            id: item.id,
            name: item.name,
            aliases: item.aliases || [],
            category: item.category || null,
            similarity: similarity
          }
        })
        console.log(`[Generate Buyers] Found ${marketItems.length} items via semantic search for "${productName}"`)
      }
    } catch (embeddingError: any) {
      console.error('[Generate Buyers] Embedding generation failed:', embeddingError?.message || embeddingError)
      return NextResponse.json(
        { error: 'Failed to generate embedding for search', details: embeddingError?.message || 'Unknown error' },
        { status: 500 }
      )
    }

    if (!marketItems || marketItems.length === 0) {
      // No matching market items found via semantic search
      console.log(`[Generate Buyers] No semantic matches found for "${productName}"`)
      return NextResponse.json({
        buyers: [],
        totalBuyers: 0,
        totalContacts: 0,
        verifiedFields: 0,
        countries: 0,
        avgContactsPerBuyer: 0,
        matchedItems: [],
        searchQuery: productName
      })
    }

    // Get all item IDs
    const itemIds = marketItems.map(item => item.id)

    // Step 2: Find signals where companies purchased/imported/used/distributed/mentioned these items
    // Buying activities: 'purchased', 'requested_quote', 'viewed_item', 'added_to_cart', 'imported', 'used_in_production', 'distributed', 'mentioned_in_article', 'partnership_announced'
    const { data: signals, error: signalsError } = await supabase
      .from('leads_signals')
      .select('org_id, item_id, interaction_type, event_date, created_at, source_id, is_verified')
      .in('item_id', itemIds)
      .in('interaction_type', [
        'purchased', 
        'requested_quote', 
        'viewed_item', 
        'added_to_cart', 
        'imported', 
        'used_in_production',
        'distributed',
        'mentioned_in_article',
        'partnership_announced'
      ])
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

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

    // Get source trust scores for match score calculation (batch query for performance)
    const sourceIds = [...new Set(signals.map(s => s.source_id).filter(Boolean))]
    const sourceTrustScores = new Map<string, number>()
    if (sourceIds.length > 0) {
      const { data: sources } = await supabase
        .from('leads_sources')
        .select('id, trust_score')
        .in('id', sourceIds)
      
      if (sources) {
        sources.forEach(source => {
          if (source.id) {
            sourceTrustScores.set(source.id, source.trust_score || 0.5)
          }
        })
      }
    }

    // Create maps for fast lookups
    const itemCategoryMap = new Map<string, string>()
    const itemSimilarityMap = new Map<string, number>()
    marketItems.forEach(item => {
      itemCategoryMap.set(item.id, item.category || '')
      itemSimilarityMap.set(item.id, item.similarity || 0)
    })

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

    // Step 4: Get contacts for each organization (limit to 3 per org for campaign leads)
    // But we still need total count, so we'll get all and limit later
    const { data: contacts, error: contactsError } = await supabase
      .from('leads_contacts')
      .select('org_id, first_name, last_name, full_name, title, email')
      .in('org_id', orgIds)
      .eq('is_current', true)
      .not('email', 'is', null) // Only include contacts with email addresses
      .order('created_at', { ascending: false }) // Order by most recent first

    if (contactsError) {
      console.error('[Generate Buyers] Error finding contacts:', contactsError)
      // Continue without contacts rather than failing
    }

    // Group contacts by organization and limit to 3 per org for contactDetails
    const contactsByOrg = new Map<string, typeof contacts>()
    const allContactsByOrg = new Map<string, typeof contacts>() // For total count
    if (contacts) {
      for (const contact of contacts) {
        if (contact.org_id) {
          const orgId = contact.org_id
          
          // Track all contacts for total count
          if (!allContactsByOrg.has(orgId)) {
            allContactsByOrg.set(orgId, [])
          }
          allContactsByOrg.get(orgId)!.push(contact)
          
          // Limit to 3 per org for contactDetails (campaign leads)
          if (!contactsByOrg.has(orgId)) {
            contactsByOrg.set(orgId, [])
          }
          if (contactsByOrg.get(orgId)!.length < 3) {
            contactsByOrg.get(orgId)!.push(contact)
          }
        }
      }
    }
    
    // Group signals by organization to get most recent 3 distinct interaction types
    const signalsByOrg = new Map<string, Array<{ interaction_type: string; event_date: string | null; created_at: string }>>()
    if (signals) {
      for (const signal of signals) {
        if (signal.org_id) {
          const orgId = signal.org_id
          if (!signalsByOrg.has(orgId)) {
            signalsByOrg.set(orgId, [])
          }
          signalsByOrg.get(orgId)!.push({
            interaction_type: signal.interaction_type,
            event_date: signal.event_date,
            created_at: signal.created_at
          })
        }
      }
    }
    
    // Get most recent 3 distinct interaction types per organization
    const interactionTypesByOrg = new Map<string, string[]>()
    // Enhanced signal aggregation for metrics calculation
    const signalStatsByOrg = new Map<string, {
      totalSignals: number
      verifiedSignals: number
      distinctItems: number
      mostRecentDate: Date | null
      interactionTypes: string[]
      sourceIds: string[]
      itemIds: string[]
    }>()

    signalsByOrg.forEach((orgSignals, orgId) => {
      // Sort by event_date (most recent first), then by created_at
      const sorted = orgSignals.sort((a, b) => {
        if (a.event_date && b.event_date) {
          return new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        }
        if (a.event_date) return -1
        if (b.event_date) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
      
      // Get distinct interaction types, keeping order (most recent first)
      const distinctTypes: string[] = []
      const seen = new Set<string>()
      for (const signal of sorted) {
        if (!seen.has(signal.interaction_type)) {
          distinctTypes.push(signal.interaction_type)
          seen.add(signal.interaction_type)
          if (distinctTypes.length >= 3) break
        }
      }
      interactionTypesByOrg.set(orgId, distinctTypes)

      // Calculate signal statistics for metrics
      const orgSignalsFull = signals.filter(s => s.org_id === orgId)
      const verifiedCount = orgSignalsFull.filter(s => s.is_verified).length
      const distinctItemIds = new Set(orgSignalsFull.map(s => s.item_id).filter(Boolean))
      const mostRecent = orgSignalsFull
        .map(s => s.event_date ? new Date(s.event_date) : null)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0] || null
      
      signalStatsByOrg.set(orgId, {
        totalSignals: orgSignalsFull.length,
        verifiedSignals: verifiedCount,
        distinctItems: distinctItemIds.size,
        mostRecentDate: mostRecent,
        interactionTypes: orgSignalsFull.map(s => s.interaction_type),
        sourceIds: orgSignalsFull.map(s => s.source_id).filter(Boolean) as string[],
        itemIds: Array.from(distinctItemIds) as string[]
      })
    })

    // Helper functions for metric calculations
    const calculateCategoryFit = (
      org: typeof organizations[0],
      orgItemIds: string[]
    ): 'High' | 'Medium' | 'Low' | 'Assessment Pending' => {
      if (orgItemIds.length === 0) return 'Assessment Pending'
      
      const productCategory = productIndustry?.toLowerCase() || ''
      const orgIndustries = (org.industry_categories || []).map((c: string) => c.toLowerCase())
      const orgBusinessTypes = (org.business_type || []).map((b: string) => b.toLowerCase())
      
      // Get categories from matched items
      const itemCategories = orgItemIds
        .map(id => itemCategoryMap.get(id))
        .filter((c): c is string => Boolean(c))
        .map(c => c.toLowerCase())
      
      // High: Direct industry/category match (more lenient - partial matches count)
      if (productCategory && orgIndustries.some((ind: string) => 
        ind.includes(productCategory) || productCategory.includes(ind) ||
        ind.split(' ').some((word: string) => productCategory.includes(word)) ||
        productCategory.split(' ').some((word: string) => ind.includes(word))
      )) {
        return 'High'
      }
      
      // High: Business type indicates relevant activity (more lenient)
      if (productCategory && orgBusinessTypes.some((bt: string) => 
        (bt.includes('food') && (productCategory.includes('food') || productCategory.includes('supplement'))) ||
        (bt.includes('beverage') && productCategory.includes('beverage')) ||
        (bt.includes('ingredient') || bt.includes('supplement') || bt.includes('nutrition'))
      )) {
        return 'High'
      }
      
      // High: Has item categories (if items have categories, likely a fit)
      if (itemCategories.length > 0) {
        return 'High'
      }
      
      // Medium: Category match from items (more lenient)
      if (itemCategories.length > 0 && productCategory && 
          itemCategories.some((cat: string) => 
            cat.includes(productCategory) || productCategory.includes(cat) ||
            cat.split(' ').some((word: string) => productCategory.includes(word))
          )) {
        return 'Medium'
      }
      
      // Medium: Any industry match (more lenient)
      if (orgIndustries.length > 0) {
        return 'Medium'
      }
      
      // Medium: Has business type (indicates some activity)
      if (orgBusinessTypes.length > 0) {
        return 'Medium'
      }
      
      // Low: No matches but has signals
      if (orgItemIds.length > 0) {
        return 'Low'
      }
      
      return 'Assessment Pending'
    }

    const calculateCooperationPotential = (
      stats: NonNullable<ReturnType<typeof signalStatsByOrg.get>>
    ): 'Strong' | 'Neutral' | 'Weak' | 'Assessment Pending' => {
      if (!stats || stats.totalSignals === 0) return 'Assessment Pending'
      
      const now = new Date()
      const monthsSinceRecent = stats.mostRecentDate 
        ? Math.floor((now.getTime() - stats.mostRecentDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
        : 999
      
      // High-value interaction weights
      const highValueTypes = ['purchased', 'partnership_announced', 'used_in_production']
      const mediumValueTypes = ['requested_quote', 'imported', 'distributed']
      const highValueCount = stats.interactionTypes.filter(t => highValueTypes.includes(t)).length
      const mediumValueCount = stats.interactionTypes.filter(t => mediumValueTypes.includes(t)).length
      
      // Strong: Multiple verified signals, recent, high-value interactions (more lenient)
      if (stats.verifiedSignals >= 2 && 
          monthsSinceRecent <= 18 && 
          (highValueCount >= 1 || stats.distinctItems >= 2)) {
        return 'Strong'
      }
      
      // Strong: Recent high-value activity (more lenient)
      if (monthsSinceRecent <= 12 && (highValueCount >= 1 || mediumValueCount >= 2)) {
        return 'Strong'
      }
      
      // Strong: Multiple items purchased (indicates active buyer)
      if (stats.distinctItems >= 2 && monthsSinceRecent <= 24) {
        return 'Strong'
      }
      
      // Neutral: Some signals, moderate recency (more lenient)
      if (stats.totalSignals >= 2 && monthsSinceRecent <= 36) {
        return 'Neutral'
      }
      
      // Neutral: Recent activity (more lenient)
      if (monthsSinceRecent <= 18 && stats.totalSignals >= 1) {
        return 'Neutral'
      }
      
      // Neutral: Has medium-value interactions
      if (mediumValueCount >= 1) {
        return 'Neutral'
      }
      
      // Weak: Old or low-value only
      if (stats.totalSignals >= 1) {
        return 'Weak'
      }
      
      return 'Assessment Pending'
    }

    const calculateMatchScore = (
      org: typeof organizations[0],
      stats: NonNullable<ReturnType<typeof signalStatsByOrg.get>> | undefined,
      orgItemIds: string[]
    ): 'A' | 'B' | 'C' | 'D' | 'Assessment Pending' => {
      if (!stats || stats.totalSignals === 0 || orgItemIds.length === 0) {
        return 'Assessment Pending'
      }
      
      // Get average similarity for this org's items
      const similarities = orgItemIds
        .map(id => itemSimilarityMap.get(id) || 0)
        .filter(s => s > 0)
      const avgSimilarity = similarities.length > 0
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length
        : 0
      
      // Calculate average trust score
      const trustScores = stats.sourceIds
        .map(id => sourceTrustScores.get(id) || 0.5)
      const avgTrustScore = trustScores.length > 0
        ? trustScores.reduce((a, b) => a + b, 0) / trustScores.length
        : 0.5
      
      // Calculate data completeness (0-1)
      const hasProfile = org.profile_data && typeof org.profile_data === 'object' && Object.keys(org.profile_data).length > 0
      const hasDomain = !!org.domain
      const hasContacts = (allContactsByOrg.get(org.id) || []).length > 0
      const hasIndustry = (org.industry_categories || []).length > 0
      const completeness = [hasProfile, hasDomain, hasContacts, hasIndustry].filter(Boolean).length / 4
      
      // Score calculation
      let score = 0
      
      // Similarity (40% weight) - Lowered thresholds for more lenient scoring
      if (avgSimilarity >= 0.80) score += 40
      else if (avgSimilarity >= 0.70) score += 30
      else if (avgSimilarity >= 0.60) score += 20
      else if (avgSimilarity >= 0.50) score += 15
      else score += 10
      
      // Verified signals (30% weight) - More lenient thresholds
      if (stats.verifiedSignals >= 2) score += 30
      else if (stats.verifiedSignals >= 1) score += 25
      else if (stats.totalSignals >= 3) score += 20
      else if (stats.totalSignals >= 2) score += 15
      else if (stats.totalSignals >= 1) score += 10
      else score += 5
      
      // Data completeness (20% weight)
      score += completeness * 20
      
      // Trust score (10% weight)
      score += avgTrustScore * 10
      
      // Determine grade - Lowered thresholds for better distribution
      if (score >= 70) return 'A'
      if (score >= 50) return 'B'
      if (score >= 35) return 'C'
      return 'D'
    }

    // Step 5: Build buyer list with company information
    const buyers: Buyer[] = organizations.map(org => {
      const orgContacts = contactsByOrg.get(org.id) || [] // Limited to 3 for campaign leads
      const allOrgContacts = allContactsByOrg.get(org.id) || [] // All contacts for total count
      const interactionTypes = interactionTypesByOrg.get(org.id) || []
      const signalStats = signalStatsByOrg.get(org.id)
      const orgItemIds = signalStats?.itemIds || []
      
      // Calculate metrics
      const categoryFit = calculateCategoryFit(org, orgItemIds)
      const cooperationPotential = signalStats ? calculateCooperationPotential(signalStats) : 'Assessment Pending'
      const matchScore = calculateMatchScore(org, signalStats, orgItemIds)
      
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

      // Build contact details (limited to 3 per org for campaign leads)
      const contactDetails = orgContacts.map(contact => ({
        name: contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown',
        email: contact.email || null,
        title: contact.title
      })).filter(contact => contact.email) // Only include contacts with email

      return {
        company: org.name,
        companyType,
        location,
        website,
        employeeCount,
        contacts: allOrgContacts.length, // Total count of all contacts
        contactDetails: contactDetails.length > 0 ? contactDetails : undefined,
        interactionTypes: interactionTypes.length > 0 ? interactionTypes : undefined,
        categoryFit,
        cooperationPotential,
        matchScore
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

    // Build matched items response with similarity scores
    const matchedItemsResponse: MatchedItem[] = marketItems.map(item => ({
      id: item.id,
      name: item.name,
      aliases: item.aliases,
      similarity: item.similarity || 0
    })).sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending

    const response: GenerateBuyersResponse = {
      buyers: topBuyers,
      totalBuyers,
      totalContacts,
      verifiedFields,
      countries,
      avgContactsPerBuyer: parseFloat(avgContactsPerBuyer.toFixed(1)),
      matchedItems: matchedItemsResponse,
      searchQuery: productName
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

