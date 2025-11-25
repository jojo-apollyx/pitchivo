/**
 * Upload transformed data to Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { chunkArray } from '../shared/utils';

/**
 * Upload organizations to Supabase
 */
export async function uploadOrganizations(
  supabase: SupabaseClient,
  organizations: any[]
): Promise<Map<string, string>> {
  const idMapping = new Map<string, string>();
  const chunks = chunkArray(organizations, 100); // Upload in batches of 100
  
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('leads_organizations')
      .upsert(chunk, {
        onConflict: 'normalized_name',
        ignoreDuplicates: false,
      })
      .select('id, normalized_name');
    
    if (error) {
      console.error('Error uploading organizations:', error);
      throw error;
    }
    
    // Create mapping from normalized_name to id
    if (data) {
      for (const org of data) {
        const matchingOrg = chunk.find(o => o.normalized_name === org.normalized_name);
        if (matchingOrg?.profile_data?.mongo_id) {
          idMapping.set(matchingOrg.profile_data.mongo_id, org.id);
        }
      }
    }
  }
  
  return idMapping;
}

/**
 * Upload market items to Supabase
 */
export async function uploadMarketItems(
  supabase: SupabaseClient,
  items: any[]
): Promise<Map<string, string>> {
  const idMapping = new Map<string, string>();
  const chunks = chunkArray(items, 100);
  
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('leads_market_items')
      .upsert(chunk, {
        onConflict: 'normalized_name',
        ignoreDuplicates: false,
      })
      .select('id, normalized_name');
    
    if (error) {
      console.error('Error uploading market items:', error);
      throw error;
    }
    
    if (data) {
      for (const item of data) {
        const matchingItem = chunk.find(i => i.normalized_name === item.normalized_name);
        if (matchingItem?.attributes?.mongo_id) {
          idMapping.set(matchingItem.attributes.mongo_id, item.id);
        }
      }
    }
  }
  
  return idMapping;
}

/**
 * Upload contacts to Supabase
 */
export async function uploadContacts(
  supabase: SupabaseClient,
  contacts: any[]
): Promise<Map<string, string>> {
  const idMapping = new Map<string, string>();
  const chunks = chunkArray(contacts, 100);
  
  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from('leads_contacts')
      .upsert(chunk, {
        onConflict: 'email',
        ignoreDuplicates: false,
      })
      .select('id, email');
    
    if (error) {
      console.error('Error uploading contacts:', error);
      throw error;
    }
    
    if (data) {
      for (const contact of data) {
        const matchingContact = chunk.find(c => c.email === contact.email);
        if (matchingContact?.attributes?.mongo_id) {
          idMapping.set(matchingContact.attributes.mongo_id, contact.id);
        }
      }
    }
  }
  
  return idMapping;
}

/**
 * Upload signals to Supabase
 */
export async function uploadSignals(
  supabase: SupabaseClient,
  signals: any[]
): Promise<void> {
  const chunks = chunkArray(signals, 100);
  
  for (const chunk of chunks) {
    const { error } = await supabase
      .from('leads_signals')
      .insert(chunk);
    
    if (error) {
      console.error('Error uploading signals:', error);
      throw error;
    }
  }
}

