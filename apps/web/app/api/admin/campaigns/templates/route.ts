import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET: Fetch all templates for a campaign
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Missing campaignId parameter' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates: data || [] })
  } catch (error: any) {
    console.error('Error in GET templates:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create a new template
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { campaignId, templateName, subject, content, isDefault } = body

    if (!campaignId || !templateName || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // If this template is set as default, unset any existing default
    if (isDefault) {
      await supabaseAdmin
        .from('email_templates')
        .update({ is_default: false })
        .eq('campaign_id', campaignId)
        .eq('is_default', true)
    }

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        campaign_id: campaignId,
        template_name: templateName,
        subject,
        content,
        is_default: isDefault || false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json(
        { error: 'Failed to create template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data })
  } catch (error: any) {
    console.error('Error in POST template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update an existing template
export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { templateId, templateName, subject, content, isDefault } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing templateId' },
        { status: 400 }
      )
    }

    // Get the template to find its campaign_id
    const { data: existingTemplate, error: fetchError } = await supabaseAdmin
      .from('email_templates')
      .select('campaign_id')
      .eq('template_id', templateId)
      .single()

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // If this template is set as default, unset any existing default
    if (isDefault) {
      await supabaseAdmin
        .from('email_templates')
        .update({ is_default: false })
        .eq('campaign_id', existingTemplate.campaign_id)
        .eq('is_default', true)
        .neq('template_id', templateId)
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (templateName) updateData.template_name = templateName
    if (subject) updateData.subject = subject
    if (content) updateData.content = content
    if (isDefault !== undefined) updateData.is_default = isDefault

    const { data, error } = await supabaseAdmin
      .from('email_templates')
      .update(updateData)
      .eq('template_id', templateId)
      .select()
      .single()

    if (error) {
      console.error('Error updating template:', error)
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data })
  } catch (error: any) {
    console.error('Error in PUT template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove a template
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Missing templateId parameter' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('template_id', templateId)

    if (error) {
      console.error('Error deleting template:', error)
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE template:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
