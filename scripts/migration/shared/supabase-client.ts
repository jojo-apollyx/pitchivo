/**
 * Supabase client setup for migration scripts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from './types';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(config: SupabaseConfig): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

export function resetSupabaseClient(): void {
  supabaseClient = null;
}

