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
  
  // Handle both --limit=10 and --limit 10 formats
  let limit = 10;
  const limitArg = args.find((arg, i) => arg === '--limit' || arg.startsWith('--limit='));
  if (limitArg) {
    if (limitArg.startsWith('--limit=')) {
      limit = parseInt(limitArg.split('=')[1] || '10', 10);
    } else {
      const limitIndex = args.indexOf('--limit');
      limit = parseInt(args[limitIndex + 1] || '10', 10);
    }
  }
  
  // Handle both --skip=0 and --skip 0 formats
  let skip = 0;
  const skipArg = args.find((arg, i) => arg === '--skip' || arg.startsWith('--skip='));
  if (skipArg) {
    if (skipArg.startsWith('--skip=')) {
      skip = parseInt(skipArg.split('=')[1] || '0', 10);
    } else {
      const skipIndex = args.indexOf('--skip');
      skip = parseInt(args[skipIndex + 1] || '0', 10);
    }
  }
  
  return { envFile, limit, skip };
}

// Load environment variables from specified file (defaults to .env.local)
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';

// Parse args to get env file first (before loading env)
const { envFile: parsedEnvFile } = (() => {
  const args = process.argv.slice(2);
  // Support both --env-file= and --env= flags (--env-file might conflict with Node/tsx)
  const envFileArg = args.find(arg => arg.startsWith('--env-file=') || arg.startsWith('--env='));
  const envFile = envFileArg 
    ? (envFileArg.split('=')[1] || '.env.local')
    : '.env.local';
  return { envFile };
})();

import { existsSync } from 'fs';

const envPath = parsedEnvFile.startsWith('/') 
  ? parsedEnvFile 
  : resolve(process.cwd(), 'apps/web', parsedEnvFile);

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

// Store envFile for later use
const envFile = parsedEnvFile;

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

// Note: parseArgs is now defined above for env file parsing

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
  const { limit, skip } = parseArgs();
  console.log(`🧪 Starting TEST MongoDB migration`);
  console.log(`   Limit: ${limit} records`);
  console.log(`   Skip: ${skip} records`);
  console.log(`   Env file: ${parsedEnvFile}\n`);
  
  // Debug: Show environment variables being used
  console.log('🔍 Environment variables:');
  console.log(`   MONGODB_CONNECTION_STRING: ${config.mongo.connectionString ? '✓ Set' : '✗ Missing'}`);
  console.log(`   AZURE_STORAGE_ACCOUNT_NAME: ${config.azure.accountName ? '✓ Set' : '✗ Missing'}`);
  console.log(`   AZURE_STORAGE_CONTAINER_NAME: ${config.azure.containerName}`);
  console.log(`   AZURE_STORAGE_LOGO_CONTAINER_NAME: ${process.env.AZURE_STORAGE_LOGO_CONTAINER_NAME || 'company-logos (default)'}`);
  console.log(`   SUPABASE_URL: ${config.supabase.url ? '✓ Set' : '✗ Missing'}\n`);
  
  validateConfig();
  
  // Initialize clients
  const mongoClient = new MongoClient(config.mongo.connectionString);
  const supabase = getSupabaseClient(config.supabase);
  const containerClient = getAzureContainerClient(config.azure);
  
  // Logo container (public access) - read from environment
  const logoContainerName = process.env.AZURE_STORAGE_LOGO_CONTAINER_NAME || 'company-logos';
  console.log(`📦 Using logo container: ${logoContainerName}`);
  
  // Ensure we're using the logo container, not the raw data container
  const logoContainerClient = getAzureContainerClient({
    accountName: config.azure.accountName,
    accountKey: config.azure.accountKey,
    containerName: logoContainerName, // Explicitly use logo container name
  });
  
  // Verify container names are different
  if (config.azure.containerName === logoContainerName) {
    console.warn(`⚠️  WARNING: Logo container name matches raw data container name: ${logoContainerName}`);
    console.warn(`    Logos should go to a separate container, not '${config.azure.containerName}'`);
  }
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoClient.connect();
    
    // Use specified database name or extract from connection string
    const dbName = config.mongo.databaseName || 'flash';
    const db = mongoClient.db(dbName);
    console.log(`✓ Connected to MongoDB (database: "${dbName}")\n`);
    
    // Diagnostic: List all databases
    console.log('🔍 Checking available databases...');
    const adminDb = mongoClient.db().admin();
    const databases = await adminDb.listDatabases();
    console.log(`  Found ${databases.databases.length} databases:`);
    databases.databases.forEach((dbInfo: any) => {
      console.log(`    - ${dbInfo.name} (${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');
    
    // Diagnostic: List all collections and their counts
    console.log(`🔍 Checking collections in database "${dbName}"...`);
    const collections = await db.listCollections().toArray();
    console.log(`  Found ${collections.length} collections:`);
    
    if (collections.length === 0) {
      console.log('  ⚠️  No collections found in this database!');
      console.log('  💡 Possible issues:');
      console.log('     - Connection string points to wrong database');
      console.log('     - Database name in connection string is incorrect');
      console.log('     - Database is empty');
      console.log('  💡 Check your MONGODB_CONNECTION_STRING - it should include the database name');
      console.log('     Example: mongodb://user:pass@host:27017/database_name\n');
    } else {
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`    - ${coll.name}: ${count} documents`);
      }
      console.log('');
    }
    
    // Check for expected collections
    const expectedCollections = ['CompanyLead', 'ProductLead', 'PersonLead', 'PurchaseLead', 'Ingredient'];
    const foundCollections = collections.map(c => c.name);
    const missingCollections = expectedCollections.filter(name => !foundCollections.includes(name));
    
    if (missingCollections.length > 0 && collections.length > 0) {
      console.log(`  ⚠️  Missing expected collections: ${missingCollections.join(', ')}`);
      console.log(`  ℹ️  Available collections: ${foundCollections.join(', ')}\n`);
    }
    
    // Ensure Azure containers exist
    console.log('☁️  Setting up Azure Blob Storage...');
    console.log(`  Raw data container: ${config.azure.containerName}`);
    console.log(`  Logo container: ${logoContainerName}`);
    await ensureContainerExists(containerClient); // Raw data is private (no access parameter)
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
      
      // Stop if we've reached the limit
      if (totalOrgs >= limit) {
        break;
      }
    }
    
    // Step 2: Migrate Market Items (Products + Ingredients)
    console.log('📦 Step 2: Migrating market items...');
    let itemBatchNum = 0;
    let totalItems = 0;
    // Calculate remaining limit after organizations (use 30% for items)
    const remainingLimit = limit - totalOrgs;
    const itemLimit = Math.max(0, Math.floor(remainingLimit * 0.3)); // Use 30% of remaining for items
    
    if (itemLimit <= 0) {
      console.log(`  ⏭️  Skipping items (limit reached: ${totalOrgs}/${limit} organizations)\n`);
    } else {
      console.log(`  📊 Item limit: ${itemLimit} (${remainingLimit} remaining after ${totalOrgs} orgs)`);
      
      // Migrate products
      const productBatchSize = Math.min(config.batchSize || 1000, itemLimit);
      for await (const batch of extractProducts(db, { 
        batchSize: productBatchSize, 
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
    
      // Migrate ingredients (only if we haven't reached the item limit)
      const remainingItemLimit = Math.max(0, itemLimit - totalItems);
      if (remainingItemLimit > 0) {
        const ingredientBatchSize = Math.min(config.batchSize || 1000, remainingItemLimit);
        for await (const batch of extractIngredients(db, { 
          batchSize: ingredientBatchSize, 
          limit: remainingItemLimit 
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
      }
      
      console.log(`  Total items processed: ${totalItems}\n`);
    }
    
    // Step 3: Migrate Contacts
    console.log('📦 Step 3: Migrating contacts...');
    let contactBatchNum = 0;
    let totalContacts = 0;
    const remainingAfterItems = limit - totalOrgs - totalItems;
    const contactLimit = Math.max(0, Math.floor(remainingAfterItems * 0.5)); // Use 50% of remaining for contacts
    
    if (contactLimit <= 0) {
      console.log(`  ⏭️  Skipping contacts (limit reached: ${totalOrgs + totalItems}/${limit})\n`);
    } else {
      const contactBatchSize = Math.min(config.batchSize || 1000, contactLimit);
      for await (const batch of extractContacts(db, { 
        batchSize: contactBatchSize, 
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
        await sleep(100);
        
        if (totalContacts >= contactLimit) break;
      }
      
      console.log(`  Total contacts processed: ${totalContacts}\n`);
    }
    
    // Step 4: Migrate Purchases (Signals) - skip for test or use very small limit
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
    const remainingAfterContacts = limit - totalOrgs - totalItems - totalContacts;
    const purchaseLimit = Math.max(0, remainingAfterContacts); // Use all remaining for purchases
    
    if (purchaseLimit <= 0) {
      console.log(`  ⏭️  Skipping purchases (limit reached: ${totalOrgs + totalItems + totalContacts}/${limit})\n`);
    } else {
      const purchaseBatchSize = Math.min(config.batchSize || 1000, purchaseLimit);
      for await (const batch of extractPurchases(db, { 
        batchSize: purchaseBatchSize, 
        limit: purchaseLimit 
      })) {
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
        await sleep(100);
        
        if (totalPurchases >= purchaseLimit) break;
      }
      
      console.log(`  Total purchases processed: ${totalPurchases}\n`);
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

