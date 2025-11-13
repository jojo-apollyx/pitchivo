import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Intelligently merge existing form data with newly extracted fields using AI
 * 
 * POST /api/documents/merge
 * Body: {
 *   currentData: Record<string, any>,  // Existing form data
 *   newFields: Record<string, any>,     // Newly extracted fields to merge
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { currentData, newFields } = body

    if (!currentData || !newFields) {
      return NextResponse.json(
        { error: 'Current data and new fields are required' },
        { status: 400 }
      )
    }

    // Initialize Azure OpenAI
    const azureOpenAI = createAzure({
      resourceName: process.env.AZURE_OPENAI_RESOURCE_NAME!,
      apiKey: process.env.AZURE_OPENAI_API_KEY!,
    })

    // Prepare data for AI analysis
    const currentDataStr = JSON.stringify(currentData, null, 2)
    const newFieldsStr = JSON.stringify(newFields, null, 2)

    const prompt = `You are an intelligent data merger for a B2B product information system. Your task is to merge existing product form data with newly extracted fields from a document.

CURRENT FORM DATA:
${currentDataStr}

NEW EXTRACTED FIELDS:
${newFieldsStr}

MERGE RULES:
1. **Text Fields (strings)**:
   - If current field is empty/null, use new value
   - If current field has value and new field has DIFFERENT value:
     * For descriptions: Combine both intelligently, removing duplicates
     * For single-value fields (like product name, manufacturer): Keep current value if they're similar, otherwise prefer the more complete one
     * For technical specs: Prefer the newer/more specific value

2. **Arrays**:
   - Merge arrays and remove duplicates
   - Keep all unique items from both arrays
   
3. **Numbers**:
   - If current is null/0, use new value
   - If both have values, prefer the new value ONLY if it's more precise or complete
   - Keep current value if new value is null/0

4. **Nested Objects (grouped fields)**:
   - Process each nested field according to the rules above
   - Preserve the grouped structure in output

5. **Special Considerations**:
   - If a field appears in both flat and grouped format, consolidate to grouped format
   - Preserve field types (don't convert numbers to strings)
   - For certifications and compliance data, merge and deduplicate

OUTPUT FORMAT:
Return ONLY a valid JSON object with the merged data. Include BOTH flat fields and a "_grouped" property if grouped data exists.
Do not include any explanations, markdown formatting, or code blocks - just the raw JSON.

Example output structure:
{
  "productName": "merged value",
  "description": "intelligently combined description",
  "applications": ["app1", "app2", "app3"],
  "_grouped": {
    "chemical": {
      "assay_min": 95.5,
      "moisture_max": 5.0
    }
  }
}

Now merge the data:`

    const { text: mergedDataText } = await generateText({
      model: azureOpenAI(process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'),
      messages: [
        {
          role: 'user',
          content: prompt,
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
        cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '')
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '')
      }
      
      mergedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[Merge API] Failed to parse AI response:', mergedDataText)
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
          // Keep current value if it exists and new value would overwrite it
        }
      })
    }

    return NextResponse.json({
      success: true,
      mergedData,
    })
  } catch (error) {
    console.error('[Merge API] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to merge data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

