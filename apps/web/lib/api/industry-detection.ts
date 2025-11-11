/**
 * AI Industry Detection
 * Detects the most suitable industry for a product based on product name and context
 */

/**
 * Get Azure OpenAI configuration from .env.local
 */
function getAzureOpenAIConfig() {
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT
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

interface DetectIndustryOptions {
  productName: string
  orgContext?: {
    orgName?: string
    orgIndustry?: string
    orgDescription?: string
  }
  availableIndustries: Array<{
    industry_code: string
    industry_name: string
  }>
}

/**
 * Detect the most suitable industry for a product using AI
 */
export async function detectProductIndustry(
  options: DetectIndustryOptions
): Promise<string> {
  const { productName, orgContext, availableIndustries } = options

  // Build industry list for AI
  const industryList = availableIndustries
    .map((ind) => `- ${ind.industry_code}: ${ind.industry_name}`)
    .join('\n')

  const prompt = `You are an AI assistant that determines the most suitable industry classification for products in a B2B marketplace.

Product Name: "${productName}"
${orgContext?.orgName ? `Organization: ${orgContext.orgName}` : ''}
${orgContext?.orgDescription ? `Organization Description: ${orgContext.orgDescription}` : ''}
${orgContext?.orgIndustry ? `Organization's Primary Industry (hint, but product may be different): ${orgContext.orgIndustry}` : ''}

Available Industries:
${industryList}

Task: Analyze the product name and determine which industry code best fits this product. Consider:
1. The product's primary use case and application
2. The product category and type
3. Industry standards and classifications
4. The organization's context (if provided) as a hint, but prioritize the product itself

IMPORTANT:
- Return ONLY the industry_code (e.g., "supplements_food_ingredients") 
- Do NOT include any explanation, markdown, or additional text
- Return the exact industry_code as it appears in the list above
- If the product could fit multiple industries, choose the most specific/appropriate one

Industry Code:`

  // Read env vars at runtime
  const azureConfig = getAzureOpenAIConfig()
  const openAIConfig = getOpenAIConfig()

  // Determine which API to use (Azure takes precedence if both are configured)
  const useAzure = !!(azureConfig.apiKey && azureConfig.endpoint)

  if (!useAzure && !openAIConfig.apiKey) {
    throw new Error(
      'OpenAI API configuration missing. Please set in .env.local:\n' +
      '  - For Azure OpenAI: AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT\n' +
      '  - For regular OpenAI: OPENAI_API_KEY'
    )
  }

  try {
    let apiUrl: string
    let headers: Record<string, string>
    let body: any

    if (useAzure) {
      if (!azureConfig.deployment) {
        throw new Error('Azure OpenAI deployment name is missing')
      }

      apiUrl = `${azureConfig.endpoint}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.apiVersion}`
      headers = {
        'Content-Type': 'application/json',
        'api-key': azureConfig.apiKey!,
      }
      body = {
        messages: [
          {
            role: 'system',
            content: 'You are an industry classification assistant. Return ONLY the industry code, no explanations, no markdown, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
      }
    } else {
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
            content: 'You are an industry classification assistant. Return ONLY the industry code, no explanations, no markdown, no additional text.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 50,
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
      } catch {
        errorMessage = errorText
      }
      throw new Error(`${useAzure ? 'Azure OpenAI' : 'OpenAI'} API error: ${errorMessage}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content?.trim()

    if (!content) {
      throw new Error('No content in AI response')
    }

    // Extract industry code (remove any markdown, quotes, etc.)
    let industryCode = content
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/\n?```$/i, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    // Validate that the industry code exists in available industries
    const isValid = availableIndustries.some(
      (ind) => ind.industry_code === industryCode
    )

    if (!isValid) {
      console.warn(
        `[Industry Detection] AI returned invalid industry code: ${industryCode}. Available: ${availableIndustries.map((i) => i.industry_code).join(', ')}`
      )
      // Fallback: try to find a match by partial string
      const partialMatch = availableIndustries.find((ind) =>
        industryCode.toLowerCase().includes(ind.industry_code.toLowerCase()) ||
        ind.industry_code.toLowerCase().includes(industryCode.toLowerCase())
      )
      
      if (partialMatch) {
        industryCode = partialMatch.industry_code
        console.log(`[Industry Detection] Using partial match: ${industryCode}`)
      } else {
        // Last resort: use org industry if available, otherwise first available
        if (orgContext?.orgIndustry) {
          const orgIndustryMatch = availableIndustries.find(
            (ind) => ind.industry_code === orgContext.orgIndustry
          )
          if (orgIndustryMatch) {
            industryCode = orgIndustryMatch.industry_code
            console.log(`[Industry Detection] Falling back to org industry: ${industryCode}`)
          } else {
            industryCode = availableIndustries[0]?.industry_code
            console.log(`[Industry Detection] Using first available industry: ${industryCode}`)
          }
        } else {
          industryCode = availableIndustries[0]?.industry_code
          console.log(`[Industry Detection] Using first available industry: ${industryCode}`)
        }
      }
    }

    return industryCode
  } catch (error) {
    console.error('[Industry Detection] Error:', error)
    
    // Fallback: use org industry if available
    if (orgContext?.orgIndustry) {
      const orgIndustryMatch = availableIndustries.find(
        (ind) => ind.industry_code === orgContext.orgIndustry
      )
      if (orgIndustryMatch) {
        console.log(`[Industry Detection] Error fallback to org industry: ${orgIndustryMatch.industry_code}`)
        return orgIndustryMatch.industry_code
      }
    }
    
    // Last resort: use first available industry
    if (availableIndustries.length > 0) {
      console.log(`[Industry Detection] Error fallback to first industry: ${availableIndustries[0].industry_code}`)
      return availableIndustries[0].industry_code
    }
    
    throw new Error(
      `Failed to detect industry: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

