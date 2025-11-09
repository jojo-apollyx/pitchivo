import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, action } = await req.json()

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: 'userId and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['suspend', 'unsuspend'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'action must be "suspend" or "unsuspend"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Perform the suspend/unsuspend action
    if (action === 'suspend') {
      // Method 1: Try using ban_duration with a duration string
      // Valid formats: '24h', '7d', '876000h' (for ~100 years = permanent)
      const { data: bannedUser, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: '876000h' } // ~100 years = effectively permanent
      )

      if (error) {
        console.error('Error suspending user with ban_duration:', error)
        
        // Method 2: Fallback - try setting user_metadata or app_metadata
        const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { suspended: true, suspended_at: new Date().toISOString() }
          }
        )
        
        if (metaError) {
          return new Response(
            JSON.stringify({ error: `Failed to suspend user: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      console.log(`User ${userId} suspended by admin ${user.id}`, bannedUser)
    } else {
      // Unsuspend: Remove the ban
      const { data: unbannedUser, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { ban_duration: 'none' } // 'none' removes the ban
      )

      if (error) {
        console.error('Error unsuspending user:', error)
        
        // Fallback: clear metadata
        const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            user_metadata: { suspended: false }
          }
        )
        
        if (metaError) {
          return new Response(
            JSON.stringify({ error: `Failed to unsuspend user: ${error.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      console.log(`User ${userId} unsuspended by admin ${user.id}`, unbannedUser)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${action === 'suspend' ? 'suspended' : 'unsuspended'} successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in admin-suspend-user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

