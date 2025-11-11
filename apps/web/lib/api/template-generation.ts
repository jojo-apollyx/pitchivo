/**
 * AI Template Generation
 * Generates product templates using AI based on industry best practices
 */

import { validateGeneratedTemplate, normalizeTemplateSchema, TemplateSchema } from './template-validation'

/**
 * Get Azure OpenAI configuration from .env.local
 * Reads at runtime to ensure env vars are loaded
 */
function getAzureOpenAIConfig() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
  // Support both AZURE_OPENAI_DEPLOYMENT and AZURE_OPENAI_DEPLOYMENT_NAME
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.AZURE_OPENAI_DEPLOYMENT_NAME
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview'
  
  return { apiKey, endpoint, deployment, apiVersion }
}

/**
 * Get regular OpenAI configuration from .env.local
 */
function getOpenAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY
  const apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions'
  
  return { apiKey, apiUrl }
}

interface GenerateTemplateOptions {
  industryCode: string
  industryName: string
  orgContext?: {
    orgName?: string
    orgDescription?: string
  }
}

/**
 * Generate AI prompt for template generation with comprehensive guardrails
 */
function generateTemplatePrompt(options: GenerateTemplateOptions): string {
  const { industryCode, industryName, orgContext } = options
  
  return `You are an AI schema generator that creates structured JSON templates for product data collection in B2B and e-commerce platforms.

═══════════════════════════════════════════════════════════════
CRITICAL OUTPUT REQUIREMENTS:
═══════════════════════════════════════════════════════════════
1. Output MUST be valid JSON with NO markdown formatting
   - NO \`\`\`json\`\`\` code blocks, NO explanations, NO comments
   - Return ONLY the JSON object

2. All field keys MUST be lowercase_snake_case (e.g., "product_name", "hs_code")
   - Must start with lowercase letter, use underscores only

3. All section IDs MUST be lowercase_snake_case
   - Required sections: basic_info, specifications, commercial, documents
   - You may add additional sections if relevant to the industry

4. Provide 3-5 fields MINIMUM per section (more is better for comprehensive templates)

5. Version must follow semantic versioning: "1.0.0" format

═══════════════════════════════════════════════════════════════
INDUSTRY CONTEXT:
═══════════════════════════════════════════════════════════════
Industry: ${industryName} (code: ${industryCode})
${orgContext?.orgName ? `Organization: ${orgContext.orgName}` : ''}
${orgContext?.orgDescription ? `Context: ${orgContext.orgDescription}` : ''}

═══════════════════════════════════════════════════════════════
TEMPLATE REQUIREMENTS:
═══════════════════════════════════════════════════════════════
Create a comprehensive JSON schema tailored for the ${industryName} industry.

INCLUDE (but not limited to):

1. Industry-specific fields:
   - Think about what product specifications, composition/assay data, compliance requirements, and technical attributes are relevant to ${industryName}
   - Consider regulatory requirements, certifications, and industry standards
   - Add fields that buyers in this industry typically need to evaluate products

2. Common e-commerce fields (examples - adapt as needed):
   - Price, MOQ (Minimum Order Quantity), lead_time
   - Packaging information
   - Certificates and compliance documents
   - Product images
   NOTE: These are just examples. Include what makes sense for ${industryName}, and add other common fields as appropriate.

3. Field organization:
   - Group fields into logical sections: basic_info, specifications, commercial, documents
   - You may add additional sections if they make sense for this industry
   - Each field must specify all required properties

FIELD STRUCTURE:
Each field must include:
- key: unique lowercase_snake_case identifier (required)
- label: human-readable label (required)
- type: text | number | select | multiselect | textarea | date | file | image | table (required)
- required: true/false (required)
- visibility: public | target_only | after_rfq (required, default: public)
- search_normalize: keyword | numeric | range | hs_code | cas_number | none (default: none)
- unit: string (optional, for fixed units like "USD/kg", "days")
- unit_options: array of strings (optional, for selectable units)
- unit_type: "fixed" | "select" (required if unit_options provided)
- placeholder: example value (optional)
- help: short description (optional)
- options: array of strings (required for select/multiselect types)
- accepted: array of strings (recommended for file/image types)
- validation_rules: object with min, max, regex (optional)

SECTION STRUCTURE:
Required sections (minimum):
- basic_info: Product name, category, description, images (adapt to industry needs)
- specifications: Technical specs, composition, appearance (add industry-specific fields)
- commercial: Price, MOQ, lead time, HS code (add other commercial fields as needed)
- documents: COA, spec sheets, certificates (include relevant document types)

You may add additional sections if they make sense for ${industryName}.

═══════════════════════════════════════════════════════════════
SHORT EXAMPLE (Reference only - adapt to ${industryName}):
═══════════════════════════════════════════════════════════════
{
  "template_id": "${industryCode}_v1",
  "industry": "${industryCode}",
  "version": "1.0.0",
  "sections": [
    {
      "section_id": "basic_info",
      "title": "Basic Info",
      "fields": [
        {
          "key": "product_name",
          "label": "Product Name",
          "type": "text",
          "required": true,
          "visibility": "public",
          "search_normalize": "keyword"
        },
        {
          "key": "category",
          "type": "select",
          "options": ["Option1", "Option2"],
          "required": true,
          "visibility": "public"
        }
      ]
    },
    {
      "section_id": "specifications",
      "title": "Specifications",
      "fields": [
        {
          "key": "composition",
          "type": "number",
          "unit": "%",
          "required": true,
          "visibility": "public",
          "search_normalize": "numeric",
          "validation_rules": { "min": 0, "max": 100 }
        }
      ]
    },
    {
      "section_id": "commercial",
      "title": "Commercial Info",
      "fields": [
        {
          "key": "price",
          "type": "number",
          "unit_options": ["USD/kg", "EUR/kg"],
          "unit_type": "select",
          "required": true,
          "visibility": "target_only"
        },
        {
          "key": "moq",
          "type": "number",
          "unit": "kg",
          "required": true,
          "visibility": "target_only"
        }
      ]
    },
    {
      "section_id": "documents",
      "title": "Documents",
      "fields": [
        {
          "key": "coa",
          "type": "file",
          "accepted": ["pdf", "jpg"],
          "visibility": "after_rfq"
        }
      ]
    }
  ],
  "meta": {
    "source": "AI",
    "generated_at": "${new Date().toISOString()}",
    "industry_context": "${industryName}"
  }
}

NOTE: This is just a structural reference. Adapt fields to ${industryName} industry needs. Include industry-specific fields, appropriate options for select fields, and relevant document types.

═══════════════════════════════════════════════════════════════
VALIDATION CHECKLIST:
═══════════════════════════════════════════════════════════════
Before outputting, verify:
✓ All required fields: product_name, price, moq
✓ All required sections: basic_info, specifications, commercial, documents
✓ All keys are lowercase_snake_case
✓ Select/multiselect fields have "options" array (at least 2 items)
✓ File/image fields have "accepted" array
✓ Number fields have validation_rules where appropriate
✓ Unit: use "unit" for fixed OR "unit_options" + "unit_type" for selectable (NOT both)
✓ All fields have "visibility" and "search_normalize" set
✓ Industry-specific fields relevant to ${industryName}
✓ At least 3-5 fields per section

═══════════════════════════════════════════════════════════════
OUTPUT:
═══════════════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown, no explanations, no code blocks.
Start with { and end with }.`
}

/**
 * Generate template using Azure OpenAI or regular OpenAI
 */
export async function generateIndustryTemplate(
  options: GenerateTemplateOptions
): Promise<TemplateSchema> {
  const prompt = generateTemplatePrompt(options)
  
  // Read env vars at runtime
  const azureConfig = getAzureOpenAIConfig()
  const openAIConfig = getOpenAIConfig()
  
  // Determine which API to use (Azure takes precedence if both are configured)
  const useAzure = !!(azureConfig.apiKey && azureConfig.endpoint)
  
  // Validate Azure OpenAI configuration
  if (useAzure) {
    if (!azureConfig.deployment) {
      throw new Error(
        'Azure OpenAI deployment name is missing. Please set in .env.local:\n' +
        '  - AZURE_OPENAI_DEPLOYMENT or AZURE_OPENAI_DEPLOYMENT_NAME\n' +
        `  - Current values: API_KEY=${!!azureConfig.apiKey}, ENDPOINT=${!!azureConfig.endpoint}, DEPLOYMENT=${!!azureConfig.deployment}`
      )
    }
    
    // Log configuration status for debugging (without exposing sensitive values)
    console.log('[Template Generation] Using Azure OpenAI:', {
      endpoint: azureConfig.endpoint,
      deployment: azureConfig.deployment,
      apiVersion: azureConfig.apiVersion,
      hasApiKey: !!azureConfig.apiKey,
    })
    
    // Validate endpoint format
    if (!azureConfig.endpoint?.includes('openai.azure.com')) {
      console.warn(`[Template Generation] Azure OpenAI endpoint may be invalid: ${azureConfig.endpoint}`)
    }
  } else if (openAIConfig.apiKey) {
    console.log('[Template Generation] Using regular OpenAI:', {
      apiUrl: openAIConfig.apiUrl,
      hasApiKey: !!openAIConfig.apiKey,
    })
  } else {
    // Show what's actually missing
    const missing = []
    if (!azureConfig.apiKey) missing.push('AZURE_OPENAI_API_KEY')
    if (!azureConfig.endpoint) missing.push('AZURE_OPENAI_ENDPOINT')
    if (!openAIConfig.apiKey) missing.push('OPENAI_API_KEY')
    
    throw new Error(
      'OpenAI API configuration missing. Please set in apps/web/.env.local:\n' +
      `  Missing: ${missing.join(', ')}\n` +
      '  - For Azure OpenAI: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT\n' +
      '  - For regular OpenAI: OPENAI_API_KEY'
    )
  }

  try {
    let apiUrl: string
    let headers: Record<string, string>
    let body: any

    if (useAzure) {
      // Azure OpenAI configuration
      apiUrl = `${azureConfig.endpoint}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.apiVersion}`
      headers = {
        'Content-Type': 'application/json',
        'api-key': azureConfig.apiKey!,
      }
      body = {
        messages: [
          {
            role: 'system',
            content: 'You are a JSON schema generator. You MUST return ONLY valid JSON with no markdown formatting, no code blocks, no explanations. Start directly with { and end with }. The JSON must be parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
        max_tokens: 4000,
        response_format: { type: 'json_object' }, // Force JSON output if model supports it
      }
    } else {
      // Regular OpenAI configuration
      apiUrl = openAIConfig.apiUrl
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAIConfig.apiKey}`,
      }
      body = {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a JSON schema generator. You MUST return ONLY valid JSON with no markdown formatting, no code blocks, no explanations. Start directly with { and end with }. The JSON must be parseable.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
        max_tokens: 4000,
        response_format: { type: 'json_object' }, // Force JSON output if model supports it
      }
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.error || errorText
        
        // Provide helpful error messages for common Azure OpenAI issues
        if (useAzure) {
          if (errorMessage.includes('deployment') && errorMessage.includes('does not exist')) {
            errorMessage = `Azure OpenAI deployment '${azureConfig.deployment}' not found. Please check:
1. Deployment name is correct: ${azureConfig.deployment} (from AZURE_OPENAI_DEPLOYMENT in .env.local)
2. Deployment exists in your Azure OpenAI resource
3. Deployment is in the same region as your resource
4. If you just created it, wait a few minutes and try again`
          } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            errorMessage = 'Azure OpenAI API key is invalid or expired. Please check your AZURE_OPENAI_API_KEY in .env.local'
          } else if (errorMessage.includes('404')) {
            errorMessage = `Azure OpenAI endpoint or deployment not found. Check your .env.local:
1. Endpoint URL: ${azureConfig.endpoint}
2. Deployment name: ${azureConfig.deployment}
3. API version: ${azureConfig.apiVersion}`
          }
        }
      } catch {
        errorMessage = errorText
      }
      throw new Error(`${useAzure ? 'Azure OpenAI' : 'OpenAI'} API error: ${errorMessage}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in AI response')
    }

    // Parse JSON with robust error handling
    let jsonContent = content.trim()
    
    // Remove markdown code blocks if present (shouldn't happen with json_object format, but handle it)
    if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
    }
    
    // Remove any leading/trailing whitespace or newlines
    jsonContent = jsonContent.trim()
    
    // Try to find JSON object if there's extra text
    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonContent = jsonMatch[0]
    }

    let parsedJson: any
    try {
      parsedJson = JSON.parse(jsonContent)
    } catch (parseError) {
      console.error('[Template Generation] JSON parse error:', parseError)
      console.error('[Template Generation] Content received:', jsonContent.substring(0, 500))
      throw new Error(`Invalid JSON in AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
    }

    // Validate before normalization
    const validation = validateGeneratedTemplate(parsedJson)
    if (!validation.valid) {
      console.error('[Template Generation] Validation errors:', validation.errors)
      throw new Error(`Generated template failed validation: ${validation.errors.join('; ')}`)
    }

    // Normalize (fixes common issues)
    let normalized: TemplateSchema
    try {
      normalized = normalizeTemplateSchema(parsedJson)
    } catch (normalizeError) {
      console.error('[Template Generation] Normalization error:', normalizeError)
      throw new Error(`Failed to normalize template: ${normalizeError instanceof Error ? normalizeError.message : 'Unknown error'}`)
    }
    
    // Ensure industry matches (template_id is set by database, not in generated template)
    normalized.industry = options.industryCode
    normalized.meta.industry_context = options.industryName
    normalized.meta.generated_at = new Date().toISOString()
    
    // Remove template_id if present - it will be set by the database
    delete normalized.template_id

    // Final validation after normalization
    const finalValidation = validateGeneratedTemplate(normalized)
    if (!finalValidation.valid) {
      console.error('[Template Generation] Post-normalization validation errors:', finalValidation.errors)
      // Log but don't fail - normalization should have fixed issues
      console.warn('[Template Generation] Continuing with template despite validation warnings')
    }

    return normalized
  } catch (error) {
    console.error('[Template Generation] Error:', error)
    
    // Re-throw API errors as-is with helpful context
    if (error instanceof Error && error.message.includes('API error')) {
      throw error
    }
    throw new Error(
      `Failed to generate template: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

