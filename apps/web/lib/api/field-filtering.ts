/**
 * Server-Side Field Filtering for Access Control
 * 
 * SECURITY PRINCIPLE: Never send restricted data to the client.
 * Filter on the server based on authenticated access level.
 */

export type AccessLevel = 'public' | 'after_click' | 'after_rfq'
export type FieldPermission = Record<string, AccessLevel>

/**
 * Access level hierarchy (inclusive model)
 * after_rfq (2) > after_click (1) > public (0)
 */
const ACCESS_LEVEL_HIERARCHY: Record<AccessLevel, number> = {
  public: 0,
  after_click: 1,
  after_rfq: 2,
}

/**
 * Check if user's access level allows viewing a field
 * 
 * @param userLevel - The user's authenticated access level
 * @param fieldRequirement - The minimum level required to view this field
 * @returns true if user can view the field
 */
export function canViewField(
  userLevel: AccessLevel,
  fieldRequirement: AccessLevel
): boolean {
  return ACCESS_LEVEL_HIERARCHY[userLevel] >= ACCESS_LEVEL_HIERARCHY[fieldRequirement]
}

/**
 * Filter product data based on user's access level
 * 
 * NEW APPROACH: Instead of removing fields, we return metadata about locked fields
 * so the UI can show them with blur/lock icon
 * 
 * @param productData - Full product data object
 * @param permissions - Field permission configuration
 * @param userAccessLevel - User's authenticated access level
 * @param includeLockedFields - If true, include locked fields with metadata (for UI)
 * @returns Filtered product data with lock metadata
 */
export function filterProductFields(
  productData: any,
  permissions: FieldPermission,
  userAccessLevel: AccessLevel,
  includeLockedFields: boolean = true
): any {
  if (!productData || typeof productData !== 'object') {
    return productData
  }

  // Special case: if user has 'after_rfq' access, they see everything
  if (userAccessLevel === 'after_rfq') {
    return productData
  }

  // Create filtered copy
  const filtered: any = {}

  // Iterate through all fields in product data
  for (const [fieldName, fieldValue] of Object.entries(productData)) {
    // Get the minimum access level required for this field
    const fieldRequirement = permissions[fieldName] || 'public'

    // Check if user can view this field
    if (canViewField(userAccessLevel, fieldRequirement)) {
      filtered[fieldName] = fieldValue
    } else {
      // Field is restricted
      if (includeLockedFields) {
        // Return metadata about the locked field for UI to display
        filtered[fieldName] = {
          _locked: true,
          _required_level: fieldRequirement,
          _preview: getFieldPreview(fieldValue, fieldName),
        }
      } else {
        // Old behavior: just return null
        filtered[fieldName] = null
      }
    }
  }

  return filtered
}

/**
 * Get a preview of a locked field value
 * Shows partial info so users know what they're missing
 */
function getFieldPreview(value: any, fieldName: string): string {
  if (!value) return ''
  
  // For strings, show first few characters
  if (typeof value === 'string') {
    if (value.length > 20) {
      return value.substring(0, 20) + '...'
    }
    return value
  }
  
  // For numbers, show as "•••"
  if (typeof value === 'number') {
    return '•••'
  }
  
  // For arrays, show count
  if (Array.isArray(value)) {
    return `${value.length} item${value.length !== 1 ? 's' : ''}`
  }
  
  // For objects
  if (typeof value === 'object') {
    return '[Hidden]'
  }
  
  return ''
}

/**
 * Filter nested product object including product_data
 * 
 * @param product - Full product object from database
 * @param userAccessLevel - User's authenticated access level
 * @param includeLockedFields - If true, include locked field metadata for UI
 * @returns Filtered product with filtered product_data
 */
export function filterProductObject(
  product: any,
  userAccessLevel: AccessLevel,
  includeLockedFields: boolean = true
): any {
  if (!product) return null

  // Parse product_data if it's a string
  let productData = product.product_data
  if (typeof productData === 'string') {
    try {
      productData = JSON.parse(productData)
    } catch (e) {
      console.error('Failed to parse product_data:', e)
      productData = {}
    }
  }

  // Get field permissions from product data
  const permissions: FieldPermission = productData?.field_permissions || {}

  // Filter the product_data fields
  const filteredProductData = filterProductFields(
    productData,
    permissions,
    userAccessLevel,
    includeLockedFields
  )

  // Get list of locked fields for UI hints
  const lockedFields = getHiddenFields(permissions, userAccessLevel)

  // Return product with filtered data
  return {
    ...product,
    product_data: filteredProductData,
    // Include metadata about what access level was used
    _access_level: userAccessLevel,
    _filtered: userAccessLevel !== 'after_rfq',
    _locked_fields: lockedFields,
    _locked_count: lockedFields.length,
  }
}

/**
 * Get list of hidden field names for a given access level
 * Useful for showing "locked field" indicators in UI
 * 
 * @param permissions - Field permission configuration
 * @param userAccessLevel - User's current access level
 * @returns Array of field names that are hidden
 */
export function getHiddenFields(
  permissions: FieldPermission,
  userAccessLevel: AccessLevel
): string[] {
  const hidden: string[] = []

  for (const [fieldName, fieldRequirement] of Object.entries(permissions)) {
    if (!canViewField(userAccessLevel, fieldRequirement)) {
      hidden.push(fieldName)
    }
  }

  return hidden
}

/**
 * Get count of fields at each access level
 * Useful for showing statistics
 * 
 * @param permissions - Field permission configuration
 * @returns Object with counts for each level
 */
export function getFieldCounts(permissions: FieldPermission): Record<AccessLevel, number> {
  const counts: Record<AccessLevel, number> = {
    public: 0,
    after_click: 0,
    after_rfq: 0,
  }

  for (const level of Object.values(permissions)) {
    counts[level]++
  }

  return counts
}

/**
 * Validate that all required public fields are present
 * Some fields should always be public (e.g., product name)
 * 
 * @param permissions - Field permission configuration
 * @param requiredPublicFields - List of field names that must be public
 * @returns Array of violations (empty if valid)
 */
export function validatePublicFields(
  permissions: FieldPermission,
  requiredPublicFields: string[] = ['product_name', 'category']
): string[] {
  const violations: string[] = []

  for (const fieldName of requiredPublicFields) {
    if (permissions[fieldName] && permissions[fieldName] !== 'public') {
      violations.push(`${fieldName} must be public`)
    }
  }

  return violations
}

/**
 * Example usage:
 * 
 * // On the server (API route):
 * const product = await fetchProductFromDB(productId)
 * const userAccessLevel = await getUserAccessLevel(token)
 * const filteredProduct = filterProductObject(product, userAccessLevel)
 * return NextResponse.json(filteredProduct)
 * 
 * // Result for 'public' access level:
 * {
 *   product_name: "Vitamin C",
 *   description: "Great product",
 *   price: null,              // Hidden (requires after_click)
 *   supplier_cost: null,       // Hidden (requires after_rfq)
 *   _access_level: "public",
 *   _filtered: true
 * }
 * 
 * // Result for 'after_click' access level:
 * {
 *   product_name: "Vitamin C",
 *   description: "Great product",
 *   price: "$100",            // Visible
 *   supplier_cost: null,       // Still hidden (requires after_rfq)
 *   _access_level: "after_click",
 *   _filtered: true
 * }
 * 
 * // Result for 'after_rfq' access level:
 * {
 *   product_name: "Vitamin C",
 *   description: "Great product",
 *   price: "$100",            // Visible
 *   supplier_cost: "$50",      // Visible
 *   _access_level: "after_rfq",
 *   _filtered: false           // Not filtered (user has full access)
 * }
 */

