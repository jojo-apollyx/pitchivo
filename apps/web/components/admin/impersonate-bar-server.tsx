import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { ImpersonateBarClient } from './impersonate-bar-client'

export async function ImpersonateBarServer() {
  const cookieStore = await cookies()
  const impersonateUserId = cookieStore.get('impersonate_user_id')?.value
  
  if (!impersonateUserId) {
    return null
  }
  
  try {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, organizations(id, name)')
      .eq('id', impersonateUserId)
      .single()

    if (error || !data) {
      return null
    }

    const displayName = data.full_name || data.email
    const orgName = (data.organizations as any)?.name || 'Unknown Organization'

    return (
      <ImpersonateBarClient 
        userName={displayName} 
        organizationName={orgName}
      />
    )
  } catch (error) {
    console.error('Error loading user for impersonate bar:', error)
    return null
  }
}

