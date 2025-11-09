import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/auth'

export interface ImpersonationContext {
  isImpersonating: boolean
  actualUserId: string
  effectiveUserId: string
  effectiveOrgId: string | null
  isAdmin: boolean
}

/**
 * Get impersonation context from cookie with full validation and logging
 * Use this in ALL API routes and server actions
 */
export async function getImpersonationContext(): Promise<ImpersonationContext | null> {
  try {
    const supabase = await createServerClient()
    
    // Get actual authenticated user
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      console.error('[Impersonation] No authenticated user')
      return null
    }
    
    // Get actual user's profile
    const actualProfile = await getUserProfile(user.id)
    const isAdmin = actualProfile?.is_pitchivo_admin ?? false
    
    // Check for impersonation cookie
    const cookieStore = await cookies()
    const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
    
    // If no impersonation or not admin, return actual context
    if (!impersonateUserId || !isAdmin) {
      const context: ImpersonationContext = {
        isImpersonating: false,
        actualUserId: user.id,
        effectiveUserId: user.id,
        effectiveOrgId: actualProfile?.organization_id || null,
        isAdmin,
      }
      
      console.log('[Impersonation] Normal context:', {
        userId: context.effectiveUserId,
        orgId: context.effectiveOrgId,
      })
      
      return context
    }
    
    // Validate impersonated user exists
    const impersonatedProfile = await getUserProfile(impersonateUserId)
    if (!impersonatedProfile) {
      console.error('[Impersonation] Invalid impersonated user:', impersonateUserId)
      // Fall back to actual user
      return {
        isImpersonating: false,
        actualUserId: user.id,
        effectiveUserId: user.id,
        effectiveOrgId: actualProfile?.organization_id || null,
        isAdmin,
      }
    }
    
    const context: ImpersonationContext = {
      isImpersonating: true,
      actualUserId: user.id,
      effectiveUserId: impersonatedProfile.id,
      effectiveOrgId: impersonatedProfile.organization_id || null,
      isAdmin,
    }
    
    // LOG ALL IMPERSONATION ACTIONS
    console.log('[Impersonation] ACTIVE:', {
      admin: {
        id: user.id,
        email: user.email,
      },
      impersonating: {
        id: impersonatedProfile.id,
        email: impersonatedProfile.email,
        org: impersonatedProfile.organizations?.name,
      },
      timestamp: new Date().toISOString(),
    })
    
    return context
  } catch (error) {
    console.error('[Impersonation] Error getting context:', error)
    return null
  }
}

/**
 * Helper to check if current request has valid impersonation
 * Returns effective user/org IDs with access control
 */
export async function getEffectiveContext() {
  const context = await getImpersonationContext()
  
  if (!context) {
    throw new Error('Unauthorized: No valid session')
  }
  
  return {
    userId: context.effectiveUserId,
    organizationId: context.effectiveOrgId,
    isImpersonating: context.isImpersonating,
    isAdmin: context.isAdmin,
  }
}

/**
 * Log API access with impersonation context
 * Use this at the start of every API route
 */
export async function logApiAccess(
  endpoint: string,
  method: string,
  action: string,
  metadata?: Record<string, any>
) {
  const context = await getImpersonationContext()
  
  if (!context) {
    console.warn('[API Access] No context available for logging')
    return
  }
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    endpoint,
    method,
    action,
    user: {
      actual: context.actualUserId,
      effective: context.effectiveUserId,
      isImpersonating: context.isImpersonating,
    },
    organization: context.effectiveOrgId,
    metadata,
  }
  
  if (context.isImpersonating) {
    console.log('🔐 [API ACCESS - IMPERSONATING]', JSON.stringify(logEntry, null, 2))
  } else {
    console.log('📝 [API ACCESS]', JSON.stringify(logEntry, null, 2))
  }
  
  // TODO: Store in audit log table
  // await supabase.from('audit_logs').insert(logEntry)
}

/**
 * Validate admin-only action with impersonation support
 */
export async function requireAdminOrImpersonating() {
  const context = await getImpersonationContext()
  
  if (!context) {
    throw new Error('Unauthorized: No valid session')
  }
  
  if (!context.isAdmin) {
    throw new Error('Forbidden: Admin access required')
  }
  
  return context
}

/**
 * Get organization-scoped data with automatic impersonation support
 * Use this helper in your queries to automatically filter by effective org
 */
export async function getOrgScopedQuery() {
  const context = await getEffectiveContext()
  
  if (!context.organizationId) {
    throw new Error('No organization context available')
  }
  
  return {
    organizationId: context.organizationId,
    userId: context.userId,
    isImpersonating: context.isImpersonating,
  }
}

/**
 * Wrapper for API routes that automatically handles:
 * - Context retrieval
 * - Logging
 * - Organization validation
 * - Error handling
 * 
 * Usage:
 * export const GET = withApiHandler('/api/products', 'GET', 'list_products', async ({ context, supabase }) => {
 *   const { data } = await supabase.from('products').select('*').eq('organization_id', context.organizationId)
 *   return { products: data }
 * })
 */
export function withApiHandler<T = any>(
  endpoint: string,
  method: string,
  action: string,
  handler: (params: {
    context: { userId: string; organizationId: string; isImpersonating: boolean; isAdmin: boolean }
    supabase: Awaited<ReturnType<typeof createServerClient>>
    request: Request
    requireOrg?: () => void
  }) => Promise<T>,
  options?: {
    requireOrg?: boolean
    requireAdmin?: boolean
  }
) {
  return async (request: Request) => {
    try {
      // Get context (with admin check if needed)
      const rawContext = options?.requireAdmin
        ? await requireAdminOrImpersonating()
        : await getEffectiveContext()
      
      // Log access
      await logApiAccess(endpoint, method, action)
      
      // Normalize context (handle both getEffectiveContext and requireAdminOrImpersonating return types)
      const normalizedContext = 'effectiveUserId' in rawContext
        ? {
            userId: rawContext.effectiveUserId,
            organizationId: rawContext.effectiveOrgId || '',
            isImpersonating: rawContext.isImpersonating,
            isAdmin: rawContext.isAdmin,
          }
        : {
            userId: rawContext.userId,
            organizationId: rawContext.organizationId || '',
            isImpersonating: rawContext.isImpersonating,
            isAdmin: rawContext.isAdmin,
          }
      
      // Validate organization if required
      if (options?.requireOrg && !normalizedContext.organizationId) {
        return Response.json(
          { error: 'No organization context' },
          { status: 400 }
        )
      }
      
      // Create supabase client
      const supabase = await createServerClient()
      
      // Helper to require org (can be called inside handler if needed)
      const requireOrg = () => {
        if (!normalizedContext.organizationId) {
          throw new Error('Organization context required')
        }
      }
      
      // Call handler with context, supabase, and request
      const result = await handler({
        context: normalizedContext,
        supabase,
        request,
        requireOrg,
      })
      
      return Response.json(result)
    } catch (error: any) {
      console.error(`[${endpoint}] Error:`, error)
      const status = error.message?.includes('Forbidden') ? 403
        : error.message?.includes('Unauthorized') ? 401
        : 500
      return Response.json(
        { error: error.message || 'Internal server error' },
        { status }
      )
    }
  }
}


