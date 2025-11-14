import { withApiHandler } from '@/lib/impersonation'
import { z } from 'zod'

// Schema for organization update
const updateOrganizationSchema = z.object({
  industry: z.string().nullable().optional(),
  company_size: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

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

