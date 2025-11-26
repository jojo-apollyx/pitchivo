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
 * Batch deduplicate market items by normalized names
 * Returns a map of normalized_name -> id for existing items
 */
export async function batchDeduplicateMarketItems(
  supabase: SupabaseClient,
  normalizedNames: string[]
): Promise<Map<string, string>> {
  if (normalizedNames.length === 0) {
    return new Map();
  }
  
  // Filter out null, undefined, or empty strings
  const validNames = normalizedNames.filter(name => name && name.trim().length > 0);
  
  if (validNames.length === 0) {
    return new Map();
  }
  
  // Supabase/PostgREST has stricter limits - use smaller chunks
  // Also helps avoid URL length limits in REST API
  const chunkSize = 100;
  const resultMap = new Map<string, string>();
  
  for (let i = 0; i < validNames.length; i += chunkSize) {
    const chunk = validNames.slice(i, i + chunkSize);
    
    try {
      const { data: existing, error } = await supabase
        .from('leads_market_items')
        .select('id, normalized_name')
        .in('normalized_name', chunk);
      
      if (error) {
        // If batch query fails, fall back to individual queries for this chunk
        console.warn(`  ⚠️  Batch deduplication failed for chunk, falling back to individual queries: ${error.message}`);
        for (const name of chunk) {
          try {
            const { data: item } = await supabase
              .from('leads_market_items')
              .select('id, normalized_name')
              .eq('normalized_name', name)
              .limit(1)
              .single();
            
            if (item) {
              resultMap.set(item.normalized_name, item.id);
            }
          } catch (err: any) {
            // Skip individual item if it fails
            continue;
          }
        }
        continue;
      }
      
      if (existing) {
        for (const item of existing) {
          resultMap.set(item.normalized_name, item.id);
        }
      }
    } catch (err: any) {
      console.warn(`  ⚠️  Error in batch deduplication chunk: ${err.message}`);
      // Continue with next chunk
      continue;
    }
  }
  
  return resultMap;
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

