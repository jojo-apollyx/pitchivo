import { NextRequest, NextResponse } from 'next/server'
import {
  validateAuthentication,
  prepareDocumentForExtraction,
  runAIExtraction,
  saveExtractionResults,
  handleExtractionError
} from '@/lib/document-processing/shared'
import { loadIndustrySchema, isIndustrySupported } from '@/lib/industries'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for AI processing

/**
 * Industry-Specific Document Extraction
 * 
 * POST /api/[industry_code]/documents/extract
 * 
 * Extracts structured data from uploaded documents using industry-specific schemas.
 * Each industry has its own extraction prompt, document types, and field mappings.
 * 
 * @param industry_code - Industry identifier (e.g., 'food_supplement', 'pharmaceuticals')
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ industry_code: string }> }
) {
  const { industry_code } = await params

  try {
    // Validate authentication
    const authResult = await validateAuthentication()
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }

    // Validate industry code
    if (!isIndustrySupported(industry_code)) {
      return NextResponse.json(
        { error: `Industry '${industry_code}' is not supported` },
        { status: 400 }
      )
    }

    // Load industry-specific schema
    const industrySchema = await loadIndustrySchema(industry_code)
    if (!industrySchema) {
      return NextResponse.json(
        { error: `Failed to load schema for industry '${industry_code}'` },
        { status: 500 }
      )
    }

    // Get fileId from request body
    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    console.log(`[${industrySchema.INDUSTRY_NAME}] Starting extraction for file: ${fileId}`)

    // Prepare document for extraction (shared logic)
    const prepareResult = await prepareDocumentForExtraction(fileId)
    if ('error' in prepareResult) {
      console.error(`[${industry_code}] Prepare error:`, prepareResult.error)
      return NextResponse.json(
        { error: 'Failed to prepare document for analysis. Please try again or contact support if the issue persists.' },
        { status: prepareResult.status }
      )
    }

    // Run AI extraction with industry-specific prompt
    const systemPrompt = industrySchema.getExtractionSystemPrompt()
    const extractionResult = await runAIExtraction(prepareResult, {
      systemPrompt,
      includeImages: true,
      temperature: 0.1,
      maxTokens: 4000
    })

    if ('error' in extractionResult) {
      console.error(`[${industry_code}] Extraction error:`, extractionResult.error)
      await handleExtractionError(fileId, extractionResult.error)
      return NextResponse.json(
        { error: 'Unable to analyze document. The file may be corrupted or in an unsupported format. Please try a different file.' },
        { status: 500 }
      )
    }

    // Save results to database
    const saveResult = await saveExtractionResults(
      fileId,
      extractionResult.extractedData,
      extractionResult.rawResponse
    )

    if (!saveResult.success) {
      console.error(`[${industry_code}] Save error:`, saveResult.error)
      return NextResponse.json(
        { error: 'Analysis completed but failed to save results. Please try again.' },
        { status: 500 }
      )
    }

    console.log(`[${industrySchema.INDUSTRY_NAME}] Extraction completed successfully`)

    return NextResponse.json({
      success: true,
      extraction: saveResult.extraction
    })

  } catch (error) {
    console.error(`[Industry: ${industry_code}] Extraction error:`, error)
    console.error('Error details:', error instanceof Error ? error.stack : error)
    
    const body = await request.json().catch(() => ({}))
    if (body.fileId) {
      await handleExtractionError(
        body.fileId,
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while analyzing the document. Please try again or contact support if the issue persists.'
      },
      { status: 500 }
    )
  }
}

