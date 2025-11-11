import { withApiHandler } from '@/lib/impersonation'
import { productsResponseSchema, createProductSchema, createProductInitSchema, productSchema, createProductWithTemplateResponseSchema, templateResponseSchema } from '@/lib/api/schemas'
import { generateIndustryTemplate } from '@/lib/api/template-generation'
import { validateGeneratedTemplate } from '@/lib/api/template-validation'

/**
 * EXAMPLE: Get products for current user's organization
 * Automatically supports impersonation + Zod validation
 */
export const GET = withApiHandler(
  '/api/products',
  'GET',
  'list_products',
  async ({ context, supabase }) => {
    // Query automatically scoped to effective organization (impersonated if applicable)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('org_id', context.organizationId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    // Validate response with Zod
    const response = {
      products: data || [],
      context: {
        isImpersonating: context.isImpersonating,
        organizationId: context.organizationId,
      },
    }
    
    return productsResponseSchema.parse(response) // Zod validation ensures type safety
  },
  { requireOrg: true }
)

/**
 * Create a product for current user's organization
 * Flow:
 * 1. If product_name_raw provided, get/generate template and return it
 * 2. If full product data provided, create product with template
 */
export const POST = withApiHandler(
  '/api/products',
  'POST',
  'create_product',
  async ({ context, supabase, request }) => {
    const rawBody = await request.json()
    
    // Check if this is initial request (just product name) or full product creation
    if (rawBody.product_name_raw && !rawBody.product_name) {
      // Step 1: Get or generate template
      const initInput = createProductInitSchema.parse(rawBody)
      
      // Get organization info
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, industry, description')
        .eq('id', context.organizationId)
        .single()

      if (orgError || !org) {
        throw new Error('Organization not found')
      }

      if (!org.industry) {
        throw new Error('Organization does not have an industry set')
      }

      const industryCode = org.industry

      // Get industry details
      const { data: industry, error: industryError } = await supabase
        .from('industries')
        .select('industry_code, industry_name, description')
        .eq('industry_code', industryCode)
        .eq('is_enabled', true)
        .single()

      if (industryError || !industry) {
        throw new Error(`Industry ${industryCode} not found or disabled`)
      }

      // Check if template exists
      const { data: existingTemplate, error: templateError } = await supabase
        .from('product_templates')
        .select('template_id, industry_code, schema_json, version, template_name, is_default')
        .eq('industry_code', industryCode)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (templateError && templateError.code !== 'PGRST116') {
        throw new Error(`Failed to check templates: ${templateError.message}`)
      }

      let template: any
      let templateId: string
      let templateVersion: string

      if (existingTemplate) {
        template = existingTemplate.schema_json
        templateId = existingTemplate.template_id
        templateVersion = existingTemplate.version || '1.0.0'
      } else {
        // Generate new template
        const generatedTemplate = await generateIndustryTemplate({
          industryCode,
          industryName: industry.industry_name,
          orgContext: {
            orgName: org.name,
            orgDescription: org.description || undefined,
          },
        })

        // Save template
        const { data: savedTemplate, error: saveError } = await supabase
          .from('product_templates')
          .insert({
            industry_code: industryCode,
            template_name: `Default ${industry.industry_name} Template`,
            schema_json: generatedTemplate,
            version: generatedTemplate.version,
            is_active: true,
            is_default: true,
          })
          .select()
          .single()

        if (saveError) {
          console.error('[Product Creation] Failed to save template:', saveError)
          throw new Error(`Failed to save generated template: ${saveError.message}`)
        }
        
        // Template saved successfully
        template = generatedTemplate
        templateId = savedTemplate.template_id // UUID from database
        templateVersion = savedTemplate.version || generatedTemplate.version
      }

      // Return template response matching TemplateResponse schema
      const templateResponse = {
        template,
        template_id: templateId,
        version: templateVersion,
        source: existingTemplate ? 'database' : 'ai_generated_and_saved',
        industry_code: industryCode,
        industry_name: industry.industry_name,
      }
      
      // Validate response with Zod
      return templateResponseSchema.parse(templateResponse)
    }

    // Step 2: Create product with full data
    const validatedInput = createProductSchema.parse(rawBody)
    
    // Get organization to get industry_code if not provided
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('industry')
      .eq('id', context.organizationId)
      .single()

    if (orgError || !org) {
      throw new Error('Organization not found')
    }

    const industryCode = validatedInput.industry_code || org.industry
    if (!industryCode) {
      throw new Error('Industry code is required')
    }

    // Get template if template_id provided, to get template_version_snapshot
    let templateVersionSnapshot = validatedInput.template_version_snapshot
    let templateId = validatedInput.template_id

    if (templateId && !templateVersionSnapshot) {
      const { data: templateData, error: templateErr } = await supabase
        .from('product_templates')
        .select('schema_json')
        .eq('template_id', templateId)
        .single()

      if (!templateErr && templateData) {
        templateVersionSnapshot = templateData.schema_json
      }
    }

    // Create product
    const { data: product, error: insertError } = await supabase
      .from('products')
      .insert({
        org_id: context.organizationId,
        product_name: validatedInput.product_name,
        industry_code: industryCode,
        template_id: templateId || null,
        template_version_snapshot: templateVersionSnapshot || null,
        status: validatedInput.status || 'draft',
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Validate response
    const validatedProduct = productSchema.parse(product)

    // Get template for response
    let template: any = null
    if (templateId) {
      const { data: templateData } = await supabase
        .from('product_templates')
        .select('schema_json')
        .eq('template_id', templateId)
        .single()
      template = templateData?.schema_json || null
    }

    return createProductWithTemplateResponseSchema.parse({
      product: validatedProduct,
      template,
      template_id: templateId || '',
      context: {
        isImpersonating: context.isImpersonating,
      },
    })
  },
  { requireOrg: true }
)

