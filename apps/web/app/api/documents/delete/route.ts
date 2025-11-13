import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Delete a document (soft delete if referenced, hard delete if not)
 * DELETE /api/documents/delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get user's organization for permission check
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 })
    }

    // Get document (including soft-deleted ones for cleanup)
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('reference_count, storage_path, organization_id, deleted_at')
      .eq('id', fileId)
      .single()

    if (fetchError || !extraction) {
      // If document not found, it might have been deleted already or never existed
      // Return success to allow UI cleanup
      return NextResponse.json({
        message: 'Document not found (may have been already deleted)',
        type: 'not_found'
      })
    }

    // Check organization permission
    if (extraction.organization_id !== userData.organization_id) {
      return NextResponse.json({ error: 'Unauthorized to delete this document' }, { status: 403 })
    }

    // If already soft-deleted, just return success
    if (extraction.deleted_at) {
      return NextResponse.json({
        message: 'Document already deleted',
        type: 'already_deleted'
      })
    }

    if (extraction.reference_count > 0) {
      // Soft delete - still referenced by products
      const { error: softDeleteError } = await supabase
        .from('document_extractions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', fileId)

      if (softDeleteError) {
        console.error('Soft delete error:', softDeleteError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Document marked as deleted (still referenced by products)',
        type: 'soft_delete',
        reference_count: extraction.reference_count
      })
    } else {
      // Hard delete - not referenced, can fully remove
      const { error: deleteError } = await supabase
        .from('document_extractions')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        console.error('Hard delete error:', deleteError)
        return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
      }

      // Delete from storage
      await supabase.storage
        .from('documents')
        .remove([extraction.storage_path])

      return NextResponse.json({
        message: 'Document permanently deleted',
        type: 'hard_delete'
      })
    }

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

