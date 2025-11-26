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
import { transformCompany, transformProduct, transformContact, transformPurchase } from './transform';
import { deduplicateOrganization, deduplicateMarketItem, deduplicateContact } from './deduplicate';
import { uploadOrganizations, uploadMarketItems, uploadContacts, uploadSignals } from './upload';
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
    
    // Step 1: Migrate Organizations
    if (skipFlags.skipOrganizations) {
      console.log('⏭️  Step 1: Skipping organizations migration\n');
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
        
        const transformedItems = [];
        for (const mongoDoc of batch) {
          const transformed = transformProduct(mongoDoc);
          const existingId = await deduplicateMarketItem(supabase, transformed);
          
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
          console.log(`  ✓ Uploaded ${transformedItems.length} new products`);
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
        
        const transformedItems = [];
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
          
          const existingId = await deduplicateMarketItem(supabase, transformed);
          
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
          console.log(`  ✓ Uploaded ${transformedItems.length} new ingredients`);
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
        
        const transformedContacts = [];
        for (const mongoDoc of batch) {
          // Resolve company reference
          const companyMongoId = mongoDoc.company?.$id?.$oid;
          const orgId = companyMongoId ? orgIdMapping.get(companyMongoId) || null : null;
          
          const transformed = transformContact(mongoDoc, orgId);
          const existingId = await deduplicateContact(supabase, transformed);
          
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
          console.log(`  ✓ Uploaded ${transformedContacts.length} new contacts`);
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
        let skippedNoOrg = 0;
        let skippedNoItem = 0;
        let skippedNoName = 0;
        
        for (const mongoDoc of batch) {
          // Resolve buyer company
          const buyerMongoId = mongoDoc.buyer_company?.$id?.$oid;
          const orgId = buyerMongoId ? orgIdMapping.get(buyerMongoId) || null : null;
          
          if (!orgId) {
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
          
          // Try to find item using resolve_market_item function (checks name and aliases)
          const normalizedName = itemName.toLowerCase().trim();
          const { data: resolvedItemId, error: rpcError } = await supabase.rpc('resolve_market_item', {
            p_name: itemName,
            p_aliases: null
          });
          
          if (resolvedItemId && !rpcError) {
            itemId = resolvedItemId;
          } else {
            // Fallback: Try direct normalized name match
            const { data: item } = await supabase
              .from('leads_market_items')
              .select('id')
              .eq('normalized_name', normalizedName)
              .limit(1)
              .single();
            
            if (item) {
              itemId = item.id;
            }
          }
          
          if (!itemId) {
            skippedNoItem++;
            continue;
          }
          
          // Create signal
          const transformed = transformPurchase(mongoDoc, orgId, itemId, sourceId);
          transformedSignals.push(transformed);
        }
        
        // Log statistics
        if (skippedNoOrg > 0 || skippedNoItem > 0 || skippedNoName > 0) {
          console.log(`    Skipped: ${skippedNoOrg} (no org), ${skippedNoItem} (no item), ${skippedNoName} (no name)`);
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
      console.log(`  - Signals: ${totalPurchases}`);
    }
    
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

