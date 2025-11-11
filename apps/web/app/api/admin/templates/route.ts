import { withApiHandler } from '@/lib/impersonation'
import { z } from 'zod'

// Schema for updating template
const updateTemplateSchema = z.object({
  template_id: z.string().uuid(),
  schema_json: z.any(), // TemplateSchema
  version: z.string().optional(),
  template_name: z.string().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
})

/**
 * GET /api/admin/templates
 * Get all product templates (admin only)
 */
export const GET = withApiHandler(
  '/api/admin/templates',
  'GET',
  'list_all_templates',
  async ({ context, supabase }) => {
    // Check admin status
    if (!context.isAdmin) {
      throw new Error('Admin access required')
    }

    // Get all templates with industry info
    const { data: templates, error } = await supabase
      .from('product_templates')
      .select(`
        template_id,
        industry_code,
        template_name,
        schema_json,
        version,
        is_active,
        is_default,
        created_at,
        updated_at,
        industries:industry_code (
          industry_name,
          description
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    return {
      templates: templates || [],
    }
  },
  { requireAdmin: true }
)

/**
 * PUT /api/admin/templates
 * Update a product template (admin only)
 */
export const PUT = withApiHandler(
  '/api/admin/templates',
  'PUT',
  'update_template',
  async ({ context, supabase, request }) => {
    // Check admin status
    if (!context.isAdmin) {
      throw new Error('Admin access required')
    }

    const body = await request.json()
    const validated = updateTemplateSchema.parse(body)

    // Update template
    const { data: updatedTemplate, error } = await supabase
      .from('product_templates')
      .update({
        schema_json: validated.schema_json,
        version: validated.version,
        template_name: validated.template_name,
        is_active: validated.is_active,
        is_default: validated.is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('template_id', validated.template_id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update template: ${error.message}`)
    }

    return {
      template: updatedTemplate,
    }
  },
  { requireAdmin: true }
)

