import { withApiHandler } from '@/lib/impersonation'

/**
 * EXAMPLE: Admin-only endpoint that requires admin access
 * Even when impersonating, validates admin permissions
 * NO BOILERPLATE - wrapper handles everything!
 */
export const GET = withApiHandler(
  '/api/admin/organizations',
  'GET',
  'list_all_organizations',
  async ({ context, supabase }) => {
    // Admin can see all organizations (no org filter)
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return {
      organizations: data || [],
      meta: {
        isImpersonating: context.isImpersonating,
        adminId: context.userId,
      },
    }
  },
  { requireAdmin: true } // Automatically validates admin access
)

