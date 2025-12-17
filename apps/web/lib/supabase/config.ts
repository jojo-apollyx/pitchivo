/**
 * Supabase configuration utility
 * 
 * Allows switching between local and production Supabase instances
 * via environment variables.
 * 
 * Usage:
 * - Set USE_PROD_DB=true in .env.local to use production database
 * - Set USE_PROD_DB=false or leave unset to use local database
 * 
 * When using production:
 * - NEXT_PUBLIC_SUPABASE_URL_PROD: Production Supabase URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD: Production Supabase anon key
 * 
 * When using local:
 * - NEXT_PUBLIC_SUPABASE_URL: Local Supabase URL (default: http://127.0.0.1:54321)
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Local Supabase anon key
 */

export function getSupabaseConfig() {
  // NOTE: USE_PROD_DB is not a NEXT_PUBLIC_ variable, so it's only available server-side
  // On client-side, we need to check NEXT_PUBLIC_USE_PROD_DB instead
  // For server-side, USE_PROD_DB works fine
  const useProdDb = typeof window === 'undefined' 
    ? process.env.USE_PROD_DB === 'true'
    : process.env.NEXT_PUBLIC_USE_PROD_DB === 'true'

  if (useProdDb) {
    const prodUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_PROD
    const prodKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD

    if (!prodUrl || !prodKey) {
      throw new Error(
        'USE_PROD_DB/NEXT_PUBLIC_USE_PROD_DB is set to true but NEXT_PUBLIC_SUPABASE_URL_PROD or NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD is missing. ' +
        'Please set these environment variables in .env.local'
      )
    }

    return {
      url: prodUrl,
      anonKey: prodKey,
      isProduction: true,
    }
  }

  // Default to local
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
  const localKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!localKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
      'Please set this environment variable in .env.local'
    )
  }

  return {
    url: localUrl,
    anonKey: localKey,
    isProduction: false,
  }
}

