import { createClient } from '@supabase/supabase-js'

// Create Supabase client only on client side
function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Return a mock client for SSR
    return null as any
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabase = getSupabaseClient()

