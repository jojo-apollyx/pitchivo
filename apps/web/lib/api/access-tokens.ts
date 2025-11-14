/**
 * Access Token Management - Cryptographically Secure Tokens
 * 
 * This module handles:
 * - Token generation (secure random tokens)
 * - Token hashing (SHA-256, never store plain tokens)
 * - Token validation
 * - Access level determination
 */

import { createHash, randomBytes } from 'crypto'
import { AccessLevel } from './field-filtering'

/**
 * Generate a cryptographically secure random token
 * 
 * @param length - Number of bytes (default 32 = 256 bits)
 * @returns Secure random token as hex string
 */
export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

/**
 * Hash a token using SHA-256
 * We store hashes, not plain tokens (like passwords)
 * 
 * @param token - Plain token string
 * @returns SHA-256 hash of the token
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Verify a token matches a hash
 * 
 * @param token - Plain token to verify
 * @param hash - Stored hash to compare against
 * @returns true if token matches hash
 */
export function verifyToken(token: string, hash: string): boolean {
  const tokenHash = hashToken(token)
  return tokenHash === hash
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean
  accessLevel?: AccessLevel
  tokenId?: string
  productId?: string
  channelId?: string
  error?: string
}

/**
 * Validate a token and return access level
 * This function queries the database to verify the token
 * 
 * @param token - Plain token from URL
 * @param supabase - Supabase client
 * @param productId - Optional product ID to verify token is for correct product
 * @returns Validation result with access level
 */
export async function validateAccessToken(
  token: string,
  supabase: any,
  productId?: string
): Promise<TokenValidationResult> {
  try {
    // Hash the provided token
    const tokenHash = hashToken(token)

    // Query database for token
    let query = supabase
      .from('product_access_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single()

    const { data: tokenData, error } = await query

    if (error || !tokenData) {
      return {
        valid: false,
        error: 'Invalid token',
      }
    }

    // Check if token is expired
    if (tokenData.expires_at && new Date(tokenData.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'Token expired',
      }
    }

    // Check if token is for the correct product (if productId provided)
    if (productId && tokenData.product_id !== productId) {
      return {
        valid: false,
        error: 'Token not valid for this product',
      }
    }

    // Update usage statistics (fire and forget)
    supabase
      .from('product_access_tokens')
      .update({
        use_count: tokenData.use_count + 1,
        last_used_at: new Date().toISOString(),
        first_used_at: tokenData.first_used_at || new Date().toISOString(),
      })
      .eq('token_id', tokenData.token_id)
      .then(() => {})
      .catch((err: any) => console.error('Failed to update token usage:', err))

    // Token is valid
    return {
      valid: true,
      accessLevel: tokenData.access_level as AccessLevel,
      tokenId: tokenData.token_id,
      productId: tokenData.product_id,
      channelId: tokenData.channel_id,
    }
  } catch (error) {
    console.error('Error validating token:', error)
    return {
      valid: false,
      error: 'Token validation failed',
    }
  }
}

/**
 * Generate a new access token and store it in database
 * 
 * @param params - Token creation parameters
 * @param supabase - Supabase client
 * @returns Created token data including plain token (only time it's returned)
 */
export async function createAccessToken(
  params: {
    productId: string
    orgId: string
    channelId: string
    channelName?: string
    accessLevel: AccessLevel
    expiresInDays?: number
    boundIp?: string
    createdBy?: string
    notes?: string
  },
  supabase: any
): Promise<{
  success: boolean
  token?: string
  tokenId?: string
  url?: string
  error?: string
}> {
  try {
    // Generate secure token
    const token = generateSecureToken(32) // 256-bit token
    const tokenHash = hashToken(token)

    // Calculate expiration
    let expiresAt: string | null = null
    if (params.expiresInDays) {
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + params.expiresInDays)
      expiresAt = expireDate.toISOString()
    }

    // Insert token into database
    const { data: tokenData, error } = await supabase
      .from('product_access_tokens')
      .insert({
        product_id: params.productId,
        org_id: params.orgId,
        channel_id: params.channelId,
        channel_name: params.channelName,
        access_level: params.accessLevel,
        token_hash: tokenHash,
        expires_at: expiresAt,
        bound_ip: params.boundIp,
        created_by: params.createdBy,
        notes: params.notes,
      })
      .select()
      .single()

    if (error || !tokenData) {
      console.error('Failed to create token:', error)
      return {
        success: false,
        error: error?.message || 'Failed to create token',
      }
    }

    // Generate URL (will be completed by caller with proper domain)
    const url = `/products/${params.productId}?token=${token}`

    return {
      success: true,
      token, // ⚠️ This is the ONLY time we return the plain token
      tokenId: tokenData.token_id,
      url,
    }
  } catch (error: any) {
    console.error('Error creating token:', error)
    return {
      success: false,
      error: error?.message || 'Token creation failed',
    }
  }
}

/**
 * Revoke a token (soft delete - mark as revoked)
 * 
 * @param tokenId - ID of token to revoke
 * @param supabase - Supabase client
 * @returns Success status
 */
export async function revokeAccessToken(
  tokenId: string,
  supabase: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('product_access_tokens')
      .update({ is_revoked: true })
      .eq('token_id', tokenId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error revoking token:', error)
    return {
      success: false,
      error: error?.message || 'Failed to revoke token',
    }
  }
}

/**
 * Get all tokens for a product
 * 
 * @param productId - Product ID
 * @param supabase - Supabase client
 * @returns List of tokens (without plain tokens, only hashes and metadata)
 */
export async function getProductTokens(
  productId: string,
  supabase: any
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('product_access_tokens')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tokens:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return []
  }
}

/**
 * Determine access level from request
 * Priority: token > merchant flag > default (public)
 * 
 * @param searchParams - URL search parameters
 * @param supabase - Supabase client
 * @param isMerchant - Whether user is authenticated merchant
 * @param productId - Product ID for validation
 * @returns Access level and token info
 */
export async function determineAccessLevel(
  searchParams: URLSearchParams,
  supabase: any,
  isMerchant: boolean = false,
  productId?: string
): Promise<{
  accessLevel: AccessLevel
  tokenId?: string
  channelId?: string
  source: 'token' | 'merchant' | 'public'
}> {
  // Priority 1: Check for access token
  const token = searchParams.get('token')
  if (token) {
    const validation = await validateAccessToken(token, supabase, productId)
    if (validation.valid) {
      return {
        accessLevel: validation.accessLevel!,
        tokenId: validation.tokenId,
        channelId: validation.channelId,
        source: 'token',
      }
    }
  }

  // Priority 2: Merchant access (full access)
  if (isMerchant) {
    return {
      accessLevel: 'after_rfq', // Merchants see everything
      source: 'merchant',
    }
  }

  // Priority 3: Default public access
  return {
    accessLevel: 'public',
    source: 'public',
  }
}

/**
 * Create an upgrade token after RFQ submission
 * This allows users to see restricted fields after submitting an RFQ
 * 
 * @param productId - Product ID
 * @param orgId - Organization ID
 * @param rfqId - RFQ submission ID (for tracking)
 * @param supabase - Supabase client
 * @returns New token with after_rfq access
 */
export async function createRfqUpgradeToken(
  productId: string,
  orgId: string,
  rfqId: string,
  supabase: any
): Promise<{
  success: boolean
  token?: string
  url?: string
  error?: string
}> {
  // Create token with after_rfq access, expires in 30 days
  return createAccessToken(
    {
      productId,
      orgId,
      channelId: `rfq_${rfqId}`,
      channelName: 'RFQ Submission',
      accessLevel: 'after_rfq',
      expiresInDays: 30,
      notes: `Generated after RFQ submission: ${rfqId}`,
    },
    supabase
  )
}

/**
 * Example usage:
 * 
 * // Generate token for email campaign:
 * const result = await createAccessToken({
 *   productId: 'abc-123',
 *   orgId: 'org-456',
 *   channelId: 'email_campaign_1',
 *   channelName: 'Email Campaign #1',
 *   accessLevel: 'after_click',
 *   expiresInDays: 30
 * }, supabase)
 * 
 * // Share this URL: result.url
 * // URL: /products/abc-123?token=64_character_hex_string
 * 
 * // When user visits, validate token:
 * const validation = await validateAccessToken(token, supabase, productId)
 * if (validation.valid) {
 *   // Filter product data based on validation.accessLevel
 *   const filtered = filterProductObject(product, validation.accessLevel)
 *   return NextResponse.json(filtered)
 * }
 */

