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
import { AUTH_REDIRECT_URL } from '@/lib/constants/auth'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Log full request details
    const fullUrl = request.url
    const urlObj = new URL(fullUrl)
    console.log('[Auth Verify] 📥 REQUEST_RECEIVED', {
      timestamp: new Date().toISOString(),
      method: request.method,
      full_url: fullUrl,
      url_breakdown: {
        protocol: urlObj.protocol,
        host: urlObj.host,
        hostname: urlObj.hostname,
        port: urlObj.port,
        pathname: urlObj.pathname,
        search: urlObj.search,
        hash: urlObj.hash,
        origin: urlObj.origin
      },
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'referer': request.headers.get('referer'),
        'host': request.headers.get('host'),
        'x-forwarded-host': request.headers.get('x-forwarded-host'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto')
      }
    })
    
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const redirectTo = searchParams.get('redirect_to')
    
    console.log('[Auth Verify] 📋 PARAMETERS_EXTRACTED', {
      timestamp: new Date().toISOString(),
      has_token: !!token,
      token_length: token?.length || 0,
      token_type: type,
      redirect_to: redirectTo,
      all_params: Object.fromEntries(searchParams.entries()),
      param_count: Array.from(searchParams.entries()).length
    })

    // Validate required parameters
    if (!token) {
      console.error('[Auth Verify] ❌ MISSING_TOKEN', {
        url: request.url,
        search_params: Object.fromEntries(searchParams.entries()),
        user_agent: request.headers.get('user-agent')
      })
      return NextResponse.redirect(
        new URL('/?error=missing_token&message=' + encodeURIComponent('Verification token is missing.'), request.url)
      )
    }

    // Check for truncated tokens (common issue with URL length limits)
    if (token.length < 20) {
      console.error('[Auth Verify] ❌ TRUNCATED_TOKEN', {
        token_length: token.length,
        token_preview: token.substring(0, 20),
        full_url: request.url,
        url_length: request.url.length,
        user_agent: request.headers.get('user-agent')
      })
      return NextResponse.redirect(
        new URL('/?error=truncated_token&message=' + encodeURIComponent('The verification token appears to be truncated. Please try clicking the link again or request a new login link.'), request.url)
      )
    }

    // Check environment variables
    const useProdDb = process.env.USE_PROD_DB === 'true'
    const supabaseUrl = useProdDb 
      ? process.env.NEXT_PUBLIC_SUPABASE_URL_PROD 
      : process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = useProdDb
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    console.log('[Auth Verify] 🔧 ENVIRONMENT_CONFIG', {
      timestamp: new Date().toISOString(),
      use_prod_db: useProdDb,
      has_supabase_url: !!supabaseUrl,
      has_supabase_key: !!supabaseKey,
      supabase_url_preview: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      supabase_key_preview: supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING',
      supabase_key_length: supabaseKey?.length || 0,
      env_vars: {
        USE_PROD_DB: process.env.USE_PROD_DB,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_URL_PROD: process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ? 'SET' : 'MISSING',
        NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD ? 'SET' : 'MISSING',
        NEXT_PUBLIC_AUTH_REDIRECT_URL: process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL || 'NOT_SET',
        NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'NOT_SET'
      }
    })
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[Auth Verify] ❌ MISSING_ENV_VARS', {
        use_prod_db: useProdDb,
        has_supabase_url: !!supabaseUrl,
        has_supabase_key: !!supabaseKey,
        missing_vars: [
          !supabaseUrl && (useProdDb ? 'NEXT_PUBLIC_SUPABASE_URL_PROD' : 'NEXT_PUBLIC_SUPABASE_URL'),
          !supabaseKey && (useProdDb ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
        ].filter(Boolean)
      })
      return NextResponse.redirect(
        new URL('/?error=config_error&message=' + encodeURIComponent('Server configuration error.'), request.url)
      )
    }

    console.log('[Auth Verify] 🔌 CREATING_SUPABASE_CLIENT', {
      timestamp: new Date().toISOString(),
      supabase_url: supabaseUrl,
      supabase_key_length: supabaseKey.length,
      client_config: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('[Auth Verify] ✅ SUPABASE_CLIENT_CREATED', {
      timestamp: new Date().toISOString(),
      client_created: true
    })

    // Exchange the verification token for a session
    // For Supabase verification URLs, the token parameter contains the plain token
    // Use 'token' parameter (not 'token_hash') for tokens from verification URLs
    console.log('[Auth Verify] 🔐 PREPARING_TOKEN_VERIFICATION', {
      timestamp: new Date().toISOString(),
      token_length: token.length,
      token_type: type,
      token_preview: token.substring(0, 20) + '...',
      token_suffix: '...' + token.substring(token.length - 10),
      token_starts_with_pkce: token.startsWith('pkce_'),
      full_url_length: request.url.length,
      redirect_to: redirectTo,
      supabase_url: supabaseUrl,
      supabase_key_set: !!supabaseKey,
      user_agent: request.headers.get('user-agent')
    })

    // The token from Supabase's /auth/v1/verify endpoint
    // For magiclink with PKCE tokens (starting with 'pkce_'), we need to use the token directly
    // For other types, we use 'token' parameter
    // For 'email' type, we use 'token_hash' and may need email
    const verifyStart = Date.now()
    const otpType = (type as 'email' | 'signup' | 'invite' | 'recovery' | 'magiclink') || 'email'
    
    // Build the verifyOtp params based on type
    // For magiclink/signup/invite/recovery: use 'token' parameter
    // For email type: use 'token_hash' parameter
    const verifyParams: any = {
      type: otpType
    }
    
    if (otpType === 'email') {
      verifyParams.token_hash = token
      console.log('[Auth Verify] 📝 USING_TOKEN_HASH_PARAM', {
        timestamp: new Date().toISOString(),
        otp_type: otpType,
        param_used: 'token_hash',
        token_hash_length: token.length
      })
    } else {
      // For magiclink, signup, invite, recovery - use 'token' parameter
      // This works for both regular tokens and PKCE tokens (pkce_*)
      verifyParams.token = token
      console.log('[Auth Verify] 📝 USING_TOKEN_PARAM', {
        timestamp: new Date().toISOString(),
        otp_type: otpType,
        param_used: 'token',
        token_length: token.length
      })
    }
    
    console.log('[Auth Verify] 🚀 CALLING_VERIFY_OTP', {
      timestamp: new Date().toISOString(),
      verify_params: {
        type: verifyParams.type,
        has_token: !!verifyParams.token,
        has_token_hash: !!verifyParams.token_hash,
        token_length: verifyParams.token?.length || verifyParams.token_hash?.length || 0
      },
      supabase_url: supabaseUrl
    })
    
    const { data, error } = await supabase.auth.verifyOtp(verifyParams)
    const verifyDuration = Date.now() - verifyStart
    
    console.log('[Auth Verify] 📊 VERIFY_OTP_RESPONSE', {
      timestamp: new Date().toISOString(),
      duration_ms: verifyDuration,
      has_error: !!error,
      has_data: !!data,
      has_session: !!data?.session,
      has_user: !!data?.user,
      error_details: error ? {
        message: error.message,
        status: error.status,
        name: error.name
      } : null
    })

    if (error) {
      console.error('[Auth Verify] ❌ TOKEN_VERIFICATION_FAILED', {
        timestamp: new Date().toISOString(),
        duration_ms: verifyDuration,
        error: {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        },
        token_type: type,
        token_length: token.length,
        token_preview: token.substring(0, 30) + '...',
        verify_params_used: verifyParams,
        supabase_url: supabaseUrl,
        error_code: error.status,
        error_name: error.name
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
      console.error('[Auth Verify] ❌ NO_SESSION_OR_USER', {
        timestamp: new Date().toISOString(),
        has_data: !!data,
        has_session: !!data?.session,
        has_user: !!data?.user,
        session_keys: data?.session ? Object.keys(data.session) : [],
        user_keys: data?.user ? Object.keys(data.user) : [],
        full_data: JSON.stringify(data, null, 2).substring(0, 500)
      })
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
        timestamp: new Date().toISOString(),
        has_access_token: !!access_token,
        has_refresh_token: !!refresh_token,
        access_token_length: access_token?.length || 0,
        refresh_token_length: refresh_token?.length || 0,
        user_id: data.user?.id,
        session_keys: data.session ? Object.keys(data.session) : [],
        session_has_access_token: 'access_token' in (data.session || {}),
        session_has_refresh_token: 'refresh_token' in (data.session || {})
      })
      return NextResponse.redirect(
        new URL('/?error=missing_tokens&message=' + encodeURIComponent('Failed to retrieve authentication tokens.'), request.url)
      )
    }

    // Build callback URL with tokens in hash fragment
    // IMPORTANT: NextResponse.redirect() doesn't preserve hash fragments when using URL object
    // We need to construct the full URL string with hash fragment
    // Use the configured auth redirect URL (defaults to /auth/callback)
    console.log('[Auth Verify] 🔗 BUILDING_CALLBACK_URL', {
      timestamp: new Date().toISOString(),
      auth_redirect_url: AUTH_REDIRECT_URL,
      request_url: request.url,
      request_origin: new URL(request.url).origin,
      request_hostname: new URL(request.url).hostname,
      request_protocol: new URL(request.url).protocol
    })
    
    const baseUrl = new URL(AUTH_REDIRECT_URL, request.url)
    console.log('[Auth Verify] 📍 BASE_URL_CONSTRUCTED', {
      timestamp: new Date().toISOString(),
      base_url_origin: baseUrl.origin,
      base_url_hostname: baseUrl.hostname,
      base_url_pathname: baseUrl.pathname,
      base_url_protocol: baseUrl.protocol,
      base_url_port: baseUrl.port,
      full_base_url: baseUrl.toString()
    })
    
    const accessTokenEncoded = encodeURIComponent(access_token)
    const refreshTokenEncoded = encodeURIComponent(refresh_token)
    const typeEncoded = encodeURIComponent(type || 'email')
    
    const hashFragment = `#access_token=${accessTokenEncoded}&refresh_token=${refreshTokenEncoded}&type=${typeEncoded}`
    const callbackUrl = `${baseUrl.origin}${baseUrl.pathname}${hashFragment}`
    
    console.log('[Auth Verify] 🔗 CALLBACK_URL_DETAILS', {
      timestamp: new Date().toISOString(),
      callback_url_full: callbackUrl.substring(0, 200) + '...', // Truncate for security
      callback_url_breakdown: {
        origin: baseUrl.origin,
        pathname: baseUrl.pathname,
        hash_fragment_length: hashFragment.length,
        hash_fragment_preview: hashFragment.substring(0, 50) + '...',
        full_url_length: callbackUrl.length
      },
      token_details: {
        access_token_length: access_token.length,
        access_token_encoded_length: accessTokenEncoded.length,
        refresh_token_length: refresh_token.length,
        refresh_token_encoded_length: refreshTokenEncoded.length,
        type: type || 'email'
      }
    })

    const processingTime = Date.now() - startTime
    console.log('[Auth Verify] ✅ SUCCESS', {
      timestamp: new Date().toISOString(),
      callback_url_preview: callbackUrl.substring(0, 100) + '...', // Truncate for security
      callback_url_has_hash: callbackUrl.includes('#'),
      callback_url_hash_start: callbackUrl.indexOf('#'),
      processing_time_ms: processingTime,
      token_verification_ms: verifyDuration,
      token_lengths: {
        access_token: access_token.length,
        refresh_token: refresh_token.length
      },
      user_id: data.user.id,
      user_email: data.user.email,
      redirect_to: redirectTo || 'default'
    })

    // Redirect to callback page with tokens in hash fragment
    // Use the string URL to preserve hash fragment
    console.log('[Auth Verify] 🔄 PERFORMING_REDIRECT', {
      timestamp: new Date().toISOString(),
      redirect_url: callbackUrl.substring(0, 150) + '...',
      redirect_method: 'NextResponse.redirect',
      hash_present: callbackUrl.includes('#')
    })
    
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

