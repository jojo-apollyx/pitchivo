import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import isEqual from 'fast-deep-equal'

export const runtime = 'nodejs'

/**
 * Update reviewed values for a document
 * PUT /api/documents/review
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fileId, reviewedValues } = await request.json()

    if (!fileId || !reviewedValues) {
      return NextResponse.json(
        { error: 'File ID and reviewed values are required' },
        { status: 400 }
      )
    }

    // Get existing document
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('extracted_values')
      .eq('id', fileId)
      .single()

    if (fetchError || !extraction) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Parse extracted_values if it's a string (sometimes stored as JSON string)
    let extractedValues = extraction.extracted_values
    if (typeof extractedValues === 'string') {
      try {
        extractedValues = JSON.parse(extractedValues)
      } catch (e) {
        // If parsing fails, use as-is
      }
    }

    // Calculate corrections (what changed)
    // Use fast-deep-equal for accurate deep comparison of objects and arrays
    const userCorrections: Record<string, any> = {}
    
    Object.keys(reviewedValues).forEach(key => {
      const originalValue = extractedValues?.[key]
      const reviewedValue = reviewedValues[key]
      
      // Only record as correction if values are actually different (deep comparison)
      if (originalValue !== undefined && !isEqual(originalValue, reviewedValue)) {
        userCorrections[key] = {
          original: originalValue,
          corrected: reviewedValue,
          changed_at: new Date().toISOString()
        }
      }
    })

    // Update document with reviewed values
    const { data: updated, error: updateError } = await supabase
      .from('document_extractions')
      .update({
        reviewed_values: reviewedValues,
        user_corrections: Object.keys(userCorrections).length > 0 ? userCorrections : null,
        review_status: 'reviewed',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update reviewed values' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Review saved successfully',
      extraction: updated,
      corrections_count: Object.keys(userCorrections).length
    })

  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get document with extraction data
 * GET /api/documents/review?fileId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = request.nextUrl.searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Get document
    const { data: extraction, error: fetchError } = await supabase
      .from('document_extractions')
      .select('*')
      .eq('id', fileId)
      .single()

    if (fetchError || !extraction) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Return values to use (reviewed if available, otherwise extracted)
    const valuesToUse = extraction.reviewed_values || extraction.extracted_values

    return NextResponse.json({
      extraction,
      valuesToUse,
      isReviewed: extraction.review_status === 'reviewed'
    })

  } catch (error) {
    console.error('Get review error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

