'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback: Page loaded')
        console.log('Auth callback: Current URL:', window.location.href)
        console.log('Auth callback: Hash:', window.location.hash)
        
        const supabase = createClient()
        
        console.log('Auth callback: Supabase client created')
        
        // Parse hash fragment manually
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const access_token = hashParams.get('access_token')
        const refresh_token = hashParams.get('refresh_token')
        
        console.log('Auth callback: Tokens from hash', { 
          hasAccessToken: !!access_token, 
          hasRefreshToken: !!refresh_token 
        })
        
        // If we have tokens in the hash, set the session manually
        if (access_token && refresh_token) {
          console.log('Auth callback: Setting session from hash tokens')
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token
          })
          console.log('Auth callback: Session set result', { data, error })
        }
        
        // Get user after setting session
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        console.log('Auth callback: User data', { user, userError })
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          router.push('/?error=user_not_found')
          return
        }

        // Check if user has completed organization setup
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('organization_id, organizations(onboarding_completed_at)')
          .eq('id', user.id)
          .single()

        console.log('Auth callback: Profile data', { profile, profileError })

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          router.push('/?error=profile_not_found')
          return
        }

        // If no organization or organization setup not completed, redirect to setup
        const needsSetup = !profile?.organization_id || !profile.organizations?.onboarding_completed_at
        console.log('Auth callback: Needs setup?', needsSetup, {
          hasOrgId: !!profile?.organization_id,
          hasOnboardingCompleted: !!profile.organizations?.onboarding_completed_at
        })
        
        if (needsSetup) {
          console.log('Auth callback: Redirecting to setup')
          router.push('/setup/organization')
          return
        }

        // Otherwise, redirect to home
        console.log('Auth callback: Redirecting to home')
        router.push('/home')
      } catch (error) {
        console.error('Error in auth callback:', error)
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
        <div className="text-xs text-foreground/50 space-y-2">
          <p>🔍 Debug Info:</p>
          <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
          <p>Check browser console (F12) for detailed logs</p>
        </div>
      </div>
    </div>
  )
}

