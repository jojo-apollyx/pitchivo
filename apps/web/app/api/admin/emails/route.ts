import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route to get admin user emails
 * This is used to notify admins when someone joins the waitlist
 * Uses service role key to bypass RLS and query all admin users
 * 
 * Environment Variables:
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key for bypassing RLS
 *   - Production: Set in your deployment environment
 *   - Local: Optional - add to .env.local if you want admin notifications
 *            Get the key by running: `supabase status` (look for "Secret key")
 *            If not set, returns empty array (graceful degradation)
 * 
 * Setup for Local Development:
 * 1. Run `supabase status` to see your local Supabase keys
 * 2. Copy the "Secret key" value
 * 3. Add to `.env.local`: SUPABASE_SERVICE_ROLE_KEY=your_secret_key_here
 * 
 * Note: Admin notifications are non-critical, so this endpoint gracefully
 * returns an empty array if the service role key is not configured.
 * This allows local development without requiring the key to be set.
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // If service role key is not set, gracefully return empty array
    // Admin notifications are non-critical and this allows local development without the key
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      const isLocalDev = supabaseUrl?.includes('localhost') || 
                        supabaseUrl?.includes('127.0.0.1') || 
                        supabaseUrl?.includes('54321')
      
      if (isLocalDev) {
        console.info('SUPABASE_SERVICE_ROLE_KEY not set - admin notifications disabled for local development')
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set - admin notifications disabled')
      }
      
      // Return empty array instead of error
      // Admin notifications are non-critical and this allows graceful degradation
      return NextResponse.json({ emails: [] })
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Query all admin users
    const { data: adminUsers, error } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('is_pitchivo_admin', true)

    if (error) {
      console.error('Error fetching admin emails:', error)
      return NextResponse.json(
        { error: 'Failed to fetch admin emails' },
        { status: 500 }
      )
    }

    // Extract emails from admin users
    const adminEmails = (adminUsers || [])
      .map((user) => user.email)
      .filter((email): email is string => Boolean(email))

    return NextResponse.json({ emails: adminEmails })
  } catch (error: any) {
    console.error('Error in admin emails API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

