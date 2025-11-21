/**
 * Global Sequence Templates API
 * 
 * GET /api/admin/sequence-templates - List all global templates
 * POST /api/admin/sequence-templates - Create a new global template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all global sequence templates, grouped by template_name
    const { data: templates, error } = await supabase
      .from('global_sequence_templates')
      .select('*')
      .eq('is_active', true)
      .order('template_name', { ascending: true })
      .order('seq_number', { ascending: true });

    if (error) {
      console.error('[Global Sequence Templates API] Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    // Group by template_name
    const grouped = templates.reduce((acc: any, template: any) => {
      const name = template.template_name;
      if (!acc[name]) {
        acc[name] = [];
      }
      acc[name].push(template);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      templates: grouped,
      allTemplates: templates,
    });

  } catch (error) {
    console.error('[Global Sequence Templates API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_pitchivo_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_pitchivo_admin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { template_name, seq_number, subject, email_body, delay_days, is_active } = body;

    if (!template_name || !seq_number || !email_body) {
      return NextResponse.json(
        { error: 'Missing required fields: template_name, seq_number, email_body' },
        { status: 400 }
      );
    }

    // Insert template
    const { data: template, error } = await supabase
      .from('global_sequence_templates')
      .insert({
        template_name,
        seq_number,
        subject: subject || null,
        email_body,
        delay_days: delay_days || 1,
        is_active: is_active !== false,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[Global Sequence Templates API] Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error) {
    console.error('[Global Sequence Templates API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

