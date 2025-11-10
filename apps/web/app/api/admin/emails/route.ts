import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API route to get admin user emails
 * This is used to notify admins when someone joins the waitlist
 * Uses service role key to bypass RLS and query all admin users
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
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

