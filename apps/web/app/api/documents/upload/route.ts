import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Upload document file and create extraction record
 * POST /api/documents/upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json({ 
        error: 'Failed to fetch user data',
        details: userError.message 
      }, { status: 500 })
    }

    if (!userData?.organization_id) {
      return NextResponse.json({ 
        error: 'User organization not found. Please complete organization setup first.',
        details: 'The user account does not have an organization_id assigned. Please set up your organization before uploading documents.'
      }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    // Support both document types and image types (for vision API)
    const allowedTypes = [
      // Document types
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Image types (for Azure OpenAI vision API)
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          details: `File type "${file.type}" is not allowed. Supported types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, WEBP.`
        },
        { status: 400 }
      )
    }

    // Calculate file hash for deduplication
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex')

    // Check if file with same hash already exists
    const { data: existingFile, error: checkError } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('content_hash', contentHash)
      .eq('organization_id', userData.organization_id)
      .is('deleted_at', null)
      .single()

    if (!checkError && existingFile) {
      // Check if file is stuck in "analyzing" state (likely from a failed previous attempt)
      // Reset to "pending" if it's been analyzing for more than 5 minutes
      // Use updated_at to check when status was last changed to "analyzing"
      const now = new Date()
      const updatedAt = new Date(existingFile.updated_at)
      const analyzingDuration = now.getTime() - updatedAt.getTime()
      const fiveMinutes = 5 * 60 * 1000
      
      if (existingFile.analysis_status === 'analyzing' && analyzingDuration > fiveMinutes) {
        console.log(`[Document Upload] Resetting stuck "analyzing" file (${existingFile.id}) to "pending"`)
        const { data: resetFile, error: resetError } = await supabase
          .from('document_extractions')
          .update({
            analysis_status: 'pending',
            error_message: null
          })
          .eq('id', existingFile.id)
          .select()
          .single()
        
        if (!resetError && resetFile) {
          return NextResponse.json({
            message: 'File found (was stuck in analyzing, reset to pending)',
            file: resetFile,
            isExisting: true
          })
        }
      }
      
      // If file is completed or recently started analyzing, return as-is
      if (existingFile.analysis_status === 'completed') {
        return NextResponse.json({
          message: 'File already analyzed',
          file: existingFile,
          isExisting: true
        })
      }
      
      // For pending, failed, or analyzing (recent), return existing record
      // Frontend will handle retrying if needed
      return NextResponse.json({
        message: existingFile.analysis_status === 'failed' 
          ? 'File found (previous attempt failed, can retry)'
          : existingFile.analysis_status === 'analyzing'
          ? 'File is currently being analyzed'
          : 'File found',
        file: existingFile,
        isExisting: true
      })
    }

    // Upload file to storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${userData.organization_id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      console.error('Upload error details:', {
        message: uploadError.message,
        name: uploadError.name,
        fileType: file.type,
        fileName: file.name,
        storagePath: storagePath
      })
      return NextResponse.json({ 
        error: 'Failed to upload file to storage',
        details: uploadError.message || 'Storage upload failed. Please check if the documents bucket exists and has proper permissions. If uploading images, ensure the bucket allows image MIME types.'
      }, { status: 500 })
    }

    // Create document extraction record
    const { data: extraction, error: insertError } = await supabase
      .from('document_extractions')
      .insert({
        content_hash: contentHash,
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        organization_id: userData.organization_id,
        uploaded_by: user.id,
        analysis_status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      // Clean up uploaded file
      await supabase.storage.from('documents').remove([storagePath])
      return NextResponse.json({ 
        error: 'Failed to create extraction record',
        details: insertError.message || 'Database insert failed. Please check the document_extractions table schema.'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: extraction,
      isExisting: false
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unexpected error occurred during file upload'
      },
      { status: 500 }
    )
  }
}

