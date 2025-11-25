/**
 * Enrichment utilities
 */

import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get available API key for a provider
 */
export async function getAvailableApiKey(
  supabase: SupabaseClient,
  providerId: string
): Promise<{ id: string; apiKey: string } | null> {
  // Call the RPC function to get available key ID
  const { data: keyId, error: rpcError } = await supabase.rpc('get_available_api_key', {
    provider_id: providerId,
  });

  if (rpcError || !keyId) {
    return null;
  }

  // Get the actual API key
  const { data: keyData, error: keyError } = await supabase
    .from('leads_enrichment_api_keys')
    .select('id, api_key')
    .eq('id', keyId)
    .eq('is_active', true)
    .single();

  if (keyError || !keyData) {
    return null;
  }

  return {
    id: keyData.id,
    apiKey: keyData.api_key,
  };
}

/**
 * Check if free tier is available
 */
export async function checkFreeTierAvailable(
  supabase: SupabaseClient,
  providerId: string,
  keyId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_free_tier_available', {
    provider_id: providerId,
    key_id: keyId,
  });

  if (error || data === null) {
    return false;
  }

  return data;
}

/**
 * Record API usage
 */
export async function recordApiUsage(
  supabase: SupabaseClient,
  providerId: string,
  apiKeyId: string,
  success: boolean = true,
  costAmount: number = 0
): Promise<void> {
  const { error } = await supabase.rpc('record_api_usage', {
    p_provider_id: providerId,
    p_api_key_id: apiKeyId,
    p_success: success,
    p_cost_amount: costAmount,
  });

  if (error) {
    console.error('Error recording API usage:', error);
  }
}

/**
 * Get enrichment steps for entity type
 */
export async function getEnrichmentSteps(
  supabase: SupabaseClient,
  entityType: 'organization' | 'contact' | 'item'
) {
  const { data, error } = await supabase
    .from('leads_enrichment_steps')
    .select('*, provider:leads_enrichment_providers(*)')
    .eq('entity_type', entityType)
    .eq('is_active', true)
    .order('step_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to get enrichment steps: ${error.message}`);
  }

  return data || [];
}

/**
 * Create execution record
 */
export async function createExecution(
  supabase: SupabaseClient,
  stepId: string,
  providerId: string,
  apiKeyId: string | null,
  entityType: 'organization' | 'contact' | 'item',
  entityId: string,
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' = 'pending'
) {
  const { data, error } = await supabase
    .from('leads_enrichment_executions')
    .insert({
      step_id: stepId,
      provider_id: providerId,
      api_key_id: apiKeyId,
      entity_type: entityType,
      entity_id: entityId,
      status,
      started_at: status === 'running' ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create execution: ${error.message}`);
  }

  return data;
}

/**
 * Update execution record
 */
export async function updateExecution(
  supabase: SupabaseClient,
  executionId: string,
  updates: {
    status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    error_message?: string;
    result_data?: any;
    metadata?: any;
  }
) {
  const updateData: any = {
    ...updates,
  };

  if (updates.status === 'completed' || updates.status === 'failed') {
    updateData.completed_at = new Date().toISOString();
  }

  if (updates.result_data) {
    updateData.result_data = updates.result_data;
  }

  if (updates.metadata) {
    updateData.metadata = updates.metadata;
  }

  const { error } = await supabase
    .from('leads_enrichment_executions')
    .update(updateData)
    .eq('id', executionId);

  if (error) {
    throw new Error(`Failed to update execution: ${error.message}`);
  }
}

