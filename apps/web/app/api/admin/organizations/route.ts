import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { requireAdminOrImpersonating, logApiAccess } from '@/lib/impersonation'

/**
 * EXAMPLE: Admin-only endpoint that requires admin access
 * Even when impersonating, validates admin permissions
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Require admin access (validates actual user is admin)
    const context = await requireAdminOrImpersonating()
    
    // 2. Log admin access
    await logApiAccess('/api/admin/organizations', 'GET', 'list_all_organizations', {
      adminUserId: context.actualUserId,
      isImpersonating: context.isImpersonating,
    })
    
    // 3. Fetch all organizations (admin can see all)
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    console.log('[Admin Organizations API] Admin accessed all orgs:', data?.length)
    
    return NextResponse.json({
      organizations: data || [],
      meta: {
        isImpersonating: context.isImpersonating,
        adminId: context.actualUserId,
      },
    })
  } catch (error: any) {
    console.error('[Admin Organizations API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Forbidden' },
      { status: error.message.includes('Forbidden') ? 403 : 500 }
    )
  }
}

