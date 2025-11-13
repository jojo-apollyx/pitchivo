import { NextRequest, NextResponse } from 'next/server'
import { validateAuthentication } from '@/lib/document-processing/shared'
import { loadIndustrySchema, isIndustrySupported } from '@/lib/industries'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Industry-Specific Data Merge
 * 
 * POST /api/[industry_code]/documents/merge
 * 
 * Intelligently merges existing form data with newly extracted fields using AI.
 * Uses industry-specific merge strategies to handle field-level conflicts.
 * 
 * @param industry_code - Industry identifier (e.g., 'food_supplement', 'pharmaceuticals')
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { industry_code: string } }
) {
  const { industry_code } = params

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

    const body = await request.json()
    const { currentData, newFields } = body

    if (!currentData || !newFields) {
      return NextResponse.json(
        { error: 'Current data and new fields are required' },
        { status: 400 }
      )
    }

    console.log(`[${industrySchema.INDUSTRY_NAME}] Starting intelligent merge`)

    // Initialize Azure OpenAI
    const azureOpenAI = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
    })

    // Prepare data for AI analysis
    const currentDataStr = JSON.stringify(currentData, null, 2)
    const newFieldsStr = JSON.stringify(newFields, null, 2)

    // Get industry-specific merge prompt
    const mergeSystemPrompt = industrySchema.getMergeSystemPrompt()

    const userPrompt = `CURRENT FORM DATA:
${currentDataStr}

NEW EXTRACTED FIELDS:
${newFieldsStr}

Now merge the data:`

    const { text: mergedDataText } = await generateText({
      model: azureOpenAI(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'),
      messages: [
        {
          role: 'system',
          content: mergeSystemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent merging
      maxTokens: 4000,
    })

    // Parse the AI response
    let mergedData: Record<string, any>
    try {
      // Remove markdown code blocks if present
      let cleanedText = mergedDataText.trim()
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }
      
      mergedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[Merge] Failed to parse AI response:', mergedDataText)
      
      // Fallback: simple merge (new values overwrite empty current values)
      mergedData = { ...currentData }
      Object.entries(newFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value) && Array.isArray(mergedData[key])) {
            // Merge arrays
            mergedData[key] = [...new Set([...mergedData[key], ...value])]
          } else if (!mergedData[key] || mergedData[key] === '' || mergedData[key] === null) {
            // Overwrite empty/null values
            mergedData[key] = value
          }
        }
      })

      console.warn('[Merge] Used fallback merge strategy')
    }

    console.log(`[${industrySchema.INDUSTRY_NAME}] Merge completed successfully`)

    return NextResponse.json({
      success: true,
      mergedData,
    })
  } catch (error) {
    console.error(`[Industry: ${industry_code}] Merge error:`, error)
    return NextResponse.json(
      { 
        error: 'Failed to merge data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

