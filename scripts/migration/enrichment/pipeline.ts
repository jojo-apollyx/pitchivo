#!/usr/bin/env node

/**
 * Enrichment pipeline executor
 * 
 * Usage:
 *   npm run enrich:organizations
 *   npm run enrich:contacts
 */

import { createClient } from '@supabase/supabase-js';
import { getEnrichmentSteps, getAvailableApiKey, checkFreeTierAvailable, recordApiUsage, createExecution, updateExecution } from './utils';
import { enrichWithHunterIO } from './providers/hunter-io';
import { enrichWithClearbit } from './providers/clearbit';
import { enrichWithNeverBounce } from './providers/neverbounce';
import { enrichWithOpenAI } from './providers/openai';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type EntityType = 'organization' | 'contact' | 'item';

/**
 * Execute enrichment pipeline for a single entity
 */
async function executeEnrichmentPipeline(
  entityType: EntityType,
  entityId: string
): Promise<void> {
  console.log(`\n🔍 Enriching ${entityType} ${entityId}...`);

  // Get enrichment steps
  const steps = await getEnrichmentSteps(supabase, entityType);

  if (steps.length === 0) {
    console.log(`  ⚠️  No enrichment steps configured for ${entityType}`);
    return;
  }

  // Execute each step
  for (const step of steps) {
    console.log(`  📋 Step ${step.step_order}: ${step.step_name} (${step.provider.name})`);

    try {
      // Get available API key
      const apiKeyInfo = await getAvailableApiKey(supabase, step.provider_id);
      if (!apiKeyInfo) {
        console.log(`    ⚠️  No available API key for ${step.provider.name}`);
        if (step.is_required) {
          throw new Error(`Required step ${step.step_name} cannot proceed without API key`);
        }
        continue;
      }

      // Check free tier
      const freeTierAvailable = await checkFreeTierAvailable(
        supabase,
        step.provider_id,
        apiKeyInfo.id
      );

      if (!freeTierAvailable) {
        console.log(`    ⚠️  Free tier limit reached for ${step.provider.name}`);
        if (step.is_required) {
          throw new Error(`Required step ${step.step_name} cannot proceed - free tier limit reached`);
        }
        continue;
      }

      // Create execution record
      const execution = await createExecution(
        supabase,
        step.id,
        step.provider_id,
        apiKeyInfo.id,
        entityType,
        entityId,
        'running'
      );

      // Execute enrichment based on provider
      let result: any;
      let success = false;

      try {
        switch (step.provider.name) {
          case 'hunter_io':
            result = await enrichWithHunterIO(
              apiKeyInfo.apiKey,
              step.step_name,
              entityType,
              entityId,
              step.config || {}
            );
            success = true;
            break;

          case 'clearbit':
            result = await enrichWithClearbit(
              apiKeyInfo.apiKey,
              step.step_name,
              entityType,
              entityId,
              step.config || {}
            );
            success = true;
            break;

          case 'neverbounce':
            result = await enrichWithNeverBounce(
              apiKeyInfo.apiKey,
              step.step_name,
              entityType,
              entityId,
              step.config || {}
            );
            success = true;
            break;

          case 'openai':
            result = await enrichWithOpenAI(
              apiKeyInfo.apiKey,
              step.step_name,
              entityType,
              entityId,
              step.config || {}
            );
            success = true;
            break;

          default:
            throw new Error(`Unknown provider: ${step.provider.name}`);
        }

        // Record API usage
        await recordApiUsage(supabase, step.provider_id, apiKeyInfo.id, success);

        // Update execution
        await updateExecution(supabase, execution.id, {
          status: 'completed',
          result_data: result,
        });

        // Apply results to entity
        await applyEnrichmentResults(supabase, entityType, entityId, step.step_name, result);

        console.log(`    ✅ ${step.step_name} completed`);

      } catch (error: any) {
        success = false;
        await recordApiUsage(supabase, step.provider_id, apiKeyInfo.id, success);
        await updateExecution(supabase, execution.id, {
          status: 'failed',
          error_message: error.message,
        });

        if (step.is_required) {
          throw error;
        }

        console.log(`    ⚠️  ${step.step_name} failed: ${error.message}`);
      }

    } catch (error: any) {
      console.error(`    ❌ Error in step ${step.step_name}:`, error.message);
      if (step.is_required) {
        throw error;
      }
    }
  }

  console.log(`  ✅ Enrichment pipeline completed for ${entityType} ${entityId}\n`);
}

/**
 * Apply enrichment results to entity
 */
async function applyEnrichmentResults(
  supabaseClient: typeof supabase,
  entityType: EntityType,
  entityId: string,
  stepName: string,
  results: any
): Promise<void> {
  if (entityType === 'organization') {
    // Update organization with enrichment data
    const updateData: any = {};

    if (stepName === 'enrich_company_basic' || stepName === 'enrich_company_detailed') {
      // Merge results into profile_data
      const { data: org } = await supabaseClient
        .from('leads_organizations')
        .select('profile_data')
        .eq('id', entityId)
        .single();

      if (org) {
        updateData.profile_data = {
          ...org.profile_data,
          ...results,
          enriched_at: new Date().toISOString(),
          enrichment_steps: [
            ...(org.profile_data?.enrichment_steps || []),
            stepName,
          ],
        };
      }
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseClient
        .from('leads_organizations')
        .update(updateData)
        .eq('id', entityId);
    }
  } else if (entityType === 'contact') {
    // Update contact with enrichment data
    const updateData: any = {};

    if (stepName === 'validate_email') {
      updateData.email_status = results.email_status || 'unknown';
    }

    if (stepName === 'enrich_contact_basic' || stepName === 'enrich_contact_detailed') {
      const { data: contact } = await supabaseClient
        .from('leads_contacts')
        .select('attributes')
        .eq('id', entityId)
        .single();

      if (contact) {
        updateData.attributes = {
          ...contact.attributes,
          ...results,
          enriched_at: new Date().toISOString(),
        };
      }
    }

    if (stepName === 'normalize_title' && results.normalized_title) {
      updateData.title = results.normalized_title;
    }

    if (Object.keys(updateData).length > 0) {
      await supabaseClient
        .from('leads_contacts')
        .update(updateData)
        .eq('id', entityId);
    }
  }
}

/**
 * Main function to enrich entities
 */
async function main() {
  const entityType = process.argv[2] as EntityType;

  if (!entityType || !['organization', 'contact', 'item'].includes(entityType)) {
    console.error('❌ Error: Invalid entity type');
    console.log('Usage: npm run enrich:organizations | npm run enrich:contacts');
    process.exit(1);
  }

  console.log(`🚀 Starting enrichment for ${entityType}s...\n`);

  try {
    // Get entities that need enrichment
    const tableName = entityType === 'organization' 
      ? 'leads_organizations' 
      : entityType === 'contact'
      ? 'leads_contacts'
      : 'leads_market_items';

    // Get entities without recent enrichment
    const { data: entities, error } = await supabase
      .from(tableName)
      .select('id')
      .limit(100); // Process in batches

    if (error) {
      throw new Error(`Failed to fetch entities: ${error.message}`);
    }

    if (!entities || entities.length === 0) {
      console.log('  ℹ️  No entities found to enrich');
      return;
    }

    console.log(`  Found ${entities.length} ${entityType}s to enrich\n`);

    // Process each entity
    for (const entity of entities) {
      await executeEnrichmentPipeline(entityType, entity.id);
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ Enrichment completed for ${entities.length} ${entityType}s`);

  } catch (error: any) {
    console.error('❌ Enrichment failed:', error.message);
    process.exit(1);
  }
}

// Run enrichment
if (require.main === module) {
  main().catch(console.error);
}

export { executeEnrichmentPipeline };

