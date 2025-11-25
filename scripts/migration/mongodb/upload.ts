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
    // Insert organizations (deduplication is handled by checking before upload)
    // We can't use upsert with onConflict because normalized_name is not unique
    // Instead, we insert directly since deduplication already happened
    const { data, error } = await supabase
      .from('leads_organizations')
      .insert(chunk)
      .select('id, normalized_name, domain');
    
    if (error) {
      // If it's a duplicate key error, try to get existing records
      if (error.code === '23505') { // PostgreSQL unique violation
        console.warn('  ⚠️  Duplicate detected, fetching existing records...');
        // Fetch existing records by domain or normalized_name
        const existingOrgs: any[] = [];
        for (const org of chunk) {
          let query = supabase.from('leads_organizations').select('id, normalized_name, domain');
          if (org.domain) {
            query = query.eq('domain', org.domain);
          } else {
            query = query.eq('normalized_name', org.normalized_name);
          }
          const { data: existing } = await query.limit(1).single();
          if (existing) {
            existingOrgs.push(existing);
          }
        }
        // Use existing records for mapping
        for (const org of existingOrgs) {
          const matchingOrg = chunk.find(o => 
            (o.domain && org.domain && o.domain === org.domain) ||
            (!o.domain && !org.domain && o.normalized_name === org.normalized_name)
          );
          if (matchingOrg?.profile_data?.mongo_id) {
            idMapping.set(matchingOrg.profile_data.mongo_id, org.id);
          }
        }
        continue; // Skip this chunk
      }
      console.error('Error uploading organizations:', error);
      throw error;
    }
    
    // Create mapping from mongo_id to supabase_id
    if (data) {
      for (const org of data) {
        const matchingOrg = chunk.find(o => 
          (o.domain && org.domain && o.domain === org.domain) ||
          (!o.domain && !org.domain && o.normalized_name === org.normalized_name)
        );
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
    // Insert contacts (deduplication is handled by checking before upload)
    // The unique constraint on email is conditional (WHERE email IS NOT NULL),
    // so we can't use upsert with onConflict. Use insert since deduplication already happened.
    const { data, error } = await supabase
      .from('leads_contacts')
      .insert(chunk)
      .select('id, email');
    
    if (error) {
      // If it's a duplicate key error, try to get existing records
      if (error.code === '23505') { // PostgreSQL unique violation
        console.warn('  ⚠️  Duplicate contact detected, fetching existing records...');
        // Fetch existing records by email
        const existingContacts: any[] = [];
        for (const contact of chunk) {
          if (contact.email) {
            const { data: existing } = await supabase
              .from('leads_contacts')
              .select('id, email')
              .eq('email', contact.email.toLowerCase())
              .limit(1)
              .single();
            if (existing) {
              existingContacts.push(existing);
            }
          }
        }
        // Use existing records for mapping
        for (const contact of existingContacts) {
          const matchingContact = chunk.find(c => c.email && c.email.toLowerCase() === contact.email);
          if (matchingContact?.attributes?.mongo_id) {
            idMapping.set(matchingContact.attributes.mongo_id, contact.id);
          }
        }
        continue; // Skip this chunk
      }
      console.error('Error uploading contacts:', error);
      throw error;
    }
    
    if (data) {
      for (const contact of data) {
        const matchingContact = chunk.find(c => c.email && c.email.toLowerCase() === contact.email);
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

