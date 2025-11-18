/**
 * Quota management utilities
 * Handles checking and tracking subscription quotas
 */

import { createClient } from '@/lib/supabase/client'
import { getTierConfig, isUnlimited } from '@/lib/constants/pricing'

export interface QuotaStatus {
  emailsUsed: number
  emailsQuota: number
  emailsRemaining: number
  qrLinksUsed: number
  qrLinksQuota: number
  qrLinksRemaining: number
  tier: string
  canSendEmails: boolean
  canAddQRLinks: boolean
}

interface QuotaUsageData {
  emails_sent?: number
  email_quota?: number
  qr_links_count?: number
  qr_links_quota?: number
}

/**
 * Get current quota status for an organization
 */
export async function getQuotaStatus(orgId: string): Promise<QuotaStatus> {
  const supabase = createClient()

  try {
    // Call the database function to get quota usage
    const { data, error } = await supabase
      .rpc('get_current_quota_usage', { org_uuid: orgId })
      .single()

    if (error) {
      console.error('Error fetching quota status:', error)
      throw error
    }

    // Get subscription to get tier
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, email_quota, qr_links_per_product')
      .eq('org_id', orgId)
      .single()

    const quotaData = (data as QuotaUsageData) || {}
    const emailsUsed = quotaData.emails_sent || 0
    const emailsQuota = quotaData.email_quota || 30
    const emailsRemaining = Math.max(0, emailsQuota - emailsUsed)
    const qrLinksUsed = quotaData.qr_links_count || 0
    const qrLinksQuota = quotaData.qr_links_quota || 3

    const isEmailUnlimited = isUnlimited(emailsQuota)
    const isQRLinksUnlimited = isUnlimited(qrLinksQuota)

    return {
      emailsUsed,
      emailsQuota,
      emailsRemaining,
      qrLinksUsed,
      qrLinksQuota,
      qrLinksRemaining: isQRLinksUnlimited ? 999999 : Math.max(0, qrLinksQuota - qrLinksUsed),
      tier: subscription?.tier || 'free',
      canSendEmails: isEmailUnlimited || emailsRemaining > 0,
      canAddQRLinks: isQRLinksUnlimited || qrLinksUsed < qrLinksQuota
    }
  } catch (error) {
    console.error('Error in getQuotaStatus:', error)
    // Return default free tier quotas on error
    return {
      emailsUsed: 0,
      emailsQuota: 30,
      emailsRemaining: 30,
      qrLinksUsed: 0,
      qrLinksQuota: 3,
      qrLinksRemaining: 3,
      tier: 'free',
      canSendEmails: true,
      canAddQRLinks: true
    }
  }
}

/**
 * Check if organization can send N emails
 */
export async function checkEmailQuota(orgId: string, count: number = 1): Promise<{
  canSend: boolean
  remaining: number
  quota: number
  tier: string
}> {
  const status = await getQuotaStatus(orgId)

  return {
    canSend: isUnlimited(status.emailsQuota) || status.emailsRemaining >= count,
    remaining: status.emailsRemaining,
    quota: status.emailsQuota,
    tier: status.tier
  }
}

/**
 * Check if product can add more QR/custom links
 */
export async function checkQRLinksQuota(productId: string): Promise<{
  canAdd: boolean
  used: number
  quota: number
  remaining: number
  tier: string
}> {
  const supabase = createClient()

  try {
    // Get product to find org_id
    const { data: product } = await supabase
      .from('products')
      .select('organization_id')
      .eq('product_id', productId)
      .single()

    if (!product) {
      throw new Error('Product not found')
    }

    // Get current links for this product
    const { data: links, count } = await supabase
      .from('product_links')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', productId)

    const used = count || 0

    // Get quota status
    const status = await getQuotaStatus(product.organization_id)

    return {
      canAdd: isUnlimited(status.qrLinksQuota) || used < status.qrLinksQuota,
      used,
      quota: status.qrLinksQuota,
      remaining: isUnlimited(status.qrLinksQuota) ? 999999 : Math.max(0, status.qrLinksQuota - used),
      tier: status.tier
    }
  } catch (error) {
    console.error('Error checking QR links quota:', error)
    return {
      canAdd: true,
      used: 0,
      quota: 3,
      remaining: 3,
      tier: 'free'
    }
  }
}

/**
 * Increment email usage for an organization
 * Creates or updates the current billing period usage record
 */
export async function incrementEmailUsage(orgId: string, count: number = 1): Promise<void> {
  const supabase = createClient()

  try {
    // Get subscription to determine billing period
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('current_period_start, current_period_end')
      .eq('org_id', orgId)
      .single()

    if (!subscription) {
      console.error('No subscription found for organization')
      return
    }

    // Calculate current period (monthly)
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date

    if (subscription.current_period_start && subscription.current_period_end) {
      periodStart = new Date(subscription.current_period_start)
      periodEnd = new Date(subscription.current_period_end)
    } else {
      // Default to calendar month
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    // Try to get existing usage record for current period
    const { data: existingUsage } = await supabase
      .from('quota_usage')
      .select('*')
      .eq('org_id', orgId)
      .eq('period_start', periodStart.toISOString())
      .eq('period_end', periodEnd.toISOString())
      .single()

    if (existingUsage) {
      // Update existing record
      const { error } = await supabase
        .from('quota_usage')
        .update({
          emails_sent: existingUsage.emails_sent + count,
          updated_at: new Date().toISOString()
        })
        .eq('usage_id', existingUsage.usage_id)

      if (error) {
        console.error('Error updating email usage:', error)
      }
    } else {
      // Create new usage record
      const { error } = await supabase
        .from('quota_usage')
        .insert({
          org_id: orgId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          emails_sent: count
        })

      if (error) {
        console.error('Error creating email usage record:', error)
      }
    }
  } catch (error) {
    console.error('Error in incrementEmailUsage:', error)
  }
}

/**
 * Track QR link creation (stored in product_links table)
 * This function is called after successful link generation
 */
export async function trackQRLinkCreation(
  productId: string,
  orgId: string,
  linkType: 'qr' | 'custom',
  linkUrl: string,
  linkName?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('product_links')
      .insert({
        product_id: productId,
        org_id: orgId,
        link_type: linkType,
        link_url: linkUrl,
        link_name: linkName
      })

    if (error) {
      console.error('Error tracking QR link creation:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in trackQRLinkCreation:', error)
    return { success: false, error: 'Failed to track link creation' }
  }
}

/**
 * Get quota usage percentage
 */
export function getQuotaUsagePercentage(used: number, quota: number): number {
  if (isUnlimited(quota)) return 0
  if (quota === 0) return 100
  return Math.min(100, Math.round((used / quota) * 100))
}

/**
 * Check if quota is low (>80% used)
 */
export function isQuotaLow(used: number, quota: number): boolean {
  if (isUnlimited(quota)) return false
  return getQuotaUsagePercentage(used, quota) > 80
}

/**
 * Check if quota is exceeded
 */
export function isQuotaExceeded(used: number, quota: number): boolean {
  if (isUnlimited(quota)) return false
  return used >= quota
}

