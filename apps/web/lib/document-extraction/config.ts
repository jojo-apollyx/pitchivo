/**
 * Azure OpenAI Configuration
 * Centralized configuration for document extraction
 */

export interface AzureOpenAIConfig {
  resourceName: string
  apiKey: string
  visionDeployment: string
  apiVersion?: string
}

/**
 * Get Azure OpenAI configuration from environment variables
 */
export function getAzureOpenAIConfig(): AzureOpenAIConfig {
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME
  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const visionDeployment = process.env.AZURE_OPENAI_VISION_DEPLOYMENT
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'

  if (!resourceName) {
    throw new Error(
      'AZURE_OPENAI_RESOURCE_NAME is required. Please set it in .env.local'
    )
  }

  if (!apiKey) {
    throw new Error(
      'AZURE_OPENAI_API_KEY is required. Please set it in .env.local'
    )
  }

  if (!visionDeployment) {
    throw new Error(
      'AZURE_OPENAI_VISION_DEPLOYMENT is required for document extraction. ' +
      'Document extraction requires a vision-capable model. ' +
      'Please set AZURE_OPENAI_VISION_DEPLOYMENT in .env.local to a vision-capable deployment name. ' +
      'Supported models: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-4-vision-preview'
    )
  }

  return {
    resourceName,
    apiKey,
    visionDeployment,
    apiVersion
  }
}

