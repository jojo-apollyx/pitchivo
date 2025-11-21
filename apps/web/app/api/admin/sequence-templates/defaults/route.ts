import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/admin/sequence-templates/defaults
 * Get default sequence templates (ordered list)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Get default sequence configuration
    const { data: config, error: configError } = await supabase
      .from('admin_default_sequences')
      .select('template_ids')
      .single()

    if (configError && configError.code !== 'PGRST116') {
      throw configError
    }

    const templateIds = config?.template_ids || []

    if (templateIds.length === 0) {
      return NextResponse.json({ defaults: [] })
    }

    // Get the actual templates in order
    const { data: templates, error: templatesError } = await supabase
      .from('global_sequence_templates')
      .select('*')
      .in('template_id', templateIds)
      .eq('is_active', true)

    if (templatesError) {
      throw templatesError
    }

    // Sort templates by the order in template_ids
    const orderedTemplates = templateIds
      .map(id => templates?.find(t => t.template_id === id))
      .filter(Boolean)

    return NextResponse.json({ defaults: orderedTemplates })
  } catch (error: any) {
    console.error('[Admin Default Sequences API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/sequence-templates/defaults
 * Update default sequence templates (ordered list)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { defaults } = body

    if (!Array.isArray(defaults)) {
      return NextResponse.json(
        { error: 'defaults must be an array of template IDs' },
        { status: 400 }
      )
    }

    // Upsert the configuration
    const { error: upsertError } = await supabase
      .from('admin_default_sequences')
      .upsert({
        id: 1, // Single row configuration
        template_ids: defaults,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({ 
      success: true,
      message: 'Default sequences updated successfully'
    })
  } catch (error: any) {
    console.error('[Admin Default Sequences API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

