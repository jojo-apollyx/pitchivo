#!/usr/bin/env node

/**
 * Main MongoDB migration script
 * 
 * Usage:
 *   npm run migrate:mongodb
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
 *       Can specify different file with --env-file=.env.prod
 */

// Parse command line arguments first to get env file
function parseArgs() {
  const args = process.argv.slice(2);
  // Support both --env-file= and --env= flags (--env-file might conflict with Node/tsx)
  const envFileArg = args.find(arg => arg.startsWith('--env-file=') || arg.startsWith('--env='));
  const envFile = envFileArg 
    ? (envFileArg.split('=')[1] || '.env.local')
    : '.env.local';
  return { envFile };
}

// Load environment variables from specified file (defaults to .env.local)
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

import { existsSync } from 'fs';

const { envFile } = parseArgs();
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
import { migrateCompanyLogo } from './logo-migration';
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
    
    // Ensure Azure containers exist
    console.log('☁️  Setting up Azure Blob Storage...');
    await ensureContainerExists(containerClient); // Raw data is private (no access parameter)
    await ensureContainerExists(logoContainerClient, 'blob' as PublicAccessType); // Logos are public
    console.log('✓ Azure containers ready (logos container is public)\n');
    
    // ID mappings for resolving references
    const orgIdMapping = new Map<string, string>(); // mongo_id -> supabase_id
    const itemIdMapping = new Map<string, string>();
    const contactIdMapping = new Map<string, string>();
    
    // Step 1: Migrate Organizations
    console.log('📦 Step 1: Migrating organizations...');
    let orgBatchNum = 0;
    let totalOrgs = 0;
    
    for await (const batch of extractCompanies(db, { batchSize: config.batchSize })) {
      orgBatchNum++;
      console.log(`  Processing batch ${orgBatchNum} (${batch.length} organizations)...`);
      
      // Upload raw data to Azure
      const blobUrl = await uploadBatchToAzure(
        containerClient,
        'CompanyLead',
        orgBatchNum,
        batch
      );
      console.log(`  ✓ Uploaded raw data to Azure: ${blobUrl}`);
      
      // Transform and deduplicate
      const transformedOrgs = [];
      for (const mongoDoc of batch) {
        // Migrate logo first if it exists
        let logoUrl = (mongoDoc as any).logo_url;
        if (logoUrl && typeof logoUrl === 'string') {
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
      console.log(`  Total organizations processed: ${totalOrgs}\n`);
      
      // Rate limiting
      await sleep(100);
    }
    
    // Step 2: Migrate Market Items (Products + Ingredients)
    console.log('📦 Step 2: Migrating market items...');
    let itemBatchNum = 0;
    let totalItems = 0;
    
    // Migrate products
    for await (const batch of extractProducts(db, { batchSize: config.batchSize })) {
      itemBatchNum++;
      console.log(`  Processing product batch ${itemBatchNum} (${batch.length} products)...`);
      
      await uploadBatchToAzure(containerClient, 'ProductLead', itemBatchNum, batch);
      
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
    for await (const batch of extractIngredients(db, { batchSize: config.batchSize })) {
      itemBatchNum++;
      console.log(`  Processing ingredient batch ${itemBatchNum} (${batch.length} ingredients)...`);
      
      await uploadBatchToAzure(containerClient, 'Ingredient', itemBatchNum, batch);
      
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
        console.log(`  ✓ Uploaded ${transformedItems.length} new ingredients`);
      }
      
      totalItems += batch.length;
      await sleep(100);
    }
    
    console.log(`  Total items processed: ${totalItems}\n`);
    
    // Step 3: Migrate Contacts
    console.log('📦 Step 3: Migrating contacts...');
    let contactBatchNum = 0;
    let totalContacts = 0;
    
    for await (const batch of extractContacts(db, { batchSize: config.batchSize })) {
      contactBatchNum++;
      console.log(`  Processing batch ${contactBatchNum} (${batch.length} contacts)...`);
      
      await uploadBatchToAzure(containerClient, 'PersonLead', contactBatchNum, batch);
      
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
      console.log(`  Total contacts processed: ${totalContacts}\n`);
      
      await sleep(100);
    }
    
    // Step 4: Migrate Purchases (Signals)
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
    
    let purchaseBatchNum = 0;
    let totalPurchases = 0;
    
    for await (const batch of extractPurchases(db, { batchSize: config.batchSize })) {
      purchaseBatchNum++;
      console.log(`  Processing batch ${purchaseBatchNum} (${batch.length} purchases)...`);
      
      await uploadBatchToAzure(containerClient, 'PurchaseLead', purchaseBatchNum, batch);
      
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
      console.log(`  Total purchases processed: ${totalPurchases} (${transformedSignals.length} signals created)\n`);
      
      await sleep(100);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Organizations: ${totalOrgs}`);
    console.log(`  - Market Items: ${totalItems}`);
    console.log(`  - Contacts: ${totalContacts}`);
    console.log(`  - Signals: ${totalPurchases}`);
    
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

