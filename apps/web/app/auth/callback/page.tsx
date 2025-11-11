'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const supabase = createClient()
        
        // Parse hash fragment manually
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        
        // If we have tokens in the hash, set the session manually
        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token
          })
        }
        
        // Get user after setting session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('[Auth Callback] User fetch:', { user: user?.id, error: userError })
        
        if (userError || !user) {
          console.error('[Auth Callback] User not found:', userError)
          router.push('/?error=user_not_found')
          return
        }

        // Check if user has completed organization setup
        // First get the user profile to get their domain and metadata
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, domain, organization_id, metadata, org_role')
          .eq('id', user.id)
          .single()

        console.log('[Auth Callback] Profile fetch:', { 
          profile, 
          error: profileError,
          organization_id: profile?.organization_id,
          domain: profile?.domain
        })

        if (profileError || !profile) {
          console.error('[Auth Callback] Profile error:', profileError)
          router.push('/?error=profile_not_found')
          return
        }

        // Check if there's an organization for the user's domain with completed onboarding
        // This is more reliable than checking organization_id since organizations are domain-based
        const { data: organizations, error: orgError } = await supabase
          .from('organizations')
          .select('id, onboarding_completed_at')
          .eq('domain', profile.domain)
          .not('onboarding_completed_at', 'is', null)
          .limit(1)
        
        const organization = organizations?.[0]
        const hasOrgOnboardingCompleted = !!organization?.onboarding_completed_at

        console.log('[Auth Callback] Organization check:', {
          domain: profile.domain,
          organization,
          error: orgError,
          onboarding_completed_at: organization?.onboarding_completed_at,
          hasOrgOnboardingCompleted
        })

        // Check if user has completed their profile setup
        // For first user: org onboarding must be completed
        // For subsequent users: org onboarding must be completed AND user must have org_role set
        const hasUserCompletedProfile = !!profile.org_role

        console.log('[Auth Callback] User profile check:', {
          hasOrgOnboardingCompleted,
          hasUserCompletedProfile,
          org_role: profile.org_role
        })

        // If organization onboarding is not completed, user needs to complete setup
        if (!hasOrgOnboardingCompleted) {
          console.log('[Auth Callback] Redirecting to setup - organization onboarding not complete')
          router.push('/setup/organization')
          return
        }

        // If organization onboarding is completed but user hasn't completed their profile, they need to complete it
        if (hasOrgOnboardingCompleted && !hasUserCompletedProfile) {
          console.log('[Auth Callback] Redirecting to setup - user profile not complete')
          router.push('/setup/organization')
          return
        }

        // Both organization and user profile are complete, go to dashboard
        console.log('[Auth Callback] Redirecting to dashboard - both organization and user profile complete')
        router.push('/dashboard')
      } catch (error) {
        console.error('[Auth Callback] Unexpected error:', error)
        router.push('/?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-lg text-foreground/70">Signing you in...</p>
      </div>
    </div>
  )
}

