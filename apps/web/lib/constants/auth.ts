/**
 * Authentication Constants
 * 
 * IMPORTANT: These URLs must match your Supabase project configuration:
 * 1. Go to Supabase Dashboard > Authentication > URL Configuration
 * 2. Set "Site URL" to: https://pitchivo.com/auth/callback
 * 3. Add to "Redirect URLs": https://pitchivo.com/auth/callback
 * 
 * The redirect URL is used for magic link authentication.
 */

export const AUTH_REDIRECT_URL = '/auth/callback'

/**
 * Get the full redirect URL for authentication
 * This should be used when calling signInWithOtp or other auth methods
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${AUTH_REDIRECT_URL}`
  }
  
  // Fallback for server-side (should use environment variable)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  return `${siteUrl}${AUTH_REDIRECT_URL}`
}

