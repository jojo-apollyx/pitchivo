/**
 * Verification script to check migration results
 * 
 * Note: Loads environment variables from .env.local file by default
 *       Can specify different file with --env=.env.prod
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
  console.log(`✓ Environment loaded from: ${envPath}\n`);
}

import { createClient } from '@supabase/supabase-js';
import { MongoClient } from 'mongodb';
import { extractDomain, normalizeName } from '../shared/utils';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING || '';
const MONGODB_DATABASE_NAME = process.env.MONGODB_DATABASE_NAME || 'flash';

async function main() {
  console.log('🔍 Verifying migration results...\n');

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

  // Get counts from Supabase
  console.log('📊 Supabase Data:');
  
  const { count: orgCount } = await supabase
    .from('leads_organizations')
    .select('*', { count: 'exact', head: true });
  console.log(`  Organizations: ${orgCount || 0}`);

  const { count: itemCount } = await supabase
    .from('leads_market_items')
    .select('*', { count: 'exact', head: true });
  console.log(`  Market Items: ${itemCount || 0}`);

  const { count: contactCount } = await supabase
    .from('leads_contacts')
    .select('*', { count: 'exact', head: true });
  console.log(`  Contacts: ${contactCount || 0}`);

  const { count: signalCount } = await supabase
    .from('leads_signals')
    .select('*', { count: 'exact', head: true });
  console.log(`  Signals: ${signalCount || 0}`);

  // Get sample data
  console.log('\n📋 Sample Data:');
  
  const { data: sampleOrgs } = await supabase
    .from('leads_organizations')
    .select('id, name, domain, cached_roles')
    .limit(5);
  console.log('\n  Sample Organizations:');
  sampleOrgs?.forEach(org => {
    console.log(`    - ${org.name} (${org.domain || 'no domain'}) [${org.cached_roles?.join(', ') || 'no roles'}]`);
  });

  const { data: sampleSignals } = await supabase
    .from('leads_signals')
    .select('interaction_type, event_date')
    .limit(10);
  console.log('\n  Sample Signals:');
  const signalTypes = new Map<string, number>();
  sampleSignals?.forEach(signal => {
    const count = signalTypes.get(signal.interaction_type) || 0;
    signalTypes.set(signal.interaction_type, count + 1);
  });
  signalTypes.forEach((count, type) => {
    console.log(`    - ${type}: ${count}`);
  });

  // Check for organizations with roles
  console.log('\n📈 Statistics:');
  
  const { data: orgsWithRoles } = await supabase
    .from('leads_organizations')
    .select('cached_roles')
    .not('cached_roles', 'eq', '{}');
  console.log(`  Organizations with roles: ${orgsWithRoles?.length || 0}`);

  const { data: buyers } = await supabase
    .from('v_organizations_as_buyers')
    .select('id', { count: 'exact', head: true });
  console.log(`  Organizations as buyers: ${buyers?.length || 0}`);

  const { data: sellers } = await supabase
    .from('v_organizations_as_sellers')
    .select('id', { count: 'exact', head: true });
  console.log(`  Organizations as sellers: ${sellers?.length || 0}`);

  // Compare with MongoDB if connection string provided
  if (MONGODB_CONNECTION_STRING) {
    console.log('\n🔄 Comparing with MongoDB:');
    
    try {
      const mongoClient = new MongoClient(MONGODB_CONNECTION_STRING);
      await mongoClient.connect();
      
      // Use specified database name or default to 'flash' (same as migration script)
      const dbName = MONGODB_DATABASE_NAME || 'flash';
      const db = mongoClient.db(dbName);
      console.log(`  Using database: "${dbName}"`);

      const mongoOrgs = await db.collection('CompanyLead').countDocuments();
      const mongoProducts = await db.collection('ProductLead').countDocuments();
      const mongoContacts = await db.collection('PersonLead').countDocuments();
      const mongoPurchases = await db.collection('PurchaseLead').countDocuments();

      console.log(`\n  MongoDB Organizations: ${mongoOrgs.toLocaleString()}`);
      console.log(`  MongoDB Products: ${mongoProducts.toLocaleString()}`);
      console.log(`  MongoDB Contacts: ${mongoContacts.toLocaleString()}`);
      console.log(`  MongoDB Purchases: ${mongoPurchases.toLocaleString()}`);
      
      // Warn if MongoDB shows 0 organizations but Supabase has data
      if (mongoOrgs === 0 && (orgCount || 0) > 0) {
        console.log('\n  ⚠️  WARNING: MongoDB shows 0 organizations but Supabase has data!');
        console.log('     This suggests the database name might be incorrect.');
        console.log(`     Current database: "${dbName}"`);
        console.log('     Check MONGODB_DATABASE_NAME environment variable.');
        console.log('     Skipping detailed analysis...\n');
        await mongoClient.close();
        return;
      }

      console.log('\n  Migration Coverage:');
      const orgCoverage = ((orgCount || 0) / mongoOrgs * 100).toFixed(1);
      const itemCoverage = ((itemCount || 0) / mongoProducts * 100).toFixed(1);
      const contactCoverage = ((contactCount || 0) / mongoContacts * 100).toFixed(1);
      const signalCoverage = ((signalCount || 0) / mongoPurchases * 100).toFixed(1);
      
      console.log(`    Organizations: ${orgCoverage}% (${orgCount || 0}/${mongoOrgs})`);
      console.log(`    Market Items: ${itemCoverage}% (${itemCount || 0}/${mongoProducts})`);
      console.log(`    Contacts: ${contactCoverage}% (${contactCount || 0}/${mongoContacts})`);
      console.log(`    Signals: ${signalCoverage}% (${signalCount || 0}/${mongoPurchases})`);

      // Diagnose organization filtering
      if (mongoOrgs > (orgCount || 0)) {
        console.log('\n🔍 Diagnosing Organization Filtering:');
        const missing = mongoOrgs - (orgCount || 0);
        console.log(`  Missing: ${missing.toLocaleString()} organizations (${((missing / mongoOrgs) * 100).toFixed(1)}%)`);
        
        // Sample organizations to analyze
        const sampleSize = Math.min(10000, mongoOrgs);
        const allOrgs = await db.collection('CompanyLead')
          .find({})
          .limit(sampleSize)
          .toArray();
        
        // Count organizations without domain or normalized_name
        let noDomainOrName = 0;
        const orgsWithoutKey: any[] = [];
        
        // Track duplicates by domain and normalized_name
        const domainMap = new Map<string, number>();
        const normalizedNameMap = new Map<string, number>();
        
        for (const org of allOrgs) {
          const domain = extractDomain(org.website_url);
          const normalizedName = normalizeName(org.name);
          
          if (!domain && !normalizedName) {
            noDomainOrName++;
            if (orgsWithoutKey.length < 10) {
              orgsWithoutKey.push({ name: org.name, website_url: org.website_url, _id: org._id });
            }
          }
          
          if (domain) {
            domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
          }
          
          if (normalizedName) {
            normalizedNameMap.set(normalizedName, (normalizedNameMap.get(normalizedName) || 0) + 1);
          }
        }
        
        // Count duplicates
        const duplicateDomains = Array.from(domainMap.values()).filter(count => count > 1).length;
        const duplicateNames = Array.from(normalizedNameMap.values()).filter(count => count > 1).length;
        const totalDuplicateDomainOrgs = Array.from(domainMap.values())
          .filter(count => count > 1)
          .reduce((sum, count) => sum + count - 1, 0);
        const totalDuplicateNameOrgs = Array.from(normalizedNameMap.values())
          .filter(count => count > 1)
          .reduce((sum, count) => sum + count - 1, 0);
        
        // Extrapolate to full dataset
        const extrapolationFactor = mongoOrgs / sampleSize;
        const estimatedNoKey = Math.round(noDomainOrName * extrapolationFactor);
        const estimatedDuplicateDomainOrgs = Math.round(totalDuplicateDomainOrgs * extrapolationFactor);
        const estimatedDuplicateNameOrgs = Math.round(totalDuplicateNameOrgs * extrapolationFactor);
        
        console.log(`\n  Analysis (sampled ${sampleSize.toLocaleString()} of ${mongoOrgs.toLocaleString()}):`);
        console.log(`    Organizations without domain AND normalized_name: ~${estimatedNoKey.toLocaleString()}`);
        if (orgsWithoutKey.length > 0) {
          console.log(`    Sample organizations without key:`);
          orgsWithoutKey.forEach(org => {
            console.log(`      - "${org.name}" (website: ${org.website_url || 'none'})`);
          });
        }
        
        console.log(`\n    Duplicate domains: ${duplicateDomains.toLocaleString()} unique domains with duplicates`);
        console.log(`      Estimated duplicate orgs by domain: ~${estimatedDuplicateDomainOrgs.toLocaleString()}`);
        
        console.log(`    Duplicate normalized names: ${duplicateNames.toLocaleString()} unique names with duplicates`);
        console.log(`      Estimated duplicate orgs by name: ~${estimatedDuplicateNameOrgs.toLocaleString()}`);
        
        console.log(`\n  Summary of likely filtering:`);
        console.log(`    - Missing domain/name: ~${estimatedNoKey.toLocaleString()}`);
        console.log(`    - Deduplicated by domain: ~${estimatedDuplicateDomainOrgs.toLocaleString()}`);
        console.log(`    - Deduplicated by name: ~${estimatedDuplicateNameOrgs.toLocaleString()}`);
        console.log(`    - Total estimated filtered: ~${(estimatedNoKey + estimatedDuplicateDomainOrgs + estimatedDuplicateNameOrgs).toLocaleString()}`);
        console.log(`    - Actual missing: ${missing.toLocaleString()}`);
      }

      await mongoClient.close();
    } catch (error: any) {
      console.error('  ⚠️  Could not connect to MongoDB:', error.message);
    }
  }

  console.log('\n✅ Verification complete!\n');
}

if (require.main === module) {
  main().catch(console.error);
}

export { main };

