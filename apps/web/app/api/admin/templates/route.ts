import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET - List all global templates
export async function GET(request: NextRequest) {
  try {
    const { data: templates, error } = await supabaseAdmin
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error loading templates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load templates' },
      { status: 500 }
    )
  }
}

// POST - Create new global template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateName, subject, content, category, description } = body

    if (!templateName || !subject || !content) {
      return NextResponse.json(
        { error: 'Template name, subject, and content are required' },
        { status: 400 }
      )
    }

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .insert({
        template_name: templateName,
        subject,
        content,
        category: category || 'general',
        description: description || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create template' },
      { status: 500 }
    )
  }
}

// PUT - Update existing template
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { templateId, templateName, subject, content, category, description } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (templateName) updateData.template_name = templateName
    if (subject) updateData.subject = subject
    if (content) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (description !== undefined) updateData.description = description

    const { data: template, error } = await supabaseAdmin
      .from('email_templates')
      .update(updateData)
      .eq('template_id', templateId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ template })
  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Delete template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('email_templates')
      .delete()
      .eq('template_id', templateId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete template' },
      { status: 500 }
    )
  }
}

