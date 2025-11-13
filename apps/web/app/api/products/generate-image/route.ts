import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateProductImage, base64ToFile } from '@/lib/image-generation/service'
import { generateFoodSupplementImagePrompt, canGenerateProductImage } from '@/lib/industries/food-supplement/image-prompts'

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

    // Convert base64 to File and upload to Supabase storage
    const filename = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
    const imageFile = base64ToFile(result.data.b64_json, filename, 'image/png')

    // Upload to Supabase storage
    const storagePath = `${user.id}/products/${filename}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, imageFile, {
        contentType: 'image/png',
        upsert: false,
      })

    if (uploadError) {
      console.error('[Generate Image] Upload error:', uploadError)
      
      // If bucket doesn't exist, return base64 data for frontend to handle
      if (uploadError.message?.includes('not found')) {
        console.log('[Generate Image] Storage bucket not found, returning base64 data')
        return NextResponse.json({
          success: true,
          image: {
            b64_json: result.data.b64_json,
            filename,
            revised_prompt: result.data.revised_prompt,
          },
          message: 'Image generated successfully (storage not configured)'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath)

    console.log('[Generate Image] Image generated and uploaded successfully:', publicUrl)

    return NextResponse.json({
      success: true,
      image: {
        url: publicUrl,
        filename,
        storagePath,
        revised_prompt: result.data.revised_prompt,
      }
    })
  } catch (error) {
    console.error('[Generate Image] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

