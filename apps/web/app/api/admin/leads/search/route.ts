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

// GET - Search leads across all campaigns in database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '100')

    if (!searchTerm || searchTerm.trim().length < 2) {
      return NextResponse.json({ leads: [], companies: [] })
    }

    const term = `%${searchTerm.toLowerCase()}%`

    // Search leads with company grouping
    const { data: leads, error } = await supabaseAdmin
      .from('campaign_leads')
      .select('*')
      .or(`email.ilike.${term},name.ilike.${term},company.ilike.${term},title.ilike.${term},industry.ilike.${term},country.ilike.${term}`)
      .limit(limit)
      .order('company', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    // Group leads by company
    const companiesMap = new Map<string, any>()

    leads?.forEach((lead: any) => {
      const companyKey = lead.company.toLowerCase()
      
      if (!companiesMap.has(companyKey)) {
        companiesMap.set(companyKey, {
          company: lead.company,
          industry: lead.industry || '',
          country: lead.country || '',
          contacts: []
        })
      }

      companiesMap.get(companyKey)!.contacts.push({
        lead_id: lead.lead_id,
        email: lead.email,
        name: lead.name,
        title: lead.title || '',
        phone: lead.phone || '',
        linkedin_url: lead.linkedin_url || '',
        status: lead.status
      })
    })

    // Convert map to array
    const companies = Array.from(companiesMap.values())

    return NextResponse.json({
      success: true,
      companies,
      total: companies.length
    })
  } catch (error: any) {
    console.error('Error searching leads:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search leads' },
      { status: 500 }
    )
  }
}

