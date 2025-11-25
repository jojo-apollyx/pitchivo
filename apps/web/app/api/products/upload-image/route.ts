import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadProductImageToAzure } from '@/lib/azure-storage/product-images'

/**
 * POST /api/products/upload-image
 * 
 * Upload product image to Azure Blob Storage
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png'
    const filename = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Azure Blob Storage
    try {
      const publicUrl = await uploadProductImageToAzure(
        buffer,
        filename,
        file.type,
        user.id
      )

      console.log('[Upload Image] Image uploaded to Azure Blob Storage:', publicUrl)

      return NextResponse.json({
        success: true,
        image: {
          url: publicUrl,
          filename,
          size: file.size,
          type: file.type,
        }
      })
    } catch (uploadError: any) {
      console.error('[Upload Image] Azure upload error:', uploadError)
      
      // If Azure storage is not configured, return error
      if (uploadError.message?.includes('Azure Storage credentials')) {
        return NextResponse.json(
          { error: 'Azure Storage is not configured. Please set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to upload image to Azure Storage', details: uploadError.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Upload Image] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

