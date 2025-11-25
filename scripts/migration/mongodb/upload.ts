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
    // Deduplicate within chunk based on domain (preferred) or normalized_name
    // This prevents unique constraint violations if duplicates exist in the same batch
    const seenKeys = new Set<string>();
    const deduplicatedChunk: any[] = [];
    const chunkMapping = new Map<any, any>(); // Map original org to deduplicated org
    
    for (const org of chunk) {
      // Use domain as primary key if available, otherwise normalized_name
      const key = org.domain || org.normalized_name;
      if (!key) {
        console.warn('  ⚠️  Skipping organization without domain or normalized_name:', org);
        continue;
      }
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        deduplicatedChunk.push(org);
        chunkMapping.set(org, org);
      } else {
        // Duplicate within chunk - keep reference to first one for mapping
        const firstOrg = deduplicatedChunk.find(o => (o.domain || o.normalized_name) === key);
        if (firstOrg) {
          chunkMapping.set(org, firstOrg);
        }
      }
    }
    
    if (deduplicatedChunk.length === 0) {
      continue;
    }
    
    // Insert organizations (deduplication within chunk is now handled above)
    // We can't use upsert with onConflict because normalized_name is not unique
    // Instead, we insert directly and handle duplicates via error handling
    const { data, error } = await supabase
      .from('leads_organizations')
      .insert(deduplicatedChunk)
      .select('id, normalized_name, domain');
    
    if (error) {
      // If it's a duplicate key error, try to get existing records
      if (error.code === '23505') { // PostgreSQL unique violation
        console.warn('  ⚠️  Duplicate detected, fetching existing records...');
        // Fetch existing records by domain or normalized_name
        const existingOrgs: any[] = [];
        for (const org of deduplicatedChunk) {
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
        // Use existing records for mapping - map all original orgs (including duplicates) to the same id
        for (const org of existingOrgs) {
          const key = org.domain || org.normalized_name;
          // Find all original orgs that match this key
          for (const originalOrg of chunk) {
            const originalKey = originalOrg.domain || originalOrg.normalized_name;
            if (originalKey === key && originalOrg?.profile_data?.mongo_id) {
              idMapping.set(originalOrg.profile_data.mongo_id, org.id);
            }
          }
        }
        continue; // Skip this chunk
      }
      console.error('Error uploading organizations:', error);
      throw error;
    }
    
    // Create mapping from mongo_id to supabase_id
    // Map all original orgs (including duplicates) to the same database id
    if (data) {
      for (const org of data) {
        const key = org.domain || org.normalized_name;
        // Find all original orgs that match this key
        for (const originalOrg of chunk) {
          const originalKey = originalOrg.domain || originalOrg.normalized_name;
          if (originalKey === key && originalOrg?.profile_data?.mongo_id) {
            idMapping.set(originalOrg.profile_data.mongo_id, org.id);
          }
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
    // Deduplicate within chunk to avoid "ON CONFLICT DO UPDATE cannot affect row a second time" error
    // Keep first occurrence of each normalized_name
    const seenNames = new Set<string>();
    const deduplicatedChunk: any[] = [];
    const chunkMapping = new Map<any, any>(); // Map original item to deduplicated item
    
    for (const item of chunk) {
      if (!item.normalized_name) {
        console.warn('  ⚠️  Skipping item without normalized_name:', item);
        continue;
      }
      
      if (!seenNames.has(item.normalized_name)) {
        seenNames.add(item.normalized_name);
        deduplicatedChunk.push(item);
        chunkMapping.set(item, item);
      } else {
        // Duplicate within chunk - keep reference to first one for mapping
        const firstItem = deduplicatedChunk.find(i => i.normalized_name === item.normalized_name);
        if (firstItem) {
          chunkMapping.set(item, firstItem);
        }
      }
    }
    
    if (deduplicatedChunk.length === 0) {
      continue;
    }
    
    const { data, error } = await supabase
      .from('leads_market_items')
      .upsert(deduplicatedChunk, {
        onConflict: 'normalized_name',
        ignoreDuplicates: false,
      })
      .select('id, normalized_name');
    
    if (error) {
      console.error('Error uploading market items:', error);
      throw error;
    }
    
    if (data) {
      // Create mapping from normalized_name to id
      const nameToId = new Map<string, string>();
      for (const item of data) {
        nameToId.set(item.normalized_name, item.id);
      }
      
      // Map all original items (including duplicates) to the same id
      for (const originalItem of chunk) {
        const deduplicatedItem = chunkMapping.get(originalItem);
        if (deduplicatedItem?.normalized_name) {
          const itemId = nameToId.get(deduplicatedItem.normalized_name);
          if (itemId && originalItem?.attributes?.mongo_id) {
            idMapping.set(originalItem.attributes.mongo_id, itemId);
          }
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
    // Deduplicate within chunk based on email (unique constraint)
    // This prevents unique constraint violations if duplicate emails exist in the same batch
    const seenEmails = new Set<string>();
    const deduplicatedChunk: any[] = [];
    const chunkMapping = new Map<any, any>(); // Map original contact to deduplicated contact
    
    for (const contact of chunk) {
      const emailKey = contact.email ? contact.email.toLowerCase().trim() : null;
      
      if (emailKey) {
        if (!seenEmails.has(emailKey)) {
          seenEmails.add(emailKey);
          deduplicatedChunk.push(contact);
          chunkMapping.set(contact, contact);
        } else {
          // Duplicate email within chunk - keep reference to first one for mapping
          const firstContact = deduplicatedChunk.find(c => 
            c.email && c.email.toLowerCase().trim() === emailKey
          );
          if (firstContact) {
            chunkMapping.set(contact, firstContact);
          }
        }
      } else {
        // No email - can't deduplicate, but can still insert (no unique constraint)
        deduplicatedChunk.push(contact);
        chunkMapping.set(contact, contact);
      }
    }
    
    if (deduplicatedChunk.length === 0) {
      continue;
    }
    
    // Insert contacts (deduplication within chunk is now handled above)
    // The unique constraint on email is conditional (WHERE email IS NOT NULL),
    // so we can't use upsert with onConflict. Use insert and handle duplicates via error handling.
    const { data, error } = await supabase
      .from('leads_contacts')
      .insert(deduplicatedChunk)
      .select('id, email');
    
    if (error) {
      // If it's a duplicate key error, try to get existing records
      if (error.code === '23505') { // PostgreSQL unique violation
        console.warn('  ⚠️  Duplicate contact detected, fetching existing records...');
        // Fetch existing records by email
        const emailToId = new Map<string, string>();
        for (const contact of deduplicatedChunk) {
          if (contact.email) {
            const { data: existing } = await supabase
              .from('leads_contacts')
              .select('id, email')
              .eq('email', contact.email.toLowerCase().trim())
              .limit(1)
              .single();
            if (existing) {
              emailToId.set(contact.email.toLowerCase().trim(), existing.id);
            }
          }
        }
        // Map all original contacts (including duplicates) to the same database id
        for (const originalContact of chunk) {
          if (originalContact.email) {
            const emailKey = originalContact.email.toLowerCase().trim();
            const contactId = emailToId.get(emailKey);
            if (contactId && originalContact?.attributes?.mongo_id) {
              idMapping.set(originalContact.attributes.mongo_id, contactId);
            }
          }
        }
        continue; // Skip this chunk
      }
      console.error('Error uploading contacts:', error);
      throw error;
    }
    
    // Map all original contacts (including duplicates) to the same database id
    if (data) {
      const emailToId = new Map<string, string>();
      for (const contact of data) {
        if (contact.email) {
          emailToId.set(contact.email.toLowerCase().trim(), contact.id);
        }
      }
      
      for (const originalContact of chunk) {
        if (originalContact.email) {
          const emailKey = originalContact.email.toLowerCase().trim();
          const contactId = emailToId.get(emailKey);
          if (contactId && originalContact?.attributes?.mongo_id) {
            idMapping.set(originalContact.attributes.mongo_id, contactId);
          }
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


