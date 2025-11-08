import { createClient as createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

