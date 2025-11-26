#!/usr/bin/env node

/**
 * Main MongoDB migration script
 * 
 * Usage (non-prod):
 *   npm run migrate:mongodb
 *   npm run migrate:mongodb -- --skip-logos
 *   npm run migrate:mongodb -- --skip-azure-upload
 *   npm run migrate:mongodb -- --skip-logos --skip-azure-upload
 *   npm run migrate:mongodb -- --skip-organizations=55000
 *   npm run migrate:mongodb -- --skip-organizations=55000 --skip-logos
 *   npm run migrate:mongodb -- --skip-organizations=55000 --skip-contacts=10000
 * 
 * Usage (prod):
 *   npm run migrate:mongodb:prod
 *   npm run migrate:mongodb:prod -- --skip-logos
 *   npm run migrate:mongodb:prod -- --skip-azure-upload
 *   npm run migrate:mongodb:prod -- --skip-logos --skip-azure-upload
 *   npm run migrate:mongodb:prod -- --skip-organizations=55000
 *   npm run migrate:mongodb:prod -- --skip-organizations=55000 --skip-logos
 *   npm run migrate:mongodb:prod -- --skip-organizations=55000 --skip-contacts=10000
 * 
 * Available skip flags:
 *   --skip-logos              Skip logo migration to Azure
 *   --skip-azure-upload       Skip uploading raw data to Azure
 *   --skip-organizations      Skip organization migration entirely
 *   --skip-market-items       Skip market items migration entirely
 *   --skip-contacts           Skip contacts migration entirely
 *   --skip-signals            Skip signals migration entirely
 * 
 * Step-specific skip counts (skip first N records for specific steps):
 *   --skip-organizations=N    Skip first N organizations (e.g., --skip-organizations=55000)
 *   --skip-market-items=N     Skip first N market items
 *   --skip-contacts=N         Skip first N contacts
 *   --skip-signals=N         Skip first N signals
 * 
 * Environment variables required:
 *   MONGODB_CONNECTION_STRING
 *   AZURE_STORAGE_ACCOUNT_NAME
 *   AZURE_STORAGE_ACCOUNT_KEY
 *   AZURE_STORAGE_CONTAINER_NAME
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 * 
 * Note: Loads environment variables from .env.local file by default
 *       Prod script uses --env=.env.prod automatically
 *       Skip flags work with both prod and non-prod scripts
 */

interface SkipFlags {
  skipLogos: boolean;
  skipAzureUpload: boolean;
  skipOrganizations: boolean;
  skipMarketItems: boolean;
  skipContacts: boolean;
  skipSignals: boolean;
}

interface SkipCounts {
  organizations: number;
  marketItems: number;
  contacts: number;
  signals: number;
}

// Parse command line arguments first to get env file and skip flags
function parseArgs() {
  const args = process.argv.slice(2);
  // Support both --env-file= and --env= flags (--env-file might conflict with Node/tsx)
  const envFileArg = args.find(arg => arg.startsWith('--env-file=') || arg.startsWith('--env='));
  const envFile = envFileArg 
    ? (envFileArg.split('=')[1] || '.env.local')
    : '.env.local';
  
  // Helper to parse numeric flag value
  const parseNumericFlag = (prefix: string): number => {
    const arg = args.find(a => a.startsWith(`${prefix}=`));
    if (arg) {
      const value = parseInt(arg.split('=')[1] || '0', 10);
      return isNaN(value) ? 0 : value;
    }
    return 0;
  };
  
  // Parse step-specific skip counts
  const skipCounts: SkipCounts = {
    organizations: parseNumericFlag('--skip-organizations'),
    marketItems: parseNumericFlag('--skip-market-items'),
    contacts: parseNumericFlag('--skip-contacts'),
    signals: parseNumericFlag('--skip-signals'),
  };
  
  // Parse skip flags (boolean flags - these skip the entire step)
  // Note: --skip-organizations without = means skip entirely, with =N means skip N records
  // Check for exact match (no =) to distinguish from --skip-organizations=N
  const hasExactFlag = (flagName: string): boolean => {
    return args.some(arg => arg === flagName);
  };
  
  const skipFlags: SkipFlags = {
    skipLogos: args.includes('--skip-logos'),
    skipAzureUpload: args.includes('--skip-azure-upload'),
    skipOrganizations: hasExactFlag('--skip-organizations'),
    skipMarketItems: hasExactFlag('--skip-market-items'),
    skipContacts: hasExactFlag('--skip-contacts'),
    skipSignals: hasExactFlag('--skip-signals'),
  };
  
  return { envFile, skipFlags, skipCounts };
}

// Load environment variables from specified file (defaults to .env.local)
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

import { existsSync } from 'fs';

const { envFile, skipFlags, skipCounts } = parseArgs();
const envPath = envFile.startsWith('/') 
  ? envFile 
  : resolve(process.cwd(), 'apps/web', envFile);

console.log(`📄 Loading environment from: ${envPath}`);

if (!existsSync(envPath)) {
  console.error(`❌ Error: Environment file not found: ${envPath}`);
  console.error(`   Please create the file or check the path.`);
  process.exit(1);
}

const envResult = loadEnv({ path: envPath });

if (envResult.error) {
  console.warn(`⚠️  Warning: Could not load env file: ${envPath}`);
  console.warn(`   Error: ${envResult.error.message}`);
  console.warn(`   Falling back to system environment variables`);
} else {
  console.log(`✓ Environment loaded from: ${envPath}`);
}

import { MongoClient } from 'mongodb';
import { getSupabaseClient } from '../shared/supabase-client';
import { getAzureContainerClient } from '../shared/azure-client';
import { ensureContainerExists, uploadBatchToAzure } from './azure-storage';
import { PublicAccessType } from '@azure/storage-blob';
import { extractCompanies, extractProducts, extractContacts, extractPurchases, extractIngredients } from './extract';
import { transformCompany, transformProduct, transformContact, transformPurchase, transformProductSupplierSignal } from './transform';
import { extractDomain } from '../shared/utils';
import { deduplicateOrganization, deduplicateMarketItem, deduplicateContact, batchDeduplicateMarketItems, batchDeduplicateContacts } from './deduplicate';
import { uploadOrganizations, uploadMarketItems, uploadContacts, uploadSignals } from './upload';
import { createInferredMarketItem } from './infer-item';
import { migrateCompanyLogo, migrateIngredientLogo } from './logo-migration';
import { sleep } from '../shared/utils';
import type { MigrationConfig } from '../shared/types';
import type { MongoCompanyLead, MongoProductLead, MongoPersonLead, MongoPurchaseLead } from './types';

// Load environment variables
const config: MigrationConfig = {
  mongo: {
    connectionString: process.env.MONGODB_CONNECTION_STRING || '',
    databaseName: process.env.MONGODB_DATABASE_NAME || 'flash', // Default to 'flash'
  },
  azure: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'mongodb-raw-data',
  },
  supabase: {
    url: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  batchSize: parseInt(process.env.BATCH_SIZE || '1000', 10),
};

// Validate configuration
function validateConfig() {
  if (!config.mongo.connectionString) {
    throw new Error('MONGODB_CONNECTION_STRING is required');
  }
  if (!config.azure.accountName || !config.azure.accountKey) {
    throw new Error('Azure storage credentials are required');
  }
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase credentials are required');
  }
}

async function main() {
  console.log('🚀 Starting MongoDB migration...\n');
  
  // Display skip flags if any are set
  const flagNames: Record<keyof SkipFlags, string> = {
    skipLogos: '--skip-logos',
    skipAzureUpload: '--skip-azure-upload',
    skipOrganizations: '--skip-organizations',
    skipMarketItems: '--skip-market-items',
    skipContacts: '--skip-contacts',
    skipSignals: '--skip-signals',
  };
  
  const activeSkipFlags = Object.entries(skipFlags)
    .filter(([_, value]) => value)
    .map(([key, _]) => flagNames[key as keyof SkipFlags]);
  
  const activeSkipCounts = Object.entries(skipCounts)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => `--skip-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}=${value.toLocaleString()}`);
  
  if (activeSkipFlags.length > 0 || activeSkipCounts.length > 0) {
    console.log('⚠️  Skip options active:');
    if (activeSkipCounts.length > 0) {
      activeSkipCounts.forEach(flag => console.log(`   ${flag}`));
    }
    if (activeSkipFlags.length > 0) {
      activeSkipFlags.forEach(flag => console.log(`   ${flag}`));
    }
    console.log('');
  }
  
  validateConfig();
  
  // Initialize clients
  const mongoClient = new MongoClient(config.mongo.connectionString);
  const supabase = getSupabaseClient(config.supabase);
  const containerClient = getAzureContainerClient(config.azure);
  
  // Logo container (public access) - MUST be 'company-logos', not the raw data container
  const logoContainerName = process.env.AZURE_STORAGE_LOGO_CONTAINER_NAME || 'company-logos';
  // Ensure we're using the logo container, not the raw data container
  const logoContainerClient = getAzureContainerClient({
    accountName: config.azure.accountName,
    accountKey: config.azure.accountKey,
    containerName: logoContainerName, // Explicitly use logo container name
  });
  
  // Verify container names are different
  if (config.azure.containerName === logoContainerName) {
    console.warn(`⚠️  WARNING: Logo container name matches raw data container name: ${logoContainerName}`);
    console.warn(`    Logos should go to 'company-logos', not '${config.azure.containerName}'`);
  }
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoClient.connect();
    
    // Use specified database name or extract from connection string
    const dbName = config.mongo.databaseName || 'flash';
    const db = mongoClient.db(dbName);
    console.log('✓ Connected to MongoDB\n');
    
    // Ensure Azure containers exist (only if needed)
    if (!skipFlags.skipAzureUpload || !skipFlags.skipLogos) {
      console.log('☁️  Setting up Azure Blob Storage...');
      if (!skipFlags.skipAzureUpload) {
        await ensureContainerExists(containerClient); // Raw data is private (no access parameter)
      }
      if (!skipFlags.skipLogos) {
        await ensureContainerExists(logoContainerClient, 'blob' as PublicAccessType); // Logos are public
      }
      console.log('✓ Azure containers ready (logos container is public)\n');
    } else {
      console.log('⏭️  Skipping Azure container setup (all Azure operations skipped)\n');
    }
    
    // ID mappings for resolving references
    const orgIdMapping = new Map<string, string>(); // mongo_id -> supabase_id
    const itemIdMapping = new Map<string, string>();
    const contactIdMapping = new Map<string, string>();
    
    // Summary counters (declared here so they're accessible in summary)
    let totalOrgs = 0;
    let totalItems = 0;
    let totalContacts = 0;
    let totalPurchases = 0;
    let totalSupplierSignals = 0;
    
    // Step 1: Migrate Organizations
    if (skipFlags.skipOrganizations) {
      console.log('⏭️  Step 1: Skipping organizations migration\n');
      // Load existing organizations into mapping for signal resolution
      console.log('  Loading existing organizations for signal resolution...');
      
      // Load ALL organizations (Supabase might limit to 1000 by default)
      let allOrgs: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      let totalCount: number | null = null;
      
      while (hasMore) {
        const { data: pageOrgs, error: orgError, count } = await supabase
          .from('leads_organizations')
          .select('id, profile_data', { count: 'exact' })
          .range(offset, offset + pageSize - 1);
        
        if (orgError) {
          console.warn(`  ⚠️  Error loading organizations (offset ${offset}): ${orgError.message}`);
          break;
        }
        
        if (totalCount === null && count !== null) {
          totalCount = count;
          console.log(`  📊 Total organizations in database: ${totalCount.toLocaleString()}`);
        }
        
        if (pageOrgs && pageOrgs.length > 0) {
          allOrgs = allOrgs.concat(pageOrgs);
          offset += pageOrgs.length;
          hasMore = pageOrgs.length === pageSize;
          console.log(`  📥 Loaded ${allOrgs.length.toLocaleString()} organizations so far...`);
        } else {
          hasMore = false;
        }
      }
      
      console.log(`  📊 Total organizations fetched: ${allOrgs.length.toLocaleString()}`);
      
      if (allOrgs.length > 0) {
        let loadedCount = 0;
        let noMongoIdCount = 0;
        let parseErrorCount = 0;
        const sampleMongoIds: string[] = [];
        
        for (const org of allOrgs) {
          try {
            // profile_data might be a JSON string or already parsed object
            const profileData = typeof org.profile_data === 'string' 
              ? JSON.parse(org.profile_data) 
              : org.profile_data;
            const mongoId = profileData?.mongo_id;
            if (mongoId && typeof mongoId === 'string') {
              orgIdMapping.set(mongoId, org.id);
              loadedCount++;
              if (sampleMongoIds.length < 5) {
                sampleMongoIds.push(mongoId);
              }
            } else {
              noMongoIdCount++;
            }
          } catch (err: any) {
            parseErrorCount++;
            if (parseErrorCount <= 3) {
              console.warn(`  ⚠️  JSON parse error for org ${org.id}: ${err.message}`);
            }
          }
        }
        console.log(`  ✓ Loaded ${loadedCount.toLocaleString()} existing organizations into mapping`);
        if (noMongoIdCount > 0) {
          console.log(`  ⚠️  ${noMongoIdCount.toLocaleString()} organizations without mongo_id in profile_data (skipped)`);
        }
        if (parseErrorCount > 0) {
          console.log(`  ⚠️  ${parseErrorCount.toLocaleString()} organizations with JSON parse errors`);
        }
        console.log(`  📊 Total organizations in mapping: ${orgIdMapping.size.toLocaleString()}`);
        if (sampleMongoIds.length > 0) {
          console.log(`  📋 Sample mongo_ids loaded: ${sampleMongoIds.slice(0, 3).join(', ')}`);
        }
        console.log('');
      } else {
        console.log('  ⚠️  No existing organizations found in database\n');
      }
    } else {
      console.log('📦 Step 1: Migrating organizations...');
      
      // Get total count for progress tracking
      const totalOrgCount = await db.collection('CompanyLead').countDocuments();
      const remainingOrgCount = Math.max(0, totalOrgCount - skipCounts.organizations);
      if (skipCounts.organizations > 0) {
        console.log(`  Total: ${totalOrgCount.toLocaleString()}, Skipping: ${skipCounts.organizations.toLocaleString()}, Processing: ${remainingOrgCount.toLocaleString()}\n`);
      } else {
        console.log(`  Total: ${totalOrgCount.toLocaleString()}\n`);
      }
      
      let orgBatchNum = 0;
      let processedOrgs = 0;
      
      for await (const batch of extractCompanies(db, { batchSize: config.batchSize, skip: skipCounts.organizations })) {
        orgBatchNum++;
        processedOrgs += batch.length;
        const progress = remainingOrgCount > 0 ? `${processedOrgs.toLocaleString()}/${remainingOrgCount.toLocaleString()}` : `${processedOrgs.toLocaleString()}`;
        console.log(`  Processing batch ${orgBatchNum} (${batch.length} organizations) - Progress: ${progress}...`);
        
        // Upload raw data to Azure
        if (!skipFlags.skipAzureUpload) {
          const blobUrl = await uploadBatchToAzure(
            containerClient,
            'CompanyLead',
            orgBatchNum,
            batch
          );
          console.log(`  ✓ Uploaded raw data to Azure: ${blobUrl}`);
        } else {
          console.log(`  ⏭️  Skipped Azure upload for batch ${orgBatchNum}`);
        }
        
        // Transform and deduplicate
        const transformedOrgs = [];
        for (const mongoDoc of batch) {
          // Migrate logo first if it exists
          let logoUrl = (mongoDoc as any).logo_url;
          if (logoUrl && typeof logoUrl === 'string' && !skipFlags.skipLogos) {
            try {
              const migratedLogoUrl = await migrateCompanyLogo(
                logoUrl,
                mongoDoc._id.toString(),
                logoContainerClient
              );
              if (migratedLogoUrl) {
                logoUrl = migratedLogoUrl;
              }
            } catch (error: any) {
              console.warn(`  ⚠️  Failed to migrate logo for ${mongoDoc.name}: ${error.message}`);
              // Continue with original URL if migration fails
            }
          } else if (logoUrl && typeof logoUrl === 'string' && skipFlags.skipLogos) {
            console.log(`    ⏭️  Skipped logo migration for ${mongoDoc.name}`);
          }
          
          const transformed = transformCompany(mongoDoc);
          // Update logo URL in column (not profile_data)
          if (logoUrl) {
            transformed.logo_url = logoUrl;
          }
          
          const existingId = await deduplicateOrganization(supabase, transformed);
          
          if (!existingId) {
            transformedOrgs.push(transformed);
          } else {
            // Store mapping for existing org
            orgIdMapping.set(mongoDoc._id.toString(), existingId);
          }
        }
        
        // Upload new organizations
        if (transformedOrgs.length > 0) {
          const newMappings = await uploadOrganizations(supabase, transformedOrgs);
          for (const [mongoId, supabaseId] of newMappings.entries()) {
            orgIdMapping.set(mongoId, supabaseId);
          }
          console.log(`  ✓ Uploaded ${transformedOrgs.length} new organizations`);
        }
        
        totalOrgs += batch.length;
        const finalProgress = remainingOrgCount > 0 ? `${totalOrgs.toLocaleString()}/${remainingOrgCount.toLocaleString()}` : `${totalOrgs.toLocaleString()}`;
        console.log(`  Total organizations processed: ${finalProgress}\n`);
        
        // Rate limiting
        await sleep(100);
      }
    }
    
    // Step 2: Migrate Market Items (Products + Ingredients)
    if (skipFlags.skipMarketItems) {
      console.log('⏭️  Step 2: Skipping market items migration\n');
      // Load existing market items into mapping for signal resolution
      console.log('  Loading existing market items for signal resolution...');
      
      // Load ALL market items (Supabase might limit to 1000 by default)
      let allItems: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pageItems, error: itemError } = await supabase
          .from('leads_market_items')
          .select('id, attributes')
          .range(offset, offset + pageSize - 1);
        
        if (itemError) {
          console.warn(`  ⚠️  Error loading market items (offset ${offset}): ${itemError.message}`);
          break;
        }
        
        if (pageItems && pageItems.length > 0) {
          allItems = allItems.concat(pageItems);
          offset += pageItems.length;
          hasMore = pageItems.length === pageSize;
          console.log(`  📥 Loaded ${allItems.length.toLocaleString()} market items so far...`);
        } else {
          hasMore = false;
        }
      }
      
      console.log(`  📊 Total market items fetched: ${allItems.length.toLocaleString()}`);
      
      if (allItems.length > 0) {
        let loadedCount = 0;
        for (const item of allItems) {
          try {
            // attributes might be a JSON string or already parsed object
            const attributes = typeof item.attributes === 'string' 
              ? JSON.parse(item.attributes) 
              : item.attributes;
            const mongoId = attributes?.mongo_id;
            if (mongoId && typeof mongoId === 'string') {
              itemIdMapping.set(mongoId, item.id);
              loadedCount++;
            }
          } catch (err) {
            // If JSON parsing fails, skip this item
            continue;
          }
        }
        console.log(`  ✓ Loaded ${loadedCount.toLocaleString()} existing market items into mapping\n`);
      } else {
        console.log('  ⚠️  No existing market items found in database\n');
      }
    } else {
      console.log('📦 Step 2: Migrating market items...');
      
      // Get total counts for progress tracking
      const totalProductCount = await db.collection('ProductLead').countDocuments();
      const totalIngredientCount = await db.collection('Ingredient').countDocuments();
      const totalItemCount = totalProductCount + totalIngredientCount;
      const remainingItemCount = Math.max(0, totalItemCount - skipCounts.marketItems);
      if (skipCounts.marketItems > 0) {
        console.log(`  Total: ${totalItemCount.toLocaleString()} (${totalProductCount.toLocaleString()} products + ${totalIngredientCount.toLocaleString()} ingredients), Skipping: ${skipCounts.marketItems.toLocaleString()}, Processing: ${remainingItemCount.toLocaleString()}\n`);
      } else {
        console.log(`  Total: ${totalItemCount.toLocaleString()} (${totalProductCount.toLocaleString()} products + ${totalIngredientCount.toLocaleString()} ingredients)\n`);
      }
      
      let itemBatchNum = 0;
      let processedItems = 0;
      
      // Migrate products
      for await (const batch of extractProducts(db, { batchSize: config.batchSize, skip: skipCounts.marketItems })) {
        itemBatchNum++;
        processedItems += batch.length;
        const progress = remainingItemCount > 0 ? `${processedItems.toLocaleString()}/${remainingItemCount.toLocaleString()}` : `${processedItems.toLocaleString()}`;
        console.log(`  Processing product batch ${itemBatchNum} (${batch.length} products) - Progress: ${progress}...`);
        
        if (!skipFlags.skipAzureUpload) {
          await uploadBatchToAzure(containerClient, 'ProductLead', itemBatchNum, batch);
        } else {
          console.log(`  ⏭️  Skipped Azure upload for product batch ${itemBatchNum}`);
        }
        
        // Transform all items first
        const transformedBatch = batch.map(mongoDoc => ({
          mongoDoc,
          transformed: transformProduct(mongoDoc)
        }));
        
        // In-memory deduplication within batch (by normalized_name)
        const seenNamesInBatch = new Map<string, string>(); // normalized_name -> first mongo_id
        const deduplicatedBatch = [];
        for (const { mongoDoc, transformed } of transformedBatch) {
          const normalizedName = transformed.normalized_name;
          if (!seenNamesInBatch.has(normalizedName)) {
            seenNamesInBatch.set(normalizedName, mongoDoc._id.toString());
            deduplicatedBatch.push({ mongoDoc, transformed });
          }
        }
        
        if (deduplicatedBatch.length < transformedBatch.length) {
          console.log(`    ℹ️  Deduplicated ${transformedBatch.length - deduplicatedBatch.length} duplicate items within batch (by normalized_name)`);
        }
        
        // Batch deduplicate all items at once (against database)
        const normalizedNames = deduplicatedBatch.map(t => t.transformed.normalized_name);
        const existingItemsMap = await batchDeduplicateMarketItems(supabase, normalizedNames);
        
        const transformedItems = [];
        for (const { mongoDoc, transformed } of deduplicatedBatch) {
          const existingId = existingItemsMap.get(transformed.normalized_name);
          
          if (!existingId) {
            transformedItems.push(transformed);
          } else {
            itemIdMapping.set(mongoDoc._id.toString(), existingId);
          }
        }
        
        if (transformedItems.length > 0) {
          const newMappings = await uploadMarketItems(supabase, transformedItems);
          for (const [mongoId, supabaseId] of newMappings.entries()) {
            itemIdMapping.set(mongoId, supabaseId);
          }
          console.log(`  ✓ Uploaded ${transformedItems.length} new products (${batch.length - transformedItems.length} duplicates skipped)`);
        } else {
          console.log(`  ✓ All ${batch.length} products already exist (duplicates)`);
        }
        
        totalItems += batch.length;
        await sleep(100);
      }
      
      // Migrate ingredients
      for await (const batch of extractIngredients(db, { batchSize: config.batchSize, skip: skipCounts.marketItems })) {
        itemBatchNum++;
        processedItems += batch.length;
        const progress = remainingItemCount > 0 ? `${processedItems.toLocaleString()}/${remainingItemCount.toLocaleString()}` : `${processedItems.toLocaleString()}`;
        console.log(`  Processing ingredient batch ${itemBatchNum} (${batch.length} ingredients) - Progress: ${progress}...`);
        
        if (!skipFlags.skipAzureUpload) {
          await uploadBatchToAzure(containerClient, 'Ingredient', itemBatchNum, batch);
        } else {
          console.log(`  ⏭️  Skipped Azure upload for ingredient batch ${itemBatchNum}`);
        }
        
        // Transform all items first (with logo migration)
        const transformedBatch = [];
        for (const mongoDoc of batch) {
          // Migrate logo first if it exists
          let logoUrl = (mongoDoc as any).logo_url;
          if (logoUrl && typeof logoUrl === 'string' && !skipFlags.skipLogos) {
            try {
              const migratedLogoUrl = await migrateIngredientLogo(
                logoUrl,
                mongoDoc._id.toString(),
                logoContainerClient
              );
              if (migratedLogoUrl) {
                logoUrl = migratedLogoUrl;
              }
            } catch (error: any) {
              console.warn(`  ⚠️  Failed to migrate logo for ${mongoDoc.name}: ${error.message}`);
              // Continue with original URL if migration fails
            }
          } else if (logoUrl && typeof logoUrl === 'string' && skipFlags.skipLogos) {
            console.log(`    ⏭️  Skipped logo migration for ${mongoDoc.name}`);
          }
          
          const transformed = transformProduct(mongoDoc);
          // Update logo URL in column
          if (logoUrl) {
            transformed.logo_url = logoUrl;
          }
          
          transformedBatch.push({ mongoDoc, transformed });
        }
        
        // In-memory deduplication within batch (by normalized_name)
        const seenNamesInBatch = new Map<string, string>(); // normalized_name -> first mongo_id
        const deduplicatedBatch = [];
        for (const { mongoDoc, transformed } of transformedBatch) {
          const normalizedName = transformed.normalized_name;
          if (!seenNamesInBatch.has(normalizedName)) {
            seenNamesInBatch.set(normalizedName, mongoDoc._id.toString());
            deduplicatedBatch.push({ mongoDoc, transformed });
          }
        }
        
        if (deduplicatedBatch.length < transformedBatch.length) {
          console.log(`    ℹ️  Deduplicated ${transformedBatch.length - deduplicatedBatch.length} duplicate items within batch (by normalized_name)`);
        }
        
        // Batch deduplicate all items at once (against database)
        const normalizedNames = deduplicatedBatch.map(t => t.transformed.normalized_name);
        const existingItemsMap = await batchDeduplicateMarketItems(supabase, normalizedNames);
        
        const transformedItems = [];
        for (const { mongoDoc, transformed } of deduplicatedBatch) {
          const existingId = existingItemsMap.get(transformed.normalized_name);
          
          if (!existingId) {
            transformedItems.push(transformed);
          } else {
            itemIdMapping.set(mongoDoc._id.toString(), existingId);
          }
        }
        
        if (transformedItems.length > 0) {
          const newMappings = await uploadMarketItems(supabase, transformedItems);
          for (const [mongoId, supabaseId] of newMappings.entries()) {
            itemIdMapping.set(mongoId, supabaseId);
          }
          console.log(`  ✓ Uploaded ${transformedItems.length} new ingredients (${batch.length - transformedItems.length} duplicates skipped)`);
        } else {
          console.log(`  ✓ All ${batch.length} ingredients already exist (duplicates)`);
        }
        
        totalItems += batch.length;
        await sleep(100);
      }
      
      const finalProgress = remainingItemCount > 0 ? `${totalItems.toLocaleString()}/${remainingItemCount.toLocaleString()}` : `${totalItems.toLocaleString()}`;
      console.log(`  Total items processed: ${finalProgress}\n`);
    }
    
    // Step 3: Migrate Contacts
    if (skipFlags.skipContacts) {
      console.log('⏭️  Step 3: Skipping contacts migration\n');
    } else {
      console.log('📦 Step 3: Migrating contacts...');
      
      // Get total count for progress tracking
      const totalContactCount = await db.collection('PersonLead').countDocuments();
      const remainingContactCount = Math.max(0, totalContactCount - skipCounts.contacts);
      if (skipCounts.contacts > 0) {
        console.log(`  Total: ${totalContactCount.toLocaleString()}, Skipping: ${skipCounts.contacts.toLocaleString()}, Processing: ${remainingContactCount.toLocaleString()}\n`);
      } else {
        console.log(`  Total: ${totalContactCount.toLocaleString()}\n`);
      }
      
      let contactBatchNum = 0;
      let processedContacts = 0;
      
      for await (const batch of extractContacts(db, { batchSize: config.batchSize, skip: skipCounts.contacts })) {
        contactBatchNum++;
        processedContacts += batch.length;
        const progress = remainingContactCount > 0 ? `${processedContacts.toLocaleString()}/${remainingContactCount.toLocaleString()}` : `${processedContacts.toLocaleString()}`;
        console.log(`  Processing batch ${contactBatchNum} (${batch.length} contacts) - Progress: ${progress}...`);
        
        if (!skipFlags.skipAzureUpload) {
          await uploadBatchToAzure(containerClient, 'PersonLead', contactBatchNum, batch);
        } else {
          console.log(`  ⏭️  Skipped Azure upload for contact batch ${contactBatchNum}`);
        }
        
        // Transform all contacts first
        const transformedBatch = batch.map(mongoDoc => {
          // Resolve company reference - MongoDB DBRef object has .oid property
          const companyMongoId = (mongoDoc.company as any)?.oid?.toString();
          const orgId = companyMongoId ? orgIdMapping.get(companyMongoId) || null : null;
          return {
            mongoDoc,
            transformed: transformContact(mongoDoc, orgId)
          };
        });
        
        // Batch deduplicate all contacts at once by email
        const emails = transformedBatch
          .map(t => t.transformed.email)
          .filter((email): email is string => email !== null && email !== undefined && email.trim().length > 0);
        const existingContactsMap = await batchDeduplicateContacts(supabase, emails);
        
        const transformedContacts = [];
        for (const { mongoDoc, transformed } of transformedBatch) {
          const existingId = transformed.email 
            ? existingContactsMap.get(transformed.email.toLowerCase().trim()) || null
            : null;
          
          if (!existingId) {
            transformedContacts.push(transformed);
          } else {
            contactIdMapping.set(mongoDoc._id.toString(), existingId);
          }
        }
        
        if (transformedContacts.length > 0) {
          const newMappings = await uploadContacts(supabase, transformedContacts);
          for (const [mongoId, supabaseId] of newMappings.entries()) {
            contactIdMapping.set(mongoId, supabaseId);
          }
          console.log(`  ✓ Uploaded ${transformedContacts.length} new contacts (${batch.length - transformedContacts.length} duplicates skipped)`);
        } else {
          console.log(`  ✓ All ${batch.length} contacts already exist (duplicates)`);
        }
        
        totalContacts += batch.length;
        const finalProgress = remainingContactCount > 0 ? `${totalContacts.toLocaleString()}/${remainingContactCount.toLocaleString()}` : `${totalContacts.toLocaleString()}`;
        console.log(`  Total contacts processed: ${finalProgress}\n`);
        
        await sleep(100);
      }
    }
    
    // Step 4: Migrate Purchases (Signals)
    if (skipFlags.skipSignals) {
      console.log('⏭️  Step 4: Skipping signals migration\n');
    } else {
      console.log('📦 Step 4: Migrating purchases (signals)...');
      console.log(`  📊 Organizations in mapping: ${orgIdMapping.size.toLocaleString()}, Market items in mapping: ${itemIdMapping.size.toLocaleString()}\n`);
      
      // Get or create MongoDB Migration source
      let sourceId: string | null = null;
      const { data: source } = await supabase
        .from('leads_sources')
        .select('id')
        .eq('name', 'MongoDB Migration')
        .single();
      
      if (source) {
        sourceId = source.id;
        console.log(`  Using source: MongoDB Migration (${sourceId})`);
      } else {
        console.warn('  ⚠️  MongoDB Migration source not found in leads_sources table');
        console.warn('  Run migration 20251126000006_seed_leads_sources.sql to create it');
      }
      
      // Get total count for progress tracking
      const totalPurchaseCount = await db.collection('PurchaseLead').countDocuments();
      const remainingPurchaseCount = Math.max(0, totalPurchaseCount - skipCounts.signals);
      if (skipCounts.signals > 0) {
        console.log(`  Total: ${totalPurchaseCount.toLocaleString()}, Skipping: ${skipCounts.signals.toLocaleString()}, Processing: ${remainingPurchaseCount.toLocaleString()}\n`);
      } else {
        console.log(`  Total: ${totalPurchaseCount.toLocaleString()}\n`);
      }
      
      let purchaseBatchNum = 0;
      let processedPurchases = 0;
      
      for await (const batch of extractPurchases(db, { batchSize: config.batchSize, skip: skipCounts.signals })) {
        purchaseBatchNum++;
        processedPurchases += batch.length;
        const progress = remainingPurchaseCount > 0 ? `${processedPurchases.toLocaleString()}/${remainingPurchaseCount.toLocaleString()}` : `${processedPurchases.toLocaleString()}`;
        console.log(`  Processing batch ${purchaseBatchNum} (${batch.length} purchases) - Progress: ${progress}...`);
        
        if (!skipFlags.skipAzureUpload) {
          await uploadBatchToAzure(containerClient, 'PurchaseLead', purchaseBatchNum, batch);
        } else {
          console.log(`  ⏭️  Skipped Azure upload for purchase batch ${purchaseBatchNum}`);
        }
        
        const transformedSignals = [];
        const seenPurchaseIds = new Map<string, boolean>(); // Track MongoDB _id to detect duplicate documents
        const inferredItemsBeingCreated = new Map<string, Promise<string | null>>(); // Track inferred items being created in this batch
        let skippedNoOrg = 0;
        let skippedNoItem = 0;
        let skippedNoName = 0;
        let skippedDuplicateDoc = 0;
        let foundCount = 0;
        let notFoundCount = 0;
        
        for (const mongoDoc of batch) {
          // Check if we've already processed this exact MongoDB document
          const mongoId = mongoDoc._id.toString();
          if (seenPurchaseIds.has(mongoId)) {
            skippedDuplicateDoc++;
            continue;
          }
          seenPurchaseIds.set(mongoId, true);
          // Resolve buyer company - MongoDB DBRef object has .oid property
          const buyerMongoId = (mongoDoc.buyer_company as any)?.oid?.toString();
          
          if (!buyerMongoId) {
            skippedNoOrg++;
            continue;
          }
          
          let orgId = orgIdMapping.get(buyerMongoId) || null;
          
          if (!orgId) {
            // Fallback: Try to find organization by name/domain (in case it was deduplicated)
            try {
              const { ObjectId } = await import('mongodb');
              const companyDoc = await db.collection('CompanyLead').findOne({ _id: new ObjectId(buyerMongoId) });
              
              if (companyDoc) {
                const transformed = transformCompany(companyDoc as any);
                const existingId = await deduplicateOrganization(supabase, transformed);
                if (existingId) {
                  // Found by name/domain - use it and add to mapping for future lookups
                  orgId = existingId;
                  orgIdMapping.set(buyerMongoId, existingId);
                  foundCount++;
                }
              }
            } catch (err: any) {
              // Continue to diagnostic logic below
            }
          }
          
          if (!orgId) {
            // Diagnose why organization wasn't migrated by following migration logic
            if (skippedNoOrg < 5) {
              try {
                const { ObjectId } = await import('mongodb');
                const companyDoc = await db.collection('CompanyLead').findOne({ _id: new ObjectId(buyerMongoId) });
                
                if (companyDoc) {
                  const companyName = companyDoc.name || 'Unknown';
                  
                  // Follow migration logic to determine why it wasn't migrated
                  if (skipFlags.skipOrganizations) {
                    console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Organizations migration was skipped entirely`);
                  } else if (skipCounts.organizations > 0) {
                    // Check if it was in the skipped range by checking its position in sorted order
                    const { ObjectId: ObjId } = await import('mongodb');
                    const skippedCount = await db.collection('CompanyLead')
                      .countDocuments({ _id: { $lt: new ObjId(buyerMongoId) } });
                    
                    if (skippedCount < skipCounts.organizations) {
                      console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Was in skipped range (position ${skippedCount + 1}, skip count: ${skipCounts.organizations.toLocaleString()})`);
                    } else {
                      // Was processed - check why it wasn't migrated
                      const transformed = transformCompany(companyDoc as any);
                      const normalizedName = transformed.normalized_name;
                      const domain = transformed.domain;
                      
                      // Check if it was deduplicated (found existing org)
                      const existingId = await deduplicateOrganization(supabase, transformed);
                      if (existingId) {
                        // It was deduplicated - check if the existing org has this mongo_id
                        const { data: existingOrg } = await supabase
                          .from('leads_organizations')
                          .select('id, name, domain, profile_data')
                          .eq('id', existingId)
                          .single();
                        
                        if (existingOrg) {
                          const profileData = typeof existingOrg.profile_data === 'string' 
                            ? JSON.parse(existingOrg.profile_data) 
                            : existingOrg.profile_data;
                          const existingMongoId = profileData?.mongo_id;
                          
                          if (existingMongoId === buyerMongoId) {
                            console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Was deduplicated and mapped to existing org "${existingOrg.name}" (${existingId}) with same mongo_id - mapping should exist`);
                          } else {
                            console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Was deduplicated to existing org "${existingOrg.name}" (${existingId}) but existing org has different mongo_id: "${existingMongoId || 'none'}" - mapping not created`);
                          }
                        }
                      } else {
                        // Not deduplicated - check if it would have been skipped in uploadOrganizations
                        if (!domain && !normalizedName) {
                          console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Has no domain and no normalized_name - would be skipped in uploadOrganizations`);
                        } else {
                          console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Not deduplicated, has domain="${domain || 'none'}", normalized_name="${normalizedName}" - may have failed during upload or was in a batch that failed`);
                        }
                      }
                    }
                  } else {
                    // No skip - check why it wasn't migrated
                    const transformed = transformCompany(companyDoc as any);
                    const normalizedName = transformed.normalized_name;
                    const domain = transformed.domain;
                    
                    // Check if it was deduplicated
                    const existingId = await deduplicateOrganization(supabase, transformed);
                    if (existingId) {
                      const { data: existingOrg } = await supabase
                        .from('leads_organizations')
                        .select('id, name, profile_data')
                        .eq('id', existingId)
                        .single();
                      
                      if (existingOrg) {
                        const profileData = typeof existingOrg.profile_data === 'string' 
                          ? JSON.parse(existingOrg.profile_data) 
                          : existingOrg.profile_data;
                        console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Was deduplicated to existing org "${existingOrg.name}" (${existingId}) with mongo_id: "${profileData?.mongo_id || 'none'}" - mapping not created because mongo_ids don't match`);
                      }
                    } else if (!domain && !normalizedName) {
                      console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Has no domain and no normalized_name - skipped in uploadOrganizations`);
                    } else {
                      console.log(`    ⚠️  Company "${companyName}" (${buyerMongoId}): Not deduplicated, has domain="${domain || 'none'}", normalized_name="${normalizedName}" - may have failed during upload`);
                    }
                  }
                } else {
                  console.log(`    ⚠️  Company with ID ${buyerMongoId} not found in MongoDB CompanyLead collection - invalid reference`);
                }
              } catch (err: any) {
                console.log(`    ⚠️  Error diagnosing missing company ${buyerMongoId}: ${err.message}`);
              }
            }
            skippedNoOrg++;
            continue;
          }
          
          // Resolve item (by ingredient_base_name)
          const itemName = mongoDoc.ingredient_base_name;
          let itemId: string | null = null;
          
          if (!itemName) {
            skippedNoName++;
            continue;
          }
          
          // Normalize name for lookup
          const normalizedName = itemName.toLowerCase().trim();
          
          // First check if we already created/resolved this item in this batch
          itemId = itemIdMapping.get(normalizedName) || null;
          
          if (!itemId) {
            // Try to find item using resolve_market_item function (checks name and aliases)
            const { data: resolvedItemId, error: rpcError } = await supabase.rpc('resolve_market_item', {
              p_name: itemName,
              p_aliases: null
            });
            
            if (resolvedItemId && !rpcError) {
              itemId = resolvedItemId;
              if (itemId) {
                itemIdMapping.set(normalizedName, itemId);
              }
            } else {
              // Fallback: Try direct normalized name match
              const { data: item } = await supabase
                .from('leads_market_items')
                .select('id')
                .eq('normalized_name', normalizedName)
                .limit(1)
                .single();
              
              if (item && item.id) {
                itemId = item.id;
                itemIdMapping.set(normalizedName, item.id);
              }
            }
          }
          
          if (!itemId) {
            // Create inferred market item from ingredient name using AI
            try {
              // Check if we're already creating this item in this batch
              const existingCreationPromise = inferredItemsBeingCreated.get(normalizedName);
              if (existingCreationPromise) {
                // Wait for the existing creation to complete
                itemId = await existingCreationPromise;
                if (itemId) {
                  itemIdMapping.set(normalizedName, itemId);
                }
              } else {
                // Start creating this item and track it
                const creationPromise = (async (): Promise<string | null> => {
                  // Final database check before creating (race condition protection)
                  const { data: finalCheck } = await supabase
                    .from('leads_market_items')
                    .select('id')
                    .eq('normalized_name', normalizedName)
                    .limit(1)
                    .single();
                  
                  if (finalCheck && finalCheck.id) {
                    return finalCheck.id;
                  }
                  
                  const inferredItem = await createInferredMarketItem(itemName, mongoDoc);
                  
                  // Double-check mapping one more time
                  const existingInMapping = itemIdMapping.get(inferredItem.normalized_name);
                  if (existingInMapping) {
                    return existingInMapping;
                  }
                  
                  const { data: newItem, error: createError } = await supabase
                    .from('leads_market_items')
                    .insert(inferredItem)
                    .select('id')
                    .single();
                  
                  if (newItem && !createError && newItem.id) {
                    console.log(`    ✓ Created inferred market item: "${itemName}" (category: ${inferredItem.category || 'none'})`);
                    return newItem.id;
                  } else if (createError) {
                    // Check if it's a duplicate key error (23505)
                    if (createError.code === '23505') {
                      // Item was created by another process, try to find it
                      const { data: existingItem } = await supabase
                        .from('leads_market_items')
                        .select('id')
                        .eq('normalized_name', inferredItem.normalized_name)
                        .limit(1)
                        .single();
                      
                      if (existingItem && existingItem.id) {
                        return existingItem.id;
                      } else {
                        console.log(`    ⚠️  Duplicate key error but couldn't find item "${itemName}"`);
                        return null;
                      }
                    } else {
                      console.log(`    ⚠️  Failed to create inferred item "${itemName}": ${createError.message}`);
                      return null;
                    }
                  }
                  return null;
                })();
                
                inferredItemsBeingCreated.set(normalizedName, creationPromise);
                itemId = await creationPromise;
                
                if (itemId) {
                  itemIdMapping.set(normalizedName, itemId);
                } else {
                  // Remove from tracking if creation failed
                  inferredItemsBeingCreated.delete(normalizedName);
                  skippedNoItem++;
                  continue;
                }
              }
            } catch (err: any) {
              console.log(`    ⚠️  Error creating inferred item "${itemName}": ${err.message}`);
              inferredItemsBeingCreated.delete(normalizedName);
              skippedNoItem++;
              continue;
            }
          }
          
          if (!itemId) {
            skippedNoItem++;
            continue;
          }
          
          // Create signal (itemId is guaranteed to be non-null here)
          const transformed = transformPurchase(mongoDoc, orgId, itemId, sourceId);
          
          // Each purchase document creates one signal
          // Database-level deduplication in uploadSignals will handle duplicates (same org/item/date)
          // This allows multiple purchase documents with same org/item/date to create separate signals
          // (e.g., different line items, quantities, prices for the same purchase)
          transformedSignals.push(transformed);
        }
        
        // Log statistics
        if (skippedNoOrg > 0 || skippedNoItem > 0 || skippedNoName > 0 || skippedDuplicateDoc > 0) {
          const skipParts = [];
          if (skippedNoOrg > 0) skipParts.push(`${skippedNoOrg} (no org)`);
          if (skippedNoItem > 0) skipParts.push(`${skippedNoItem} (no item)`);
          if (skippedNoName > 0) skipParts.push(`${skippedNoName} (no name)`);
          if (skippedDuplicateDoc > 0) skipParts.push(`${skippedDuplicateDoc} (duplicate MongoDB doc)`);
          console.log(`    Skipped: ${skipParts.join(', ')}`);
        }
        
        if (transformedSignals.length > 0) {
          await uploadSignals(supabase, transformedSignals);
          console.log(`  ✓ Uploaded ${transformedSignals.length} signals`);
        } else {
          console.log(`  ⚠️  No signals created from this batch (check org/item resolution)`);
        }
        
      totalPurchases += batch.length;
      const finalProgress = remainingPurchaseCount > 0 ? `${totalPurchases.toLocaleString()}/${remainingPurchaseCount.toLocaleString()}` : `${totalPurchases.toLocaleString()}`;
      console.log(`  Total purchases processed: ${finalProgress} (${transformedSignals.length} signals created)\n`);
        
        await sleep(100);
      }
    }
    
    // Step 5: Create supplier/manufacturer signals from ProductLead company references
    console.log('📦 Step 5: Creating supplier/manufacturer signals from product-company relationships...');
    
    // Get or create MongoDB Migration source (reuse from Step 4)
    let sourceId: string | null = null;
    const { data: source } = await supabase
      .from('leads_sources')
      .select('id')
      .eq('name', 'MongoDB Migration')
      .single();
    
    if (source) {
      sourceId = source.id;
    }
    
    // Get total count of products with company references
    const totalProductsWithCompany = await db.collection('ProductLead').countDocuments({
      company: { $exists: true, $ne: null }
    });
    
    if (totalProductsWithCompany === 0) {
      console.log('  No products with company references found\n');
    } else {
      console.log(`  Total products with company references: ${totalProductsWithCompany.toLocaleString()}\n`);
      
      let supplierBatchNum = 0;
      let processedSuppliers = 0;
      let totalSupplierSignals = 0;
      
      // Extract products with company references
      for await (const batch of extractProducts(db, { 
        batchSize: config.batchSize, 
        skip: 0,
        filter: { company: { $exists: true, $ne: null } }
      })) {
        supplierBatchNum++;
        processedSuppliers += batch.length;
        const progress = `${processedSuppliers.toLocaleString()}/${totalProductsWithCompany.toLocaleString()}`;
        console.log(`  Processing supplier batch ${supplierBatchNum} (${batch.length} products) - Progress: ${progress}...`);
        
        const transformedSignals = [];
        const seenSignalsInBatch = new Map<string, boolean>(); // Deduplicate within batch
        let skippedNoOrg = 0;
        let skippedNoItem = 0;
        let skippedDuplicate = 0;
        
        for (const mongoDoc of batch) {
          // Resolve company reference - MongoDB DBRef object has .oid property
          const companyMongoId = (mongoDoc.company as any)?.oid?.toString();
          
          if (!companyMongoId) {
            skippedNoOrg++;
            continue;
          }
          
          let orgId = orgIdMapping.get(companyMongoId) || null;
          
          if (!orgId) {
            // Fallback: Try to find organization by name/domain (in case it was deduplicated)
            try {
              const { ObjectId } = await import('mongodb');
              const companyDoc = await db.collection('CompanyLead').findOne({ _id: new ObjectId(companyMongoId) });
              
              if (companyDoc) {
                const transformed = transformCompany(companyDoc as any);
                const existingId = await deduplicateOrganization(supabase, transformed);
                if (existingId) {
                  // Found by name/domain - use it and add to mapping for future lookups
                  orgId = existingId;
                  orgIdMapping.set(companyMongoId, existingId);
                }
              }
            } catch (err: any) {
              // Continue to skip logic below
            }
          }
          
          if (!orgId) {
            skippedNoOrg++;
            continue;
          }
          
          // Resolve item (product) - use the itemIdMapping we built during product migration
          const itemId = itemIdMapping.get(mongoDoc._id.toString()) || null;
          
          if (!itemId) {
            // Try to find by normalized name as fallback
            const transformed = transformProduct(mongoDoc);
            const normalizedName = transformed.normalized_name;
            const { data: item } = await supabase
              .from('leads_market_items')
              .select('id')
              .eq('normalized_name', normalizedName)
              .limit(1)
              .single();
            
            if (item) {
              const resolvedItemId = item.id;
              // Create signal
              const signal = transformProductSupplierSignal(mongoDoc, orgId, resolvedItemId, sourceId);
              
              // Check for duplicates within batch (include event_date for uniqueness)
              const signalKey = `${signal.org_id || 'null'}:${signal.item_id || 'null'}:${signal.interaction_type || 'null'}:${signal.contact_id || 'null'}:${signal.event_date || 'null'}`;
              if (!seenSignalsInBatch.has(signalKey)) {
                seenSignalsInBatch.set(signalKey, true);
                transformedSignals.push(signal);
              } else {
                skippedDuplicate++;
              }
            } else {
              skippedNoItem++;
            }
          } else {
            // Create signal
            const signal = transformProductSupplierSignal(mongoDoc, orgId, itemId, sourceId);
            
            // Check for duplicates within batch (include event_date for uniqueness)
            const signalKey = `${signal.org_id || 'null'}:${signal.item_id || 'null'}:${signal.interaction_type || 'null'}:${signal.contact_id || 'null'}:${signal.event_date || 'null'}`;
            if (!seenSignalsInBatch.has(signalKey)) {
              seenSignalsInBatch.set(signalKey, true);
              transformedSignals.push(signal);
            } else {
              skippedDuplicate++;
            }
          }
        }
        
        // Log statistics
        if (skippedNoOrg > 0 || skippedNoItem > 0 || skippedDuplicate > 0) {
          const skipParts = [];
          if (skippedNoOrg > 0) skipParts.push(`${skippedNoOrg} (no org)`);
          if (skippedNoItem > 0) skipParts.push(`${skippedNoItem} (no item)`);
          if (skippedDuplicate > 0) skipParts.push(`${skippedDuplicate} (duplicate in batch)`);
          console.log(`    Skipped: ${skipParts.join(', ')}`);
        }
        
        if (transformedSignals.length > 0) {
          await uploadSignals(supabase, transformedSignals);
          totalSupplierSignals += transformedSignals.length;
          console.log(`  ✓ Created ${transformedSignals.length} supplier/manufacturer signals`);
        }
        
        await sleep(100);
      }
      
      console.log(`  Total supplier/manufacturer signals created: ${totalSupplierSignals.toLocaleString()}\n`);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`\nSummary:`);
    if (!skipFlags.skipOrganizations) {
      console.log(`  - Organizations: ${totalOrgs}`);
    }
    if (!skipFlags.skipMarketItems) {
      console.log(`  - Market Items: ${totalItems}`);
    }
    if (!skipFlags.skipContacts) {
      console.log(`  - Contacts: ${totalContacts}`);
    }
    if (!skipFlags.skipSignals) {
      console.log(`  - Purchase Signals: ${totalPurchases}`);
    }
    console.log(`  - Supplier/Manufacturer Signals: ${totalSupplierSignals}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoClient.close();
    console.log('\n✓ MongoDB connection closed');
  }
}

// Run migration
if (require.main === module) {
  main().catch(console.error);
}

export { main };


