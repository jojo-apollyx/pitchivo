/**
 * Food Supplement & Ingredients Image Generation Prompts
 * 
 * Industry-specific prompt templates for AI image generation
 */

export interface ProductImagePromptData {
  product_name: string
  description?: string
  category?: string
  form?: string
  grade?: string
  appearance?: string
  applications?: string[]
}

/**
 * Generate a detailed prompt for food supplement product images
 */
export function generateFoodSupplementImagePrompt(data: ProductImagePromptData): string {
  const {
    product_name,
    description,
    category,
    form,
    grade,
    appearance,
    applications
  } = data

  // Base prompt template for food supplement products
  let prompt = `Professional, high-quality product photography of ${product_name}, a food supplement ingredient. `

  // Add physical form details
  if (form) {
    const formDescriptions: Record<string, string> = {
      'Powder': 'fine powder in a clean glass container',
      'Granule': 'granular form displayed in a measuring scoop',
      'Liquid': 'clear liquid in a glass bottle or beaker',
      'Capsule': 'capsules arranged neatly',
      'Tablet': 'tablets arranged in organized rows',
      'Extract': 'concentrated extract in a small glass vial',
      'Oil': 'golden oil in a transparent bottle',
      'Cream': 'smooth cream in a pharmaceutical jar',
      'Gel': 'clear gel in a petri dish or container',
    }
    prompt += formDescriptions[form] || `${form.toLowerCase()} form in a professional container`
    prompt += '. '
  }

  // Add appearance details if available
  if (appearance) {
    prompt += `The product has a ${appearance.toLowerCase()} appearance. `
  }

  // Add category context
  if (category) {
    const categoryContext: Record<string, string> = {
      'Vitamins': 'pharmaceutical-grade quality',
      'Minerals': 'pure mineral supplement',
      'Amino Acids': 'biochemical purity',
      'Herbal Extracts': 'natural botanical extract',
      'Probiotics': 'living culture supplement',
      'Enzymes': 'bioactive enzyme preparation',
      'Antioxidants': 'protective antioxidant compound',
      'Proteins': 'high-quality protein source',
      'Omega Fatty Acids': 'essential fatty acid supplement',
    }
    if (categoryContext[category]) {
      prompt += `Emphasize ${categoryContext[category]}. `
    }
  }

  // Add application context
  if (applications && applications.length > 0) {
    const primaryApp = applications[0]
    const appContext: Record<string, string> = {
      'Dietary Supplements': 'for nutritional supplementation',
      'Functional Foods': 'for fortified food products',
      'Beverages': 'for beverage formulations',
      'Sports Nutrition': 'for athletic performance',
      'Pharmaceuticals': 'for pharmaceutical applications',
      'Cosmetics': 'for cosmetic formulations',
      'Animal Feed': 'for animal nutrition',
    }
    if (appContext[primaryApp]) {
      prompt += `Suitable ${appContext[primaryApp]}. `
    }
  }

  // Add description context if available
  if (description && description.length > 20) {
    // Extract key descriptive terms
    const descriptiveTerms = description.toLowerCase()
    if (descriptiveTerms.includes('pure') || descriptiveTerms.includes('high purity')) {
      prompt += 'Emphasize exceptional purity and quality. '
    }
    if (descriptiveTerms.includes('organic') || descriptiveTerms.includes('natural')) {
      prompt += 'Highlight natural and organic qualities. '
    }
    if (descriptiveTerms.includes('premium') || descriptiveTerms.includes('high quality')) {
      prompt += 'Convey premium quality. '
    }
  }

  // Standard style requirements for all food supplement products
  prompt += `
Professional studio lighting with clean white or light gray background. 
Sharp focus, high resolution, pharmaceutical-grade presentation.
Clean, minimal composition emphasizing product purity and quality.
No text, labels, or branding visible.
Photorealistic, commercial product photography style.
Professional, trustworthy, and scientific aesthetic.
Ideal for B2B ingredient suppliers and manufacturers.`

  return prompt.trim()
}

/**
 * Validate that product has minimum required data for image generation
 */
export function canGenerateProductImage(data: Partial<ProductImagePromptData>): {
  canGenerate: boolean
  missingFields: string[]
} {
  const missingFields: string[] = []

  if (!data.product_name || data.product_name.trim().length < 3) {
    missingFields.push('Product Name')
  }

  // At least one of these should be present for context
  const hasContext = data.description || data.category || data.form || data.appearance
  if (!hasContext) {
    missingFields.push('Product Details (description, category, form, or appearance)')
  }

  return {
    canGenerate: missingFields.length === 0,
    missingFields
  }
}

