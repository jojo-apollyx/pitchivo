/**
 * Authentication Constants
 * 
 * IMPORTANT: These URLs must match your Supabase project configuration:
 * 1. Go to Supabase Dashboard > Authentication > URL Configuration
 * 2. Set "Site URL" to: https://pitchivo.com (or your production domain)
 * 3. Add to "Redirect URLs": 
 *    - https://pitchivo.com/auth/callback
 *    - https://pitchivo.com/api/auth/verify (if using custom verify endpoint)
 * 
 * NOTE: If you see "access_denied" errors during login, it means the redirect URL
 * is not in Supabase's allowed list. Make sure to add the exact redirect URL
 * (including protocol and domain) to the "Redirect URLs" list in Supabase.
 * 
 * The redirect URL is used for magic link authentication.
 */

export const AUTH_REDIRECT_URL = '/auth/callback'

/**
 * Get the full redirect URL for authentication
 * This should be used when calling signInWithOtp or other auth methods
 * 
 * IMPORTANT: This URL must EXACTLY match what's configured in Supabase Dashboard
 * - No trailing slashes
 * - Exact protocol (https)
 * - Exact domain
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== 'undefined') {
    // Use window.location.origin to get the exact origin (protocol + domain)
    // Then append the path without any trailing slashes
    const origin = window.location.origin
    const path = AUTH_REDIRECT_URL.startsWith('/') ? AUTH_REDIRECT_URL : `/${AUTH_REDIRECT_URL}`
    return `${origin}${path}`
  }
  
  // Fallback for server-side (should use environment variable)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pitchivo.com'
  // Ensure no trailing slash on siteUrl and proper path format
  const cleanSiteUrl = siteUrl.replace(/\/$/, '')
  const path = AUTH_REDIRECT_URL.startsWith('/') ? AUTH_REDIRECT_URL : `/${AUTH_REDIRECT_URL}`
  return `${cleanSiteUrl}${path}`
}

