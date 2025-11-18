/**
 * Organization Field Filtering for Public Exposure
 * 
 * SECURITY PRINCIPLE: Never expose internal organization data to public/anonymous users.
 * Only select explicitly allowed fields when querying for public contexts.
 */

/**
 * Fields safe for public exposure (SEO, public pages)
 * These are fields that can be shown to anonymous users / search engines
 */
export const PUBLIC_ORG_FIELDS = [
  'id',
  'name',
  'domain',
  'logo_url',
  'pitchivo_domain',
] as const

/**
 * Fields safe for public branding/theming
 * Includes visual/branding elements
 */
export const PUBLIC_ORG_BRANDING_FIELDS = [
  ...PUBLIC_ORG_FIELDS,
  'primary_color',
  'secondary_color',
  'accent_color',
] as const

/**
 * Fields that MAY be public depending on merchant settings
 * These could be made configurable per-organization in the future
 */
export const OPTIONAL_PUBLIC_ORG_FIELDS = [
  'industry',
  'description',
] as const

/**
 * SENSITIVE fields that should NEVER be exposed publicly
 * These are for internal/authenticated use only
 */
const SENSITIVE_ORG_FIELDS = [
  'settings',               // Internal JSON settings
  'onboarding_completed_at',// Internal state
  'company_size',           // Internal/sensitive
  'use_cases',              // Internal
  'is_test',                // Internal flag
  'created_at',             // Internal timestamp
  'updated_at',             // Internal timestamp
] as const

/**
 * Get organization fields for public SEO/metadata contexts
 * 
 * @returns Comma-separated list of fields safe for SEO
 * 
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('organizations')
 *   .select(getPublicOrgFields())
 *   .eq('id', orgId)
 *   .single()
 * ```
 */
export function getPublicOrgFields(): string {
  return PUBLIC_ORG_FIELDS.join(', ')
}

/**
 * Get organization fields for public branding contexts
 * Includes colors for theming
 * 
 * @returns Comma-separated list of fields safe for public branding
 * 
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('organizations')
 *   .select(getPublicOrgBrandingFields())
 *   .eq('id', orgId)
 *   .single()
 * ```
 */
export function getPublicOrgBrandingFields(): string {
  return PUBLIC_ORG_BRANDING_FIELDS.join(', ')
}

/**
 * Filter organization object to only include public fields
 * Use this when you've queried with admin client and need to return to client
 * 
 * @param org - Full organization object from database
 * @param includeOptional - Whether to include optional fields (industry, description)
 * @returns Filtered organization object with only public fields
 * 
 * @example
 * ```typescript
 * // When using admin client in public endpoint
 * const { data: fullOrg } = await supabaseAdmin
 *   .from('organizations')
 *   .select('*')
 *   .eq('id', orgId)
 *   .single()
 * 
 * const safeOrg = filterOrgForPublic(fullOrg)
 * return NextResponse.json({ organization: safeOrg })
 * ```
 */
export function filterOrgForPublic(
  org: any,
  includeOptional: boolean = false
): any {
  if (!org) return null

  const allowedFields = includeOptional
    ? [...PUBLIC_ORG_BRANDING_FIELDS, ...OPTIONAL_PUBLIC_ORG_FIELDS]
    : PUBLIC_ORG_BRANDING_FIELDS

  const filtered: any = {}
  for (const field of allowedFields) {
    if (field in org) {
      filtered[field] = org[field]
    }
  }

  return filtered
}

/**
 * Validate that SELECT query only includes safe fields
 * Throws error if sensitive fields are detected
 * 
 * @param selectString - The select string to validate
 * @throws Error if sensitive fields are detected
 * 
 * @example
 * ```typescript
 * const fields = 'id, name, domain, settings' // ❌ Contains 'settings'
 * validatePublicOrgSelect(fields) // Throws error
 * ```
 */
export function validatePublicOrgSelect(selectString: string): void {
  const selectedFields = selectString
    .split(',')
    .map(f => f.trim())
    .filter(f => f !== '*') // '*' is always invalid for public

  if (selectedFields.includes('*')) {
    throw new Error(
      'SECURITY: Cannot select * on organizations in public context. Use getPublicOrgFields() or getPublicOrgBrandingFields().'
    )
  }

  for (const field of selectedFields) {
    if (SENSITIVE_ORG_FIELDS.includes(field as any)) {
      throw new Error(
        `SECURITY: Cannot select sensitive field '${field}' on organizations in public context. Allowed fields: ${PUBLIC_ORG_BRANDING_FIELDS.join(', ')}`
      )
    }
  }
}

/**
 * Example usage patterns:
 * 
 * // ✅ CORRECT: Using field constants
 * const { data: org } = await supabaseAdmin
 *   .from('organizations')
 *   .select(getPublicOrgBrandingFields())
 *   .eq('id', orgId)
 *   .single()
 * 
 * // ✅ CORRECT: Manual selection of safe fields
 * const { data: org } = await supabaseAdmin
 *   .from('organizations')
 *   .select('id, name, domain')
 *   .eq('id', orgId)
 *   .single()
 * 
 * // ❌ WRONG: Selecting all fields
 * const { data: org } = await supabaseAdmin
 *   .from('organizations')
 *   .select('*')  // Exposes sensitive fields!
 *   .eq('id', orgId)
 *   .single()
 * 
 * // ❌ WRONG: Selecting sensitive fields
 * const { data: org } = await supabaseAdmin
 *   .from('organizations')
 *   .select('id, name, settings, onboarding_completed_at')  // settings & onboarding are sensitive!
 *   .eq('id', orgId)
 *   .single()
 * 
 * // ✅ CORRECT: Filter after querying (when you need internal fields too)
 * const { data: fullOrg } = await supabaseAdmin
 *   .from('organizations')
 *   .select('*')
 *   .eq('id', orgId)
 *   .single()
 * 
 * // Use internally
 * if (fullOrg.onboarding_completed_at) {
 *   // ... internal logic
 * }
 * 
 * // Return filtered version to client
 * return NextResponse.json({
 *   organization: filterOrgForPublic(fullOrg)
 * })
 */

