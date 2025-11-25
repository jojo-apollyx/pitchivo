import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProductImage } from '@/lib/image-generation/service'
import { generateFoodSupplementImagePrompt, canGenerateProductImage } from '@/lib/industries/food-supplement/image-prompts'
import { uploadBase64ProductImageToAzure } from '@/lib/azure-storage/product-images'

/**
 * POST /api/products/generate-image
 * 
 * Generate AI product image based on product data
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

    const body = await request.json()
    const { productData, industryCode } = body

    if (!productData) {
      return NextResponse.json(
        { error: 'Product data is required' },
        { status: 400 }
      )
    }

    // Validate that product has enough data for image generation
    const validation = canGenerateProductImage(productData)
    if (!validation.canGenerate) {
      return NextResponse.json(
        { 
          error: 'Insufficient product data for image generation',
          missingFields: validation.missingFields
        },
        { status: 400 }
      )
    }

    // Generate industry-specific prompt
    let prompt: string
    
    // Route to appropriate prompt generator based on industry
    if (industryCode === 'food_supplement' || !industryCode) {
      prompt = generateFoodSupplementImagePrompt({
        product_name: productData.product_name,
        description: productData.description,
        category: productData.category,
        form: productData.form,
        grade: productData.grade,
        appearance: productData.appearance,
        applications: productData.applications,
      })
    } else {
      // Fallback to generic prompt for other industries
      prompt = `Professional product photography of ${productData.product_name}. 
        High quality, clean white background, studio lighting, commercial photography style.`
    }

    console.log('[Generate Image] Starting image generation for:', productData.product_name)

    // Generate image using Azure Flux
    const result = await generateProductImage({
      prompt,
      size: '1024x1024', // Square format for product images
      quality: 'hd',
      style: 'vivid',
      n: 1,
    })

    if (!result.success || !result.data?.b64_json) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Upload to Azure Blob Storage
    const filename = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    
    try {
      const publicUrl = await uploadBase64ProductImageToAzure(
        result.data.b64_json,
        filename,
        'image/png',
        user.id
      )

      console.log('[Generate Image] Image generated and uploaded to Azure Blob Storage:', publicUrl)

      return NextResponse.json({
        success: true,
        image: {
          url: publicUrl,
          filename,
          revised_prompt: result.data.revised_prompt,
        }
      })
    } catch (uploadError: any) {
      console.error('[Generate Image] Azure upload error:', uploadError)
      
      // If Azure storage is not configured, return base64 data for frontend to handle
      if (uploadError.message?.includes('Azure Storage credentials')) {
        console.log('[Generate Image] Azure Storage not configured, returning base64 data')
        return NextResponse.json({
          success: true,
          image: {
            b64_json: result.data.b64_json,
            filename,
            revised_prompt: result.data.revised_prompt,
          },
          message: 'Image generated successfully (Azure Storage not configured)'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to upload image to Azure Storage', details: uploadError.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[Generate Image] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

