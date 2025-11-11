import { withApiHandler } from '@/lib/impersonation'
import { z } from 'zod'
import { generateIndustryTemplate } from '@/lib/api/template-generation'
import { validateGeneratedTemplate } from '@/lib/api/template-validation'

// Request schema
const getTemplateRequestSchema = z.object({
  product_name_raw: z.string().min(1, 'Product name is required'),
  org_id: z.string().uuid('Invalid organization ID'),
})

/**
 * GET /api/templates
 * Get or generate product template for organization's industry
 * 
 * Flow:
 * 1. Get organization info (industry_code)
 * 2. Check if template exists in database
 * 3. If not, generate with AI
 * 4. Save template to database
 * 5. Return template
 */
export const GET = withApiHandler(
  '/api/templates',
  'GET',
  'get_product_template',
  async ({ context, supabase, request }) => {
    // Parse query parameters
    const url = new URL(request.url)
    const productNameRaw = url.searchParams.get('product_name_raw')
    const orgId = url.searchParams.get('org_id') || context.organizationId

    if (!productNameRaw) {
      throw new Error('product_name_raw is required')
    }

    if (!orgId) {
      throw new Error('org_id is required')
    }

    // Validate input
    getTemplateRequestSchema.parse({
      product_name_raw: productNameRaw,
      org_id: orgId,
    })

    // Get organization info
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, industry, description')
      .eq('id', orgId)
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

    // Step 2: Check if template exists
    const { data: existingTemplate, error: templateError } = await supabase
      .from('product_templates')
      .select('template_id, industry_code, schema_json, version, template_name, is_default')
      .eq('industry_code', industryCode)
      .eq('is_active', true)
      .order('is_default', { ascending: false }) // Prefer default template
      .order('created_at', { ascending: false }) // Then newest
      .limit(1)
      .maybeSingle()

    if (templateError && templateError.code !== 'PGRST116') {
      // PGRST116 is "not found" which is fine
      throw new Error(`Failed to check templates: ${templateError.message}`)
    }

    // Step 3: If template exists, return it
    if (existingTemplate) {
      // Validate the stored template
      const validation = validateGeneratedTemplate(existingTemplate.schema_json)
      if (!validation.valid) {
        console.warn(`[Template] Stored template ${existingTemplate.template_id} has validation errors:`, validation.errors)
        // Continue anyway, but log the issue
      }

      return {
        template: existingTemplate.schema_json,
        template_id: existingTemplate.template_id,
        version: existingTemplate.version,
        source: 'database',
        industry_code: industryCode,
      }
    }

    // Step 4: Generate new template with AI
    console.log(`[Template] Generating new template for industry: ${industryCode}`)
    
    const generatedTemplate = await generateIndustryTemplate({
      industryCode,
      industryName: industry.industry_name,
      orgContext: {
        orgName: org.name,
        orgDescription: org.description || undefined,
      },
    })

    // Step 5: Save template to database
    // Note: template_id is UUID, let database generate it
    // The template_id in schema_json is just for reference
    const { data: savedTemplate, error: saveError } = await supabase
      .from('product_templates')
      .insert({
        industry_code: industryCode,
        template_name: `Default ${industry.industry_name} Template`,
        schema_json: generatedTemplate,
        version: generatedTemplate.version,
        is_active: true,
        is_default: true, // First template for industry is default
      })
      .select()
      .single()

    if (saveError) {
      // If save fails, still return the template (it was generated successfully)
      console.error('[Template] Failed to save template:', saveError)
      return {
        template: generatedTemplate,
        template_id: generatedTemplate.template_id, // Use the ID from schema
        version: generatedTemplate.version,
        source: 'ai_generated',
        industry_code: industryCode,
        warning: 'Template generated but not saved to database',
      }
    }

    return {
      template: {
        ...generatedTemplate,
        template_id: savedTemplate.template_id, // Update with actual UUID
      },
      template_id: savedTemplate.template_id,
      version: savedTemplate.version,
      source: 'ai_generated_and_saved',
      industry_code: industryCode,
    }
  },
  { requireOrg: false } // Allow org_id in query params
)

/**
 * POST /api/templates
 * Create or update a product template manually
 */
export const POST = withApiHandler(
  '/api/templates',
  'POST',
  'create_product_template',
  async ({ context, supabase, request }) => {
    const body = await request.json()
    
    const createTemplateSchema = z.object({
      industry_code: z.string().min(1),
      template_name: z.string().optional(),
      schema_json: z.any(), // Will be validated
      version: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
      is_default: z.boolean().optional().default(false),
    })

    const validated = createTemplateSchema.parse(body)

    // Validate the schema_json
    const validation = validateGeneratedTemplate(validated.schema_json)
    if (!validation.valid) {
      throw new Error(`Invalid template schema: ${validation.errors.join('; ')}`)
    }

    // Check if industry exists
    const { data: industry, error: industryError } = await supabase
      .from('industries')
      .select('industry_code')
      .eq('industry_code', validated.industry_code)
      .eq('is_enabled', true)
      .single()

    if (industryError || !industry) {
      throw new Error(`Industry ${validated.industry_code} not found or disabled`)
    }

    // If setting as default, unset other defaults for this industry
    if (validated.is_default) {
      await supabase
        .from('product_templates')
        .update({ is_default: false })
        .eq('industry_code', validated.industry_code)
        .eq('is_active', true)
    }

    // Insert template
    const { data: template, error: insertError } = await supabase
      .from('product_templates')
      .insert({
        industry_code: validated.industry_code,
        template_name: validated.template_name || `Custom ${validated.industry_code} Template`,
        schema_json: validated.schema_json,
        version: validated.version || '1.0.0',
        is_active: true,
        is_default: validated.is_default,
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create template: ${insertError.message}`)
    }

    return {
      template: template.schema_json,
      template_id: template.template_id,
      version: template.version,
      source: 'manual',
    }
  },
  { requireOrg: false }
)

