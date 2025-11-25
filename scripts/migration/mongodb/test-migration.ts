#!/usr/bin/env node

/**
 * Test MongoDB migration script - migrates a limited number of records
 * 
 * Usage:
 *   npm run migrate:mongodb:test
 *   npm run migrate:mongodb:test -- --limit 10
 *   npm run migrate:mongodb:test -- --limit 50 --skip 0
 * 
 * Environment variables required:
 *   MONGODB_CONNECTION_STRING
 *   AZURE_STORAGE_ACCOUNT_NAME
 *   AZURE_STORAGE_ACCOUNT_KEY
 *   AZURE_STORAGE_CONTAINER_NAME (for raw data)
 *   AZURE_STORAGE_LOGO_CONTAINER_NAME (for logos, defaults to 'company-logos')
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { MongoClient } from 'mongodb';
import { getSupabaseClient } from '../shared/supabase-client';
import { getAzureContainerClient } from '../shared/azure-client';
import { ensureContainerExists, uploadBatchToAzure } from './azure-storage';
import { PublicAccessType } from '@azure/storage-blob';
import { extractCompanies, extractProducts, extractContacts, extractPurchases, extractIngredients } from './extract';
import { transformCompany, transformProduct, transformContact, transformPurchase } from './transform';
import { deduplicateOrganization, deduplicateMarketItem, deduplicateContact } from './deduplicate';
import { uploadOrganizations, uploadMarketItems, uploadContacts, uploadSignals } from './upload';
import { sleep } from '../shared/utils';
import { migrateCompanyLogo } from './logo-migration';
import type { MigrationConfig } from '../shared/types';
import type { MongoCompanyLead } from './types';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '10', 10);
  const skip = parseInt(args.find(arg => arg.startsWith('--skip='))?.split('=')[1] || '0', 10);
  return { limit, skip };
}

// Load environment variables
const { limit, skip } = parseArgs();
const config: MigrationConfig = {
  mongo: {
    connectionString: process.env.MONGODB_CONNECTION_STRING || '',
  },
  azure: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || '',
    accountKey: process.env.AZURE_STORAGE_ACCOUNT_KEY || '',
    containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'mongodb-raw-data',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  batchSize: Math.min(parseInt(process.env.BATCH_SIZE || '1000', 10), limit), // Don't exceed limit
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
  console.log(`🧪 Starting TEST MongoDB migration (limit: ${limit}, skip: ${skip})...\n`);
  
  validateConfig();
  
  // Initialize clients
  const mongoClient = new MongoClient(config.mongo.connectionString);
  const supabase = getSupabaseClient(config.supabase);
  const containerClient = getAzureContainerClient(config.azure);
  
  // Logo container (public access)
  const logoContainerName = process.env.AZURE_STORAGE_LOGO_CONTAINER_NAME || 'company-logos';
  const logoContainerClient = getAzureContainerClient({
    ...config.azure,
    containerName: logoContainerName,
  });
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoClient.connect();
    const db = mongoClient.db();
    console.log('✓ Connected to MongoDB\n');
    
    // Ensure Azure containers exist
    console.log('☁️  Setting up Azure Blob Storage...');
    await ensureContainerExists(containerClient, 'none' as PublicAccessType); // Raw data is private
    await ensureContainerExists(logoContainerClient, 'blob' as PublicAccessType); // Logos are public
    console.log('✓ Azure containers ready (logos container is public)\n');
    
    // ID mappings for resolving references
    const orgIdMapping = new Map<string, string>(); // mongo_id -> supabase_id
    const itemIdMapping = new Map<string, string>();
    const contactIdMapping = new Map<string, string>();
    
    // Step 1: Migrate Organizations (with logo migration)
    console.log('📦 Step 1: Migrating organizations...');
    let orgBatchNum = 0;
    let totalOrgs = 0;
    
    for await (const batch of extractCompanies(db, { 
      batchSize: config.batchSize, 
      limit, 
      skip 
    })) {
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
            console.log(`    Migrating logo for ${mongoDoc.name}: ${logoUrl}`);
            const migratedLogoUrl = await migrateCompanyLogo(
              logoUrl,
              mongoDoc._id.toString(),
              logoContainerClient
            );
            if (migratedLogoUrl) {
              logoUrl = migratedLogoUrl;
              console.log(`    ✓ Logo migrated: ${migratedLogoUrl}`);
            }
          } catch (error: any) {
            console.warn(`    ⚠️  Failed to migrate logo: ${error.message}`);
            // Continue with original URL if migration fails
          }
        }
        
        const transformed = transformCompany(mongoDoc);
        // Update logo URL in profile_data
        if (logoUrl) {
          transformed.profile_data.logo_url = logoUrl;
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
      
      // Stop if we've reached the limit
      if (totalOrgs >= limit) {
        break;
      }
    }
    
    // Step 2: Migrate Market Items (Products + Ingredients)
    console.log('📦 Step 2: Migrating market items...');
    let itemBatchNum = 0;
    let totalItems = 0;
    const itemLimit = Math.floor(limit * 0.5); // Migrate fewer items for test
    
    // Migrate products
    for await (const batch of extractProducts(db, { 
      batchSize: config.batchSize, 
      limit: itemLimit 
    })) {
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
      
      if (totalItems >= itemLimit) break;
    }
    
    // Migrate ingredients
    for await (const batch of extractIngredients(db, { 
      batchSize: config.batchSize, 
      limit: itemLimit - totalItems 
    })) {
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
      
      if (totalItems >= itemLimit) break;
    }
    
    console.log(`  Total items processed: ${totalItems}\n`);
    
    // Step 3: Migrate Contacts
    console.log('📦 Step 3: Migrating contacts...');
    let contactBatchNum = 0;
    let totalContacts = 0;
    const contactLimit = Math.floor(limit * 0.3); // Migrate fewer contacts for test
    
    for await (const batch of extractContacts(db, { 
      batchSize: config.batchSize, 
      limit: contactLimit 
    })) {
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
      
      if (totalContacts >= contactLimit) break;
    }
    
    // Step 4: Migrate Purchases (Signals) - skip for test or use very small limit
    console.log('📦 Step 4: Migrating purchases (signals)...');
    let purchaseBatchNum = 0;
    let totalPurchases = 0;
    const purchaseLimit = Math.floor(limit * 0.2);
    
    for await (const batch of extractPurchases(db, { 
      batchSize: config.batchSize, 
      limit: purchaseLimit 
    })) {
      purchaseBatchNum++;
      console.log(`  Processing batch ${purchaseBatchNum} (${batch.length} purchases)...`);
      
      await uploadBatchToAzure(containerClient, 'PurchaseLead', purchaseBatchNum, batch);
      
      const transformedSignals = [];
      for (const mongoDoc of batch) {
        // Resolve buyer company
        const buyerMongoId = mongoDoc.buyer_company?.$id?.$oid;
        const orgId = buyerMongoId ? orgIdMapping.get(buyerMongoId) || null : null;
        
        // Resolve item (by ingredient_base_name)
        const itemName = mongoDoc.ingredient_base_name;
        let itemId: string | null = null;
        if (itemName) {
          // Try to find item by normalized name
          const normalizedName = itemName.toLowerCase().trim();
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
        
        if (orgId && itemId) {
          const transformed = transformPurchase(mongoDoc, orgId, itemId);
          transformedSignals.push(transformed);
        }
      }
      
      if (transformedSignals.length > 0) {
        await uploadSignals(supabase, transformedSignals);
        console.log(`  ✓ Uploaded ${transformedSignals.length} signals`);
      }
      
      totalPurchases += batch.length;
      console.log(`  Total purchases processed: ${totalPurchases}\n`);
      
      await sleep(100);
      
      if (totalPurchases >= purchaseLimit) break;
    }
    
    console.log('✅ Test migration completed successfully!');
    console.log(`\nSummary:`);
    console.log(`  - Organizations: ${totalOrgs}`);
    console.log(`  - Market Items: ${totalItems}`);
    console.log(`  - Contacts: ${totalContacts}`);
    console.log(`  - Signals: ${totalPurchases}`);
    console.log(`\n💡 To run full migration, use: npm run migrate:mongodb`);
    
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

