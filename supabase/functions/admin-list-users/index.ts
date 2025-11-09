import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the caller is an admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is Pitchivo admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.is_pitchivo_admin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // List all users with pagination
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000 // Adjust as needed
    })

    if (error) {
      console.error('Error listing users:', error)
      return new Response(
        JSON.stringify({ error: `Failed to list users: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return users with their banned status
    const usersWithStatus = users.map(u => {
      // Log the raw banned_until value to debug
      console.log(`User ${u.email}: banned_until raw value:`, u.banned_until, typeof u.banned_until)
      
      // Check if user is banned
      // banned_until will be:
      // - A timestamp string if temporarily banned
      // - 'infinity' string if permanently banned
      // - null/undefined if not banned
      const isBanned = u.banned_until !== null && 
                       u.banned_until !== undefined && 
                       u.banned_until !== '' &&
                       u.banned_until !== 'none'
      
      console.log(`User ${u.email}: is_banned=${isBanned}`)
      
      return {
        id: u.id,
        email: u.email,
        is_banned: isBanned,
        banned_until: u.banned_until,
        created_at: u.created_at,
      }
    })

    console.log(`Returning ${usersWithStatus.length} users, banned count: ${usersWithStatus.filter(u => u.is_banned).length}`)

    return new Response(
      JSON.stringify({ users: usersWithStatus }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in admin-list-users:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

