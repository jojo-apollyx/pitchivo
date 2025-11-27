'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Comprehensive logging helper for auth callback
 */
function logAuthStep(step: string, data?: any, error?: any) {
  const timestamp = new Date().toISOString()
  const logData = {
    timestamp,
    step,
    ...(data && { data }),
    ...(error && { error: error instanceof Error ? { message: error.message, stack: error.stack } : error })
  }
  
  if (error) {
    console.error(`[Auth Callback] [${timestamp}] ❌ ${step}`, logData)
  } else {
    console.log(`[Auth Callback] [${timestamp}] ✅ ${step}`, logData)
  }
}

/**
 * Detect if user is on a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Detect browser compatibility issues
 */
function getBrowserCompatibility(): {
  isCompatible: boolean
  browser: string
  issues: string[]
} {
  if (typeof window === 'undefined') {
    return { isCompatible: true, browser: 'unknown', issues: [] }
  }

  const ua = navigator.userAgent
  let browser = 'unknown'
  const issues: string[] = []

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browser = 'Chrome'
  } else if (ua.includes('Firefox')) {
    browser = 'Firefox'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browser = 'Safari'
  } else if (ua.includes('Edg')) {
    browser = 'Edge'
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browser = 'Opera'
  } else {
    browser = 'Unknown'
    issues.push('Unsupported browser detected')
  }

  // Check for known issues
  // Some browsers have issues with hash fragments in redirects
  if (ua.includes('Safari') && !ua.includes('Chrome') && isMobileDevice()) {
    issues.push('Safari on mobile may have issues with authentication links')
  }

  // Check if cookies/localStorage are available
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    issues.push('Local storage is not available - authentication may fail')
  }

  return {
    isCompatible: issues.length === 0,
    browser,
    issues
  }
}

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [browserWarning, setBrowserWarning] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check browser compatibility on mount
    const compatibility = getBrowserCompatibility()
    const mobile = isMobileDevice()
    setIsMobile(mobile)

    if (!compatibility.isCompatible && compatibility.issues.length > 0) {
      setBrowserWarning(compatibility.issues.join('. ') + '. Please try a different browser.')
      logAuthStep('BROWSER_COMPATIBILITY_WARNING', {
        browser: compatibility.browser,
        issues: compatibility.issues,
        isMobile: mobile
      })
    }

    const handleAuthCallback = async () => {
      const startTime = Date.now()
      const compatibility = getBrowserCompatibility()
      
      logAuthStep('START', {
        url: window.location.href,
        hash: window.location.hash ? 'present' : 'missing',
        search: window.location.search ? 'present' : 'missing',
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'none',
        browser: compatibility.browser,
        isMobile: mobile,
        compatibilityIssues: compatibility.issues
      })

      try {
        const supabase = createClient()
        
        // Step 1: Check for verification tokens FIRST (before error handling)
        // This intercepts Supabase verify URLs before they can be rejected
        const verificationToken = searchParams.get('token')
        const verificationType = searchParams.get('type')
        
        if (verificationToken) {
          logAuthStep('VERIFICATION_TOKEN_DETECTED_IN_CALLBACK', {
            has_token: !!verificationToken,
            token_type: verificationType,
            redirect_to: searchParams.get('redirect_to')
          })
          
          // Redirect to our verification API endpoint which will handle the token exchange
          const verifyUrl = new URL('/api/auth/verify', window.location.origin)
          verifyUrl.searchParams.set('token', verificationToken)
          if (verificationType) verifyUrl.searchParams.set('type', verificationType)
          if (searchParams.get('redirect_to')) {
            verifyUrl.searchParams.set('redirect_to', searchParams.get('redirect_to')!)
          }
          
          logAuthStep('REDIRECTING_TO_VERIFY', { verify_url: verifyUrl.toString() })
          window.location.href = verifyUrl.toString()
          return
        }
        
        // Step 2: Check for error parameters in URL (from Supabase or our system)
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        const errorCode = searchParams.get('error_code')
        
        if (errorParam) {
          logAuthStep('ERROR_PARAM_DETECTED', {
            error: errorParam,
            error_description: errorDescription,
            error_code: errorCode
          })
          
          let userFriendlyMessage = 'The login link is invalid or has expired.'
          
          if (errorParam === 'access_denied') {
            // This error typically means the redirect URL is not configured in Supabase
            // or the token verification failed at Supabase's level
            userFriendlyMessage = 'Access denied. The login link may be invalid or the redirect URL is not properly configured. Please try requesting a new login link.'
          } else if (errorParam === 'expired_token') {
            userFriendlyMessage = 'This login link has expired. Please request a new one.'
          } else if (errorDescription) {
            userFriendlyMessage = errorDescription
          }
          
          setErrorMessage(userFriendlyMessage)
          logAuthStep('REDIRECT_TO_ERROR', { error: errorParam, message: userFriendlyMessage })
          
          // Wait a moment to show error, then redirect
          setTimeout(() => {
            router.push(`/?error=${errorParam}&message=${encodeURIComponent(userFriendlyMessage)}`)
          }, 2000)
          return
        }

        // Step 3: Check for PKCE code exchange (code parameter)
        const queryParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const code = queryParams.get('code')
        
        // Step 3a: Handle PKCE code exchange
        if (code) {
          logAuthStep('PKCE_CODE_DETECTED', {
            has_code: !!code,
            code_length: code.length,
            code_preview: code.substring(0, 20) + '...'
          })
          
          // Exchange the code for a session
          // Note: exchangeCodeForSession automatically retrieves code_verifier from localStorage
          // For magic links, Supabase handles PKCE server-side, so this should work
          const exchangeStart = Date.now()
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          const exchangeDuration = Date.now() - exchangeStart
          
          if (exchangeError) {
            logAuthStep('PKCE_CODE_EXCHANGE_FAILED', {
              duration_ms: exchangeDuration,
              error: {
                message: exchangeError.message,
                status: exchangeError.status,
                name: exchangeError.name
              },
              // Check if code_verifier might be missing
              possible_cause: exchangeError.message?.includes('code_verifier') || exchangeError.message?.includes('verifier') 
                ? 'code_verifier_missing' 
                : 'unknown'
            }, exchangeError)
            
            let errorMessage = 'Failed to exchange authorization code. Please try requesting a new login link.'
            
            // Provide more specific error message if code_verifier is the issue
            if (exchangeError.message?.includes('code_verifier') || exchangeError.message?.includes('verifier')) {
              errorMessage = 'Authorization code verification failed. This may happen if you opened the link in a different browser. Please request a new login link.'
            } else if (exchangeError.message?.includes('expired') || exchangeError.message?.includes('invalid')) {
              errorMessage = 'The authorization code has expired or is invalid. Please request a new login link.'
            }
            
            setErrorMessage(errorMessage)
            setTimeout(() => {
              router.push('/?error=code_exchange_failed&message=' + encodeURIComponent(errorMessage))
            }, 2000)
            return
          }
          
          if (!exchangeData.session || !exchangeData.user) {
            logAuthStep('PKCE_NO_SESSION_AFTER_EXCHANGE', { data: exchangeData })
            setErrorMessage('Failed to create session. Please try again.')
            setTimeout(() => {
              router.push('/?error=no_session&message=' + encodeURIComponent('Failed to create session.'))
            }, 2000)
            return
          }
          
          logAuthStep('PKCE_CODE_EXCHANGED', {
            duration_ms: exchangeDuration,
            user_id: exchangeData.user.id,
            user_email: exchangeData.user.email,
            session_expires_at: exchangeData.session.expires_at
          })
          
          // Continue with session setup (skip to Step 6)
          // The session is already set by exchangeCodeForSession, so we can proceed to user/profile checks
        } else {
          // Step 3b: Parse tokens from both hash fragment and query parameters
          // Supabase can send tokens in either location depending on configuration
          
          // Try hash fragment first (most common)
          let access_token = hashParams.get('access_token')
          let refresh_token = hashParams.get('refresh_token')
          let type = hashParams.get('type')
          
          // Fallback to query parameters if hash is empty
          if (!access_token && !refresh_token) {
            logAuthStep('NO_HASH_TOKENS', { trying_query_params: true })
            access_token = queryParams.get('access_token')
            refresh_token = queryParams.get('refresh_token')
            type = queryParams.get('type')
          }
          
          logAuthStep('TOKEN_EXTRACTION', {
            has_access_token: !!access_token,
            has_refresh_token: !!refresh_token,
            token_type: type,
            token_source: access_token ? (hashParams.has('access_token') ? 'hash' : 'query') : 'none',
            hash_length: window.location.hash.length,
            query_length: window.location.search.length
          })

          // Step 4: Handle missing tokens
          if (!access_token || !refresh_token) {
            logAuthStep('MISSING_TOKENS', {
              has_access_token: !!access_token,
              has_refresh_token: !!refresh_token,
              full_url: window.location.href,
              isMobile: mobile
            })
            
            let errorMsg = 'The login link is missing required information. Please request a new login link.'
            
            // Provide mobile-specific guidance
            if (mobile) {
              errorMsg += ' If you\'re on a mobile device, try copying the link and opening it in a different browser, or request a new login link.'
            }
            
            setErrorMessage(errorMsg)
            
            setTimeout(() => {
              router.push('/?error=missing_tokens&message=' + encodeURIComponent('Login link is invalid. Please request a new one.'))
            }, 3000)
            return
          }

          // Step 5: Set session with tokens
          logAuthStep('SETTING_SESSION', {
            access_token_length: access_token.length,
            refresh_token_length: refresh_token.length,
            access_token_preview: access_token.substring(0, 20) + '...',
            refresh_token_preview: refresh_token.substring(0, 20) + '...'
          })
          
          const sessionStart = Date.now()
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          const sessionDuration = Date.now() - sessionStart

          if (sessionError) {
            logAuthStep('SESSION_ERROR', {
              duration_ms: sessionDuration,
              error_message: sessionError.message,
              error_status: sessionError.status,
              error_name: sessionError.name
            }, sessionError)
            
            let userFriendlyMessage = 'Failed to authenticate. The link may have expired.'
            
            // Handle specific Supabase errors
            if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
              userFriendlyMessage = 'This login link has expired or is invalid. Please request a new one.'
            } else if (sessionError.message?.includes('token')) {
              userFriendlyMessage = 'The authentication token is invalid. Please request a new login link.'
            }
            
            setErrorMessage(userFriendlyMessage)
            
            setTimeout(() => {
              router.push(`/?error=session_failed&message=${encodeURIComponent(userFriendlyMessage)}`)
            }, 2000)
            return
          }

          logAuthStep('SESSION_SET', {
            duration_ms: sessionDuration,
            session_user_id: sessionData?.user?.id,
            session_user_email: sessionData?.user?.email,
            session_expires_at: sessionData?.session?.expires_at,
            session_expires_in: sessionData?.session?.expires_at ? 
              Math.floor((sessionData.session.expires_at * 1000 - Date.now()) / 1000) + ' seconds' : 'N/A'
          })
        }

        // Step 6: Get user after setting session
        logAuthStep('FETCHING_USER')
        const userStart = Date.now()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        const userDuration = Date.now() - userStart
        
        logAuthStep('USER_FETCH_RESULT', {
          duration_ms: userDuration,
          user_id: user?.id,
          user_email: user?.email,
          user_email_confirmed: user?.email_confirmed_at ? 'yes' : 'no',
          user_created_at: user?.created_at,
          error: userError ? { 
            message: userError.message, 
            status: userError.status,
            name: userError.name
          } : null
        })
        
        if (userError || !user) {
          logAuthStep('USER_NOT_FOUND', null, userError)
          setErrorMessage('Unable to retrieve user information. Please try logging in again.')
          
          setTimeout(() => {
            router.push('/?error=user_not_found&message=' + encodeURIComponent('User not found. Please try again.'))
          }, 2000)
          return
        }

        // Step 7: Check if user has completed organization setup
        logAuthStep('FETCHING_USER_PROFILE', { user_id: user.id })
        const profileStart = Date.now()
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, domain, organization_id, metadata, org_role, created_at, updated_at')
          .eq('id', user.id)
          .single()
        const profileDuration = Date.now() - profileStart

        logAuthStep('PROFILE_FETCH_RESULT', { 
          duration_ms: profileDuration,
          profile_id: profile?.id,
          domain: profile?.domain,
          organization_id: profile?.organization_id,
          org_role: profile?.org_role,
          profile_created_at: profile?.created_at,
          profile_updated_at: profile?.updated_at,
          error: profileError ? { 
            message: profileError.message, 
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint
          } : null
        })

        if (profileError || !profile) {
          logAuthStep('PROFILE_ERROR', null, profileError)
          setErrorMessage('User profile not found. Please contact support.')
          
          setTimeout(() => {
            router.push('/?error=profile_not_found&message=' + encodeURIComponent('Profile not found. Please contact support.'))
          }, 2000)
          return
        }

        // Step 8: Check organization onboarding status
        logAuthStep('CHECKING_ORGANIZATION', { 
          domain: profile.domain,
          user_organization_id: profile.organization_id
        })
        const orgStart = Date.now()
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, domain, onboarding_completed_at, created_at')
          .eq('domain', profile.domain)
          .not('onboarding_completed_at', 'is', null)
          .limit(1)
        const orgDuration = Date.now() - orgStart
        
        const organization = organizations?.[0]
        const hasOrgOnboardingCompleted = !!organization?.onboarding_completed_at

        logAuthStep('ORGANIZATION_CHECK_RESULT', {
          duration_ms: orgDuration,
          domain: profile.domain,
          organization_id: organization?.id,
          organization_name: organization?.name,
          onboarding_completed_at: organization?.onboarding_completed_at,
          organization_created_at: organization?.created_at,
          hasOrgOnboardingCompleted,
          organizations_found: organizations?.length || 0,
          error: orgError ? { 
            message: orgError.message, 
            code: orgError.code,
            details: orgError.details,
            hint: orgError.hint
          } : null
        })

        // Step 9: Check user profile completion
        const hasUserCompletedProfile = !!profile.org_role

        logAuthStep('PROFILE_COMPLETION_CHECK', {
          hasOrgOnboardingCompleted,
          hasUserCompletedProfile,
          org_role: profile.org_role
        })

        // Step 10: Route based on completion status
        const processingTime = Date.now() - startTime
        logAuthStep('ROUTING_DECISION', {
          hasOrgOnboardingCompleted,
          hasUserCompletedProfile,
          processing_time_ms: processingTime
        })

        if (!hasOrgOnboardingCompleted) {
          logAuthStep('REDIRECT_TO_SETUP', { reason: 'organization_onboarding_not_complete' })
          router.push('/setup/organization')
          return
        }

        if (hasOrgOnboardingCompleted && !hasUserCompletedProfile) {
          logAuthStep('REDIRECT_TO_SETUP', { reason: 'user_profile_not_complete' })
          router.push('/setup/organization')
          return
        }

        // Step 11: Success - redirect to dashboard
        logAuthStep('SUCCESS', {
          user_id: user.id,
          organization_id: organization?.id,
          total_processing_time_ms: processingTime
        })
        router.push('/dashboard')
      } catch (error) {
        const processingTime = Date.now() - startTime
        logAuthStep('UNEXPECTED_ERROR', {
          processing_time_ms: processingTime,
          error_type: error instanceof Error ? error.constructor.name : typeof error
        }, error)
        
        setErrorMessage('An unexpected error occurred. Please try again.')
        
        setTimeout(() => {
          router.push('/?error=callback_failed&message=' + encodeURIComponent('Authentication failed. Please try again.'))
        }, 2000)
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        {browserWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              ⚠️ Browser Compatibility Warning
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              {browserWarning}
            </p>
          </div>
        )}
        
        {isMobile && !errorMessage && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              📱 Mobile Device Detected
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              If you experience issues, try copying the link and opening it in a different browser.
            </p>
          </div>
        )}
        
        {errorMessage ? (
          <>
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-destructive rounded-full"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-sans text-destructive font-semibold">Authentication Error</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              {isMobile && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium mb-1">Mobile Troubleshooting:</p>
                  <ul className="text-xs text-muted-foreground text-left space-y-1 list-disc list-inside">
                    <li>Try copying the link and opening in Chrome or Firefox</li>
                    <li>Make sure you're using the latest browser version</li>
                    <li>Request a new login link if the problem persists</li>
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-4">Redirecting...</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-border rounded-full"></div>
              <div className="absolute inset-0 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-sans text-muted-foreground">Signing you in...</p>
          </>
        )}
      </div>
    </main>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-border rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-dark border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-sans text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}

