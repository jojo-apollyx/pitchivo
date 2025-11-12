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

    // Get document
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('reference_count, storage_path')
      .eq('id', fileId)
      .single()

    if (fetchError || !extraction) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
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

