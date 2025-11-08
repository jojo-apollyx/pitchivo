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
        
        if (userError || !user) {
          router.push('/?error=user_not_found')
          return
        }

        // Check if user has completed organization setup
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('organization_id, organizations(onboarding_completed_at)')
          .eq('id', user.id)
          .single()

        if (profileError) {
          router.push('/?error=profile_not_found')
          return
        }

        // If no organization or organization setup not completed, redirect to setup
        // TypeScript infers organizations as array, but it's actually a single object with .single()
        const organization = Array.isArray(profile?.organizations) 
          ? profile?.organizations[0] 
          : profile?.organizations
        const needsSetup = !profile?.organization_id || !organization?.onboarding_completed_at
        
        if (needsSetup) {
          router.push('/setup/organization')
          return
        }

        // Otherwise, redirect to home
        router.push('/home')
      } catch (error) {
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

