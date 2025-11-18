import { withApiHandler } from '@/lib/impersonation'
import { z } from 'zod'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Create admin Supabase client for public organization queries
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Schema for organization update
const updateOrganizationSchema = z.object({
  industry: z.string().nullable().optional(),
  company_size: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

/**
 * Get organization by ID (public endpoint for SEO)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const orgId = searchParams.get('id')

  if (!orgId) {
    return Response.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    )
  }

  try {
    // Use admin client because this is a public SEO endpoint (anonymous access)
    const { data: organization, error } = await supabaseAdmin
      .from('organizations')
      .select('id, name, domain')
      .eq('id', orgId)
      .single()

    if (error || !organization) {
      return Response.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return Response.json(organization)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update current user's organization
 * Uses the database RPC function update_user_organization internally
 */
export const PUT = withApiHandler(
  '/api/organizations',
  'PUT',
  'update_organization',
  async ({ context, supabase, request }) => {
    const rawBody = await request.json()
    const validatedInput = updateOrganizationSchema.parse(rawBody)
    
    // Call the RPC function to update organization
    const { data: success, error } = await supabase.rpc('update_user_organization', {
      p_org_id: context.organizationId,
      p_industry: validatedInput.industry ?? null,
      p_company_size: validatedInput.company_size ?? null,
      p_description: validatedInput.description ?? null,
    })

    if (error) {
      console.error('[Update Organization] RPC error:', error)
      throw error
    }

    if (!success) {
      throw new Error('Failed to update organization')
    }

    // Fetch updated organization to return
    const { data: organization, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, industry, company_size, description, domain, pitchivo_domain')
      .eq('id', context.organizationId)
      .single()

    if (fetchError) {
      console.error('[Update Organization] Fetch error:', fetchError)
      throw fetchError
    }

    if (!organization) {
      throw new Error('Organization not found after update')
    }

    return {
      organization,
      success: true,
    }
  },
  { requireOrg: true }
)

