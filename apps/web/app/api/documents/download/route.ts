import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/documents/download?fileId=xxx
 * 
 * Get signed download URL for a document
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('[Download] Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const fileId = request.nextUrl.searchParams.get('fileId')
    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    console.log('[Download] Requesting file:', fileId)

    // Get user's organization for permission check
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('[Download] User fetch error:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      )
    }

    // Get document extraction record
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('storage_path, filename, mime_type, organization_id, deleted_at')
      .eq('id', fileId)
      .single()

    if (fetchError) {
      console.error('[Download] Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Document not found', details: fetchError.message },
        { status: 404 }
      )
    }

    if (!extraction) {
      console.error('[Download] Extraction not found for fileId:', fileId)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if file is deleted
    if (extraction.deleted_at) {
      console.error('[Download] File is deleted:', fileId)
      return NextResponse.json(
        { error: 'Document has been deleted' },
        { status: 404 }
      )
    }

    // Check organization permission (if user has organization)
    if (userData?.organization_id && extraction.organization_id !== userData.organization_id) {
      console.error('[Download] Organization mismatch:', {
        userOrg: userData.organization_id,
        fileOrg: extraction.organization_id
      })
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    console.log('[Download] Creating signed URL for:', extraction.storage_path)

    // Create signed URL (valid for 1 hour)
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(extraction.storage_path, 3600)

    if (urlError) {
      console.error('[Download] Signed URL error:', urlError)
      // If file doesn't exist, return 404 instead of 500
      if (urlError.message?.includes('not found') || urlError.message?.includes('404') || (urlError as any).statusCode === '404' || (urlError as any).status === 404) {
        return NextResponse.json(
          { error: 'File not found in storage. The file may have been deleted.', details: urlError.message },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: 'Failed to create download URL', details: urlError.message },
        { status: 500 }
      )
    }

    if (!signedUrlData?.signedUrl) {
      console.error('[Download] No signed URL returned')
      return NextResponse.json(
        { error: 'Failed to create download URL' },
        { status: 500 }
      )
    }

    console.log('[Download] Success for file:', fileId)

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(extraction.storage_path)

    if (downloadError || !fileData) {
      console.error('[Download] File download error:', downloadError)
      // Fallback to returning signed URL if direct download fails
      return NextResponse.json({
        downloadUrl: signedUrlData.signedUrl,
        filename: extraction.filename,
        mimeType: extraction.mime_type,
      })
    }

    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Encode filename properly for Content-Disposition header (RFC 5987 for Unicode support)
    // RFC 5987 allows Unicode characters in filenames
    const encodedFilename = encodeURIComponent(extraction.filename)
    // ASCII fallback for older browsers/clients that don't support RFC 5987
    const safeFilename = extraction.filename
      .replace(/[^\x20-\x7E]/g, '_') // Replace non-ASCII with underscore
      .replace(/[<>:"/\\|?*]/g, '_') // Remove invalid filename characters
      .trim() || 'document'
    
    // Return file with proper headers to force download
    // Modern browsers will use filename*=UTF-8''... (RFC 5987) which preserves Unicode
    // Older browsers will fall back to the ASCII filename
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': extraction.mime_type,
        // RFC 5987 format: filename*=UTF-8''encoded-filename (preserves Unicode like Chinese characters)
        // ASCII fallback: filename="safe-filename" (for compatibility)
        'Content-Disposition': `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('[Download] Unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

