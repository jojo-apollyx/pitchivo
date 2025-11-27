/**
 * Supabase Auth Verification Handler
 * 
 * Handles direct Supabase verification URLs in the format:
 * https://[project].supabase.co/auth/v1/verify?token=[token]&type=[type]&redirect_to=[url]
 * 
 * This route processes the verification token and redirects to the callback page
 * with the tokens in the URL hash fragment for proper client-side handling.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const redirectTo = searchParams.get('redirect_to')
    
    console.log('[Auth Verify] START', {
      timestamp: new Date().toISOString(),
      has_token: !!token,
      token_type: type,
      redirect_to: redirectTo,
      user_agent: request.headers.get('user-agent'),
      referer: request.headers.get('referer')
    })

    // Validate required parameters
    if (!token) {
      console.error('[Auth Verify] ❌ MISSING_TOKEN')
      return NextResponse.redirect(
        new URL('/?error=missing_token&message=' + encodeURIComponent('Verification token is missing.'), request.url)
      )
    }

    // Create Supabase client to verify the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth Verify] ❌ MISSING_ENV_VARS')
      return NextResponse.redirect(
        new URL('/?error=config_error&message=' + encodeURIComponent('Server configuration error.'), request.url)
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Exchange the verification token for a session
    // For Supabase verification URLs, the token parameter contains the plain token
    // Use 'token' parameter (not 'token_hash') for tokens from verification URLs
    console.log('[Auth Verify] EXCHANGING_TOKEN', {
      token_length: token.length,
      token_type: type,
      token_preview: token.substring(0, 10) + '...',
      supabase_url: supabaseUrl ? '✓ Set' : '✗ Missing',
      supabase_key: supabaseKey ? '✓ Set' : '✗ Missing'
    })

    // The token from Supabase's /auth/v1/verify endpoint
    // For verification URLs, we use token_hash instead of token
    // and only include email if the type requires it
    const verifyStart = Date.now()
    const otpType = (type as 'email' | 'signup' | 'invite' | 'recovery' | 'magiclink') || 'email'
    
    // Build the verifyOtp params based on type
    // For 'email' type, we need email, but for verification URLs we use token_hash
    // For other types like 'magiclink', 'signup', etc., token_hash works without email
    const verifyParams: any = {
      token_hash: token,
      type: otpType
    }
    
    const { data, error } = await supabase.auth.verifyOtp(verifyParams)
    const verifyDuration = Date.now() - verifyStart

    if (error) {
      console.error('[Auth Verify] ❌ TOKEN_VERIFICATION_FAILED', {
        duration_ms: verifyDuration,
        error: {
          message: error.message,
          status: error.status,
          name: error.name
        },
        token_type: type,
        token_length: token.length
      })

      let errorMessage = 'The verification link is invalid or has expired.'
      let errorCode = 'verification_failed'

      if (error.message?.includes('expired') || error.message?.includes('invalid')) {
        errorMessage = 'This verification link has expired. Please request a new one.'
        errorCode = 'expired_token'
      } else if (error.message?.includes('already been used')) {
        errorMessage = 'This verification link has already been used. Please request a new one.'
        errorCode = 'token_used'
      }

      return NextResponse.redirect(
        new URL(`/?error=${errorCode}&message=${encodeURIComponent(errorMessage)}`, request.url)
      )
    }

    if (!data.session || !data.user) {
      console.error('[Auth Verify] ❌ NO_SESSION_OR_USER', { data })
      return NextResponse.redirect(
        new URL('/?error=no_session&message=' + encodeURIComponent('Failed to create session.'), request.url)
      )
    }

    console.log('[Auth Verify] ✅ TOKEN_VERIFIED', {
      duration_ms: verifyDuration,
      user_id: data.user.id,
      user_email: data.user.email,
      user_email_confirmed: data.user.email_confirmed_at ? 'yes' : 'no',
      user_created_at: data.user.created_at,
      session_expires_at: data.session.expires_at,
      session_expires_in: data.session.expires_at ? 
        Math.floor((data.session.expires_at * 1000 - Date.now()) / 1000) + ' seconds' : 'N/A'
    })

    // Extract tokens from session
    const access_token = data.session.access_token
    const refresh_token = data.session.refresh_token

    if (!access_token || !refresh_token) {
      console.error('[Auth Verify] ❌ MISSING_TOKENS', {
        has_access_token: !!access_token,
        has_refresh_token: !!refresh_token,
        user_id: data.user?.id
      })
      return NextResponse.redirect(
        new URL('/?error=missing_tokens&message=' + encodeURIComponent('Failed to retrieve authentication tokens.'), request.url)
      )
    }

    // Build callback URL with tokens in hash fragment
    // IMPORTANT: NextResponse.redirect() doesn't preserve hash fragments when using URL object
    // We need to construct the full URL string with hash fragment
    const baseUrl = new URL('/auth/callback', request.url)
    const callbackUrl = `${baseUrl.origin}${baseUrl.pathname}#access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}&type=${encodeURIComponent(type || 'email')}`

    const processingTime = Date.now() - startTime
    console.log('[Auth Verify] ✅ SUCCESS', {
      callback_url: callbackUrl.substring(0, 100) + '...', // Truncate for security
      processing_time_ms: processingTime,
      token_verification_ms: verifyDuration,
      token_lengths: {
        access_token: access_token.length,
        refresh_token: refresh_token.length
      },
      user_id: data.user.id,
      redirect_to: redirectTo || 'default'
    })

    // Redirect to callback page with tokens in hash fragment
    // Use the string URL to preserve hash fragment
    return NextResponse.redirect(callbackUrl)
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[Auth Verify] ❌ UNEXPECTED_ERROR', {
      processing_time_ms: processingTime,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error
    })

    return NextResponse.redirect(
      new URL('/?error=verification_failed&message=' + encodeURIComponent('An unexpected error occurred during verification.'), request.url)
    )
  }
}

