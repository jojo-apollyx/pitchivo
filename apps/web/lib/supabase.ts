import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './supabase/config'

// Create Supabase client only on client side
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Return a mock client for SSR
    return null as any
  }
  
  const config = getSupabaseConfig()
  return createClient(config.url, config.anonKey)
}

export const supabase = getSupabaseClient()

