import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './config'

/**
 * SSR-compatible client for general use (data fetching, etc.)
 * Uses cookie-based storage for SSR compatibility
 */
export function createClient() {
  const config = getSupabaseConfig()
  return createBrowserClient(config.url, config.anonKey)
}

/**
 * Auth-specific client that properly handles PKCE flow
 * 
 * The @supabase/ssr client uses cookies for auth state (good for SSR), but this
 * doesn't work for PKCE because the code_verifier must be stored client-side.
 * 
 * This client uses localStorage which properly stores the code_verifier when
 * signInWithOtp() is called and retrieves it when exchangeCodeForSession() is called.
 * 
 * Best Practice Reference:
 * - https://supabase.com/docs/guides/auth/sessions/pkce-flow
 * - PKCE code_verifier must persist in browser storage across the auth redirect
 * 
 * Use this client for:
 * - signInWithOtp() - stores code_verifier in localStorage
 * - exchangeCodeForSession() - retrieves code_verifier from localStorage
 */
export function createAuthClient() {
  const config = getSupabaseConfig()
  
  if (typeof window === 'undefined') {
    // Server-side: return a basic client (won't be used for PKCE anyway)
    return createSupabaseClient(config.url, config.anonKey)
  }

  return createSupabaseClient(
    config.url,
    config.anonKey,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        // Explicitly use localStorage for PKCE code_verifier storage
        storage: window.localStorage,
      },
    }
  )
}

