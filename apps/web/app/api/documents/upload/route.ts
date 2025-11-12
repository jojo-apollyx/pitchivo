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
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organization_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX are allowed' },
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
      // File already exists - return existing record
      return NextResponse.json({
        message: 'File already analyzed',
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
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
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
      return NextResponse.json({ error: 'Failed to create extraction record' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: extraction,
      isExisting: false
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

