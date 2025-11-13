/**
 * Shared Image Generation Service
 * 
 * Handles AI-powered product image generation using Azure Flux.1
 */

import { AzureOpenAI } from 'openai'

export interface ImageGenerationOptions {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  n?: number // number of images to generate
}

export interface ImageGenerationResult {
  url?: string
  b64_json?: string
  revised_prompt?: string
}

/**
 * Generate product image using Azure Flux.1
 */
export async function generateProductImage(
  options: ImageGenerationOptions
): Promise<{ success: boolean; data?: ImageGenerationResult; error?: string }> {
  try {
    // Support custom endpoint format (services.ai.azure.com) or default (openai.azure.com)
    const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME
    const customEndpoint = process.env.AZURE_OPENAI_IMAGE_ENDPOINT
    const azureEndpoint = customEndpoint || `https://${resourceName}.services.ai.azure.com`
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY
    const fluxDeploymentName = process.env.AZURE_FLUX_DEPLOYMENT || 'flux-1-knotext-prod'
    const apiVersion = process.env.AZURE_OPENAI_IMAGE_API_VERSION || '2025-04-01-preview'

    if (!azureApiKey || !resourceName) {
      return {
        success: false,
        error: 'Azure OpenAI configuration is missing'
      }
    }

    // Initialize Azure OpenAI client
    const client = new AzureOpenAI({
      apiKey: azureApiKey,
      endpoint: azureEndpoint,
      apiVersion: apiVersion, // API version for image generation
      deployment: fluxDeploymentName, // Set deployment at client level for Azure
    })

    console.log(`[Image Generation] Generating image with deployment: ${fluxDeploymentName}`)
    console.log(`[Image Generation] Prompt: ${options.prompt.substring(0, 100)}...`)

    // Generate image
    // Note: Flux models may not support all DALL-E parameters (quality, style)
    // We try with all parameters first, and can fall back to basic params if needed
    const generateParams: any = {
      prompt: options.prompt,
      n: options.n || 1,
      size: options.size || '1024x1024',
      response_format: 'b64_json', // Get base64 to upload to storage
      model: '', // Empty string for Azure (deployment is set at client level)
    }

    // Add optional parameters that may not be supported by all models
    if (options.quality) {
      generateParams.quality = options.quality
    }
    if (options.style) {
      generateParams.style = options.style
    }

    const response = await client.images.generate(generateParams)

    if (!response.data || response.data.length === 0) {
      return {
        success: false,
        error: 'No image generated'
      }
    }

    const imageData = response.data[0]
    
    return {
      success: true,
      data: {
        b64_json: imageData.b64_json,
        url: imageData.url,
        revised_prompt: imageData.revised_prompt,
      }
    }
  } catch (error) {
    console.error('[Image Generation] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    }
  }
}

/**
 * Convert base64 image to File object
 */
export function base64ToFile(base64: string, filename: string, mimeType: string = 'image/png'): File {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  
  // Convert base64 to binary
  const binaryString = atob(base64Data)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Create Blob and then File
  const blob = new Blob([bytes], { type: mimeType })
  return new File([blob], filename, { type: mimeType })
}

