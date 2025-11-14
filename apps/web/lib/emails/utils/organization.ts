/**
 * Organization Email Utilities
 * 
 * Helper functions to get email addresses for organization members
 * Used for sending notifications to product owners, team members, etc.
 */

import { createClient } from '@/lib/supabase/server'

export interface OrganizationMember {
  email: string
  fullName: string | null
  orgRole: string | null
  userId: string
}

/**
 * Get all email addresses for organization members
 * 
 * @param orgId - Organization ID
 * @param roles - Optional filter by roles (e.g., ['sales', 'marketing'])
 * @returns Array of email addresses
 */
export async function getOrganizationEmails(
  orgId: string,
  roles?: string[]
): Promise<string[]> {
  const supabase = await createClient()

  let query = supabase
    .from('user_profiles')
    .select('email')
    .eq('organization_id', orgId)

  if (roles && roles.length > 0) {
    query = query.in('org_role', roles)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching organization emails:', error)
    return []
  }

  if (!data || data.length === 0) {
    console.warn(`No emails found for organization ${orgId}`)
    return []
  }

  return data.map((profile) => profile.email).filter(Boolean)
}

/**
 * Get organization members with full details
 * 
 * @param orgId - Organization ID
 * @param roles - Optional filter by roles
 * @returns Array of organization members
 */
export async function getOrganizationMembers(
  orgId: string,
  roles?: string[]
): Promise<OrganizationMember[]> {
  const supabase = await createClient()

  let query = supabase
    .from('user_profiles')
    .select('email, full_name, org_role, id')
    .eq('organization_id', orgId)

  if (roles && roles.length > 0) {
    query = query.in('org_role', roles)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching organization members:', error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((profile) => ({
    email: profile.email,
    fullName: profile.full_name,
    orgRole: profile.org_role,
    userId: profile.id,
  }))
}

/**
 * Get primary contact email for an organization
 * Priority: sales role > marketing role > any member
 * 
 * @param orgId - Organization ID
 * @returns Primary contact email or null
 */
export async function getPrimaryContactEmail(
  orgId: string
): Promise<string | null> {
  // Try sales role first
  const salesEmails = await getOrganizationEmails(orgId, ['sales'])
  if (salesEmails.length > 0) {
    return salesEmails[0]
  }

  // Try marketing role
  const marketingEmails = await getOrganizationEmails(orgId, ['marketing'])
  if (marketingEmails.length > 0) {
    return marketingEmails[0]
  }

  // Fall back to any member
  const allEmails = await getOrganizationEmails(orgId)
  return allEmails.length > 0 ? allEmails[0] : null
}

