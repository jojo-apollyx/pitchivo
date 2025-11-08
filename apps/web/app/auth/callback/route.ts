import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL('/?error=auth_failed', requestUrl.origin))
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('Error getting user:', userError)
      return NextResponse.redirect(new URL('/?error=user_not_found', requestUrl.origin))
    }

    // Check if user has completed organization setup
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('organization_id, organizations(onboarding_completed_at)')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.redirect(new URL('/?error=profile_not_found', requestUrl.origin))
    }

    // If no organization or organization setup not completed, redirect to setup
    if (!profile?.organization_id || !profile.organizations?.onboarding_completed_at) {
      return NextResponse.redirect(new URL('/setup/organization', requestUrl.origin))
    }

    // Otherwise, redirect to home
    return NextResponse.redirect(new URL('/home', requestUrl.origin))
  }

  // If no code, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

