#!/usr/bin/env node

/**
 * Backfill HS codes for leads_market_items using AI
 * 
 * Usage (local):
 *   npm run backfill:hs-codes
 *   npm run backfill:hs-codes -- --local
 * 
 * Usage (production):
 *   npm run backfill:hs-codes:prod
 *   npm run backfill:hs-codes -- --prod
 *   npm run backfill:hs-codes -- --env=.env.prod
 * 
 * Note: Loads environment variables from .env.local file by default (local)
 *       Use --prod flag or --env=.env.prod for production
 */

// Parse command line arguments first to get env file
function parseArgs() {
  const args = process.argv.slice(2);
  
  // Check for explicit --local or --prod flags
  const isLocal = args.includes('--local');
  const isProd = args.includes('--prod');
  
  // If explicit flags are provided, use them
  if (isLocal) {
    return { envFile: '.env.local', environment: 'local' };
  }
  if (isProd) {
    return { envFile: '.env.prod', environment: 'prod' };
  }
  
  // Otherwise, check for --env flag
  const envFileArg = args.find(arg => 
    (arg.startsWith('--env-file=') || arg.startsWith('--env='))
  );
  const envFile = envFileArg 
    ? (envFileArg.split('=')[1] || '.env.local')
    : '.env.local';
  
  const environment = envFile.includes('prod') ? 'prod' : 'local';
  return { envFile, environment };
}

// Load environment variables from specified file (defaults to .env.local)
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

const { envFile, environment } = parseArgs();
const envPath = envFile.startsWith('/') 
  ? envFile 
  : resolve(process.cwd(), 'apps/web', envFile);

console.log(`📄 Loading ${environment} environment from: ${envPath}`);

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
import { createAzure } from '@ai-sdk/azure';
import { generateText } from 'ai';

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY || '';
const AZURE_OPENAI_RESOURCE_NAME = process.env.AZURE_OPENAI_RESOURCE_NAME || '';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

if (!AZURE_OPENAI_API_KEY || !AZURE_OPENAI_RESOURCE_NAME) {
  console.error('❌ Error: AZURE_OPENAI_API_KEY and AZURE_OPENAI_RESOURCE_NAME are required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Initialize Azure OpenAI client
const azure = createAzure({
  resourceName: AZURE_OPENAI_RESOURCE_NAME,
  apiKey: AZURE_OPENAI_API_KEY,
});

const model = azure(AZURE_OPENAI_DEPLOYMENT);

/**
 * Get HS code for a market item using AI
 */
async function getHSCode(
  name: string,
  category: string | null,
  aliases: string[] | null
): Promise<string | null> {
  const aliasesText = aliases && aliases.length > 0 
    ? aliases.join(', ') 
    : 'None';
  const categoryText = category || 'Not specified';

  const prompt = `Determine the most appropriate Harmonized System (HS) code for the following product/item.

Product Information:
- Name: ${name}
- Category: ${categoryText}
- Aliases/Synonyms: ${aliasesText}

HS codes are 6-digit codes used for international trade classification. The code should be:
- 6 digits (e.g., "123456")
- The most specific code that matches this product
- Based on the product's primary use and composition

Return ONLY the 6-digit HS code, nothing else. If you cannot determine a code with reasonable confidence, return "null".

HS Code:`;

  try {
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert in international trade classification and Harmonized System (HS) codes. Return only the 6-digit HS code or "null" if uncertain. Never generate fake codes.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const hsCode = text.trim().toLowerCase();
    
    // Validate HS code format (should be 6 digits)
    if (hsCode === 'null' || hsCode === 'none' || hsCode === '') {
      return null;
    }

    // Extract 6-digit code (handle cases where AI might add extra text)
    const codeMatch = hsCode.match(/\b(\d{6})\b/);
    if (codeMatch) {
      return codeMatch[1];
    }

    // If it's already 6 digits, return as is
    if (/^\d{6}$/.test(hsCode)) {
      return hsCode;
    }

    console.warn(`  ⚠️  Invalid HS code format: ${text.trim()}`);
    return null;
  } catch (error: any) {
    console.error(`  ❌ Error getting HS code: ${error.message}`);
    return null;
  }
}

/**
 * Backfill HS codes for all market items
 */
async function backfillHSCodes() {
  console.log('🚀 Starting HS code backfill...\n');

  // Fetch all market items that don't have HS codes yet (with pagination)
  // Prioritize is_standard_ingredient=TRUE items first
  console.log('📥 Fetching market items without HS codes (prioritizing standard ingredients)...');
  let allItems: Array<{ id: string; name: string; category: string | null; aliases: string[] | null; hs_code: string | null }> = [];
  const pageSize = 1000;

  // Phase 1: Fetch standard ingredients first
  console.log('   Phase 1: Fetching standard ingredients (is_standard_ingredient=TRUE)...');
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data: pageItems, error: fetchError } = await supabase
      .from('leads_market_items')
      .select('id, name, category, aliases, hs_code')
      .is('hs_code', null)
      .eq('is_standard_ingredient', true)
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (fetchError) {
      console.error(`❌ Error fetching standard ingredients: ${fetchError.message}`);
      process.exit(1);
    }

    if (pageItems && pageItems.length > 0) {
      allItems = allItems.concat(pageItems);
      offset += pageItems.length;
      hasMore = pageItems.length === pageSize;
      process.stdout.write(`   Fetched ${allItems.length.toLocaleString()} standard ingredients...\r`);
    } else {
      hasMore = false;
    }
  }

  const standardIngredientCount = allItems.length;
  console.log(`\n   Found ${standardIngredientCount.toLocaleString()} standard ingredients to process`);

  // Phase 2: Fetch other items
  console.log('   Phase 2: Fetching other items...');
  offset = 0;
  hasMore = true;

  while (hasMore) {
    const { data: pageItems, error: fetchError } = await supabase
      .from('leads_market_items')
      .select('id, name, category, aliases, hs_code')
      .is('hs_code', null)
      .or('is_standard_ingredient.is.null,is_standard_ingredient.eq.false')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (fetchError) {
      console.error(`❌ Error fetching other items: ${fetchError.message}`);
      process.exit(1);
    }

    if (pageItems && pageItems.length > 0) {
      allItems = allItems.concat(pageItems);
      offset += pageItems.length;
      hasMore = pageItems.length === pageSize;
      process.stdout.write(`   Fetched ${allItems.length.toLocaleString()} items total...\r`);
    } else {
      hasMore = false;
    }
  }

  console.log(`\n   Found ${allItems.length.toLocaleString()} items to process (${standardIngredientCount.toLocaleString()} standard ingredients, ${(allItems.length - standardIngredientCount).toLocaleString()} others)\n`);

  if (allItems.length === 0) {
    console.log('✓ No items found that need HS codes. All items already have HS codes or table is empty.');
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Process items in batches to avoid rate limiting
  const batchSize = 10;
  for (let i = 0; i < allItems.length; i += batchSize) {
    const batch = allItems.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allItems.length / batchSize)} (items ${i + 1}-${Math.min(i + batchSize, allItems.length)}/${allItems.length.toLocaleString()})`);

    // Process batch with a small delay between items
    for (const item of batch) {
      try {
        console.log(`\n  🔍 Processing: ${item.name} (ID: ${item.id})`);

        // Skip if already has HS code (double-check in case it was updated)
        if (item.hs_code) {
          console.log(`  ⏭️  Already has HS code: ${item.hs_code}`);
          skippedCount++;
          continue;
        }

        const hsCode = await getHSCode(
          item.name,
          item.category,
          item.aliases
        );

        if (hsCode) {
          // Update the item with the HS code
          const { error: updateError } = await supabase
            .from('leads_market_items')
            .update({ hs_code: hsCode })
            .eq('id', item.id);

          if (updateError) {
            console.error(`  ❌ Error updating item: ${updateError.message}`);
            failureCount++;
          } else {
            console.log(`  ✓ HS Code: ${hsCode}`);
            successCount++;
          }
        } else {
          console.log(`  ⚠️  Could not determine HS code`);
          failureCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`  ❌ Error processing item ${item.id}: ${error.message}`);
        failureCount++;
      }
    }

    // Longer delay between batches
    if (i + batchSize < allItems.length) {
      console.log(`\n  ⏸️  Waiting 2 seconds before next batch...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary:');
  console.log(`  ✓ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failureCount}`);
  console.log(`  ⏭️  Skipped: ${skippedCount}`);
  console.log(`  📦 Total: ${allItems.length.toLocaleString()}`);
  console.log('='.repeat(60));
}

// Run the backfill
backfillHSCodes()
  .then(() => {
    console.log('\n✅ Backfill completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });

