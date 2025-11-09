import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function requireAuth() {
  const supabase = await createServerClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    redirect('/')
  }
  
  return user
}

export async function getAuthUser() {
  const supabase = await createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  return user
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, organizations(*)')
    .eq('id', userId)
    .single()
  
  return profile
}

export async function requireAdmin() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  
  if (!profile?.is_pitchivo_admin) {
    redirect('/dashboard')
  }
  
  return { user, profile }
}

export async function isAdmin(userId: string) {
  const profile = await getUserProfile(userId)
  return profile?.is_pitchivo_admin ?? false
}

export async function getOrganizationById(organizationId: string) {
  const supabase = await createServerClient()
  
  const { data: organization } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single()
  
  return organization
}

export async function getEffectiveProfile(actualUserId: string, impersonateUserId?: string) {
  const supabase = await createServerClient()
  
  // Get the actual user's profile to check if they're admin
  const actualProfile = await getUserProfile(actualUserId)
  
  console.log('[getEffectiveProfile] Input:', { 
    actualUserId, 
    impersonateUserId,
    isAdmin: actualProfile?.is_pitchivo_admin,
  })
  
  // If not impersonating or not an admin, return actual profile
  if (!impersonateUserId || !actualProfile?.is_pitchivo_admin) {
    console.log('[getEffectiveProfile] Not impersonating or not admin, returning actual profile')
    return actualProfile
  }
  
  // Admin is impersonating - get the impersonated user's complete profile
  const impersonatedProfile = await getUserProfile(impersonateUserId)
  
  console.log('[getEffectiveProfile] Impersonated profile:', {
    userId: impersonatedProfile?.id,
    email: impersonatedProfile?.email,
    orgId: impersonatedProfile?.organization_id,
    orgName: impersonatedProfile?.organizations?.name
  })
  
  if (!impersonatedProfile) {
    console.log('[getEffectiveProfile] Impersonated user not found, returning actual profile')
    return actualProfile
  }
  
  // Return the impersonated user's complete profile
  return impersonatedProfile
}

export async function getEffectiveUser(actualUserId: string, impersonateUserId?: string) {
  const supabase = await createServerClient()
  
  // Get actual user's profile to check admin status
  const actualProfile = await getUserProfile(actualUserId)
  
  // If not impersonating or not admin, return actual user from auth
  if (!impersonateUserId || !actualProfile?.is_pitchivo_admin) {
    const { data: { user } } = await supabase.auth.getUser()
    return user!
  }
  
  // Admin is impersonating - get impersonated user's profile and create user-like object
  const impersonatedProfile = await getUserProfile(impersonateUserId)
  
  if (!impersonatedProfile) {
    const { data: { user } } = await supabase.auth.getUser()
    return user!
  }
  
  // Create a user object that looks like the impersonated user
  return {
    id: impersonatedProfile.id,
    email: impersonatedProfile.email || '',
    user_metadata: {
      full_name: impersonatedProfile.full_name || '',
      avatar_url: undefined,
    },
  }
}

/**
 * Consolidated helper: Get effective user and profile in one call
 * Handles all cookie reading and impersonation logic automatically
 * Use this in all dashboard pages instead of manual cookie reading
 */
export async function getEffectiveUserAndProfile() {
  const actualUser = await requireAuth()
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  
  const [effectiveProfile, effectiveUser] = await Promise.all([
    getEffectiveProfile(actualUser.id, impersonateUserId),
    getEffectiveUser(actualUser.id, impersonateUserId),
  ])
  
  return {
    user: effectiveUser,
    profile: effectiveProfile,
    organization: effectiveProfile?.organizations,
  }
}

