/**
 * Global Sequence Template API (Single Template)
 * 
 * PUT /api/admin/sequence-templates/[templateId] - Update a template
 * DELETE /api/admin/sequence-templates/[templateId] - Delete a template
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
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

    const { templateId } = await params;
    const body = await request.json();
    const { template_name, seq_number, subject, email_body, delay_days, is_active } = body;

    // Get current template to check what's changing
    const { data: currentTemplate } = await supabase
      .from('global_sequence_templates')
      .select('template_name, seq_number')
      .eq('template_id', templateId)
      .single();

    if (!currentTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if sequence number or template name is being changed to a duplicate
    const finalTemplateName = template_name !== undefined ? template_name : currentTemplate.template_name;
    const finalSeqNumber = seq_number !== undefined ? seq_number : currentTemplate.seq_number;

    // Only check for duplicates if template_name or seq_number is being changed
    if ((template_name !== undefined || seq_number !== undefined) && 
        (finalTemplateName !== currentTemplate.template_name || finalSeqNumber !== currentTemplate.seq_number)) {
      const { data: existingTemplate } = await supabase
        .from('global_sequence_templates')
        .select('template_id')
        .eq('template_name', finalTemplateName)
        .eq('seq_number', finalSeqNumber)
        .neq('template_id', templateId) // Exclude current template
        .eq('is_active', true)
        .maybeSingle();

      if (existingTemplate) {
        return NextResponse.json(
          { 
            error: `Sequence ${finalSeqNumber} already exists for template "${finalTemplateName}". Please use a different sequence number.`,
          },
          { status: 400 }
        );
      }
    }

    // Update template
    const updateData: any = {};
    if (template_name !== undefined) updateData.template_name = template_name;
    if (seq_number !== undefined) updateData.seq_number = seq_number;
    if (subject !== undefined) updateData.subject = subject || null;
    if (email_body !== undefined) updateData.email_body = email_body;
    if (delay_days !== undefined) updateData.delay_days = delay_days;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: template, error } = await supabase
      .from('global_sequence_templates')
      .update(updateData)
      .eq('template_id', templateId)
      .select()
      .single();

    if (error) {
      console.error('[Global Sequence Templates API] Error updating template:', error);
      
      // Check if it's a unique constraint violation
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
        return NextResponse.json(
          { 
            error: `Sequence ${finalSeqNumber} already exists for template "${finalTemplateName}". Please use a different sequence number.`,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to update template', details: error.message },
        { status: 500 }
      );
    }

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
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

    const { templateId } = await params;

    // Delete template
    const { error } = await supabase
      .from('global_sequence_templates')
      .delete()
      .eq('template_id', templateId);

    if (error) {
      console.error('[Global Sequence Templates API] Error deleting template:', error);
      return NextResponse.json(
        { error: 'Failed to delete template', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully',
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

