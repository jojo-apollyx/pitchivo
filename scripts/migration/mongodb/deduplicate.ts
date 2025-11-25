/**
 * Deduplication logic for organizations and market items
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { normalizeName, extractDomain } from '../shared/utils';

/**
 * Deduplicate organization by domain or fuzzy name match
 */
export async function deduplicateOrganization(
  supabase: SupabaseClient,
  orgData: { name: string; domain?: string | null }
): Promise<string | null> {
  // First, try exact domain match
  if (orgData.domain) {
    const { data: existingByDomain } = await supabase
      .from('leads_organizations')
      .select('id')
      .eq('domain', orgData.domain)
      .limit(1)
      .single();
    
    if (existingByDomain) {
      return existingByDomain.id;
    }
  }
  
  // Then, try exact normalized name match
  const normalizedName = normalizeName(orgData.name);
  const { data: exactMatch } = await supabase
    .from('leads_organizations')
    .select('id')
    .eq('normalized_name', normalizedName)
    .limit(1)
    .single();
  
  if (exactMatch) {
    return exactMatch.id;
  }
  
  return null;
}

/**
 * Deduplicate market item by normalized name
 */
export async function deduplicateMarketItem(
  supabase: SupabaseClient,
  itemData: { name: string }
): Promise<string | null> {
  const normalizedName = normalizeName(itemData.name);
  
  const { data: existing } = await supabase
    .from('leads_market_items')
    .select('id')
    .eq('normalized_name', normalizedName)
    .limit(1)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  return null;
}

/**
 * Deduplicate contact by email
 */
export async function deduplicateContact(
  supabase: SupabaseClient,
  contactData: { email?: string | null }
): Promise<string | null> {
  if (!contactData.email) {
    return null;
  }
  
  const { data: existing } = await supabase
    .from('leads_contacts')
    .select('id')
    .eq('email', contactData.email.toLowerCase())
    .limit(1)
    .single();
  
  if (existing) {
    return existing.id;
  }
  
  return null;
}

