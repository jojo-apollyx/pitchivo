import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Delete a document from a product or permanently
 * DELETE /api/documents/delete
 * 
 * Body: { fileId: string, productId?: string }
 * - If productId is provided: Remove file from that product's uploaded_files array only
 * - If productId is not provided: Check all products and soft/hard delete based on references
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, productId } = await request.json()

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

    // Get document
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('storage_path, organization_id, deleted_at')
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

    // If productId is provided, only remove from that product
    if (productId) {
      // Get the product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('product_data, org_id')
        .eq('product_id', productId)
        .eq('org_id', userData.organization_id)
        .single()

      if (productError || !product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      // Parse product_data
      const productData = typeof product.product_data === 'string' 
        ? JSON.parse(product.product_data) 
        : product.product_data || {}

      // Remove file from uploaded_files array
      const uploadedFiles = (productData.uploaded_files || []).filter(
        (f: any) => f.file_id !== fileId
      )

      // Update product_data
      const updatedProductData = {
        ...productData,
        uploaded_files: uploadedFiles
      }

      // Update product
      const { error: updateError } = await supabase
        .from('products')
        .update({ product_data: updatedProductData })
        .eq('product_id', productId)
        .eq('org_id', userData.organization_id)

      if (updateError) {
        console.error('Error removing file from product:', updateError)
        return NextResponse.json({ error: 'Failed to remove file from product' }, { status: 500 })
      }

      // Check if document is still referenced in any other product
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('product_data')
        .eq('org_id', userData.organization_id)

      if (productsError) {
        console.error('Error checking product references:', productsError)
        // Continue anyway - we've removed from the requested product
      } else {
        // Check if file is referenced in any other product
        const isReferencedElsewhere = allProducts?.some((p: any) => {
          const pd = typeof p.product_data === 'string' 
            ? JSON.parse(p.product_data) 
            : p.product_data || {}
          const files = pd.uploaded_files || []
          return files.some((f: any) => f.file_id === fileId)
        }) || false

        // If not referenced anywhere, soft delete the document
        if (!isReferencedElsewhere) {
          const { error: softDeleteError } = await supabase
            .from('document_extractions')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', fileId)

          if (softDeleteError) {
            console.error('Soft delete error:', softDeleteError)
            // Don't fail the request, we've already removed from product
          }
        }
      }

      return NextResponse.json({
        message: 'Document removed from product',
        type: 'removed_from_product',
        productId
      })
    }

    // No productId provided - check all products for references
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('product_data')
      .eq('org_id', userData.organization_id)

    if (productsError) {
      console.error('Error checking product references:', productsError)
      // Continue with deletion check
    }

    // Check if file is referenced in any product's uploaded_files
    const isReferenced = allProducts?.some((p: any) => {
      const pd = typeof p.product_data === 'string' 
        ? JSON.parse(p.product_data) 
        : p.product_data || {}
      const files = pd.uploaded_files || []
      return files.some((f: any) => f.file_id === fileId)
    }) || false

    if (isReferenced) {
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
        type: 'soft_delete'
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

