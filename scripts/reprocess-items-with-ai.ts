/**
 * Reprocess existing market items with AI inference to fill missing data
 * 
 * Usage: 
 *   npm run reprocess:items:ai        (local - uses .env.local)
 *   npm run reprocess:items:ai:prod    (prod - uses .env.prod)
 * 
 * This script:
 * - Finds market items that need AI inference (missing category, aliases, description, etc.)
 * - Uses AI to infer missing data
 * - Updates items in database
 * - REQUIRES Azure OpenAI to be configured (throws error if not)
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { createAzure } from '@ai-sdk/azure'
import { generateText } from 'ai'

// Parse command line arguments for --env flag
const args = process.argv.slice(2)
const envFileArg = args.find(arg => arg.startsWith('--env=') || arg.startsWith('--env-file='))
const envFile = envFileArg 
  ? (envFileArg.split('=')[1] || '.env.local')
  : '.env.local'

// Resolve env file path
const envPath = envFile.startsWith('/') 
  ? envFile 
  : resolve(process.cwd(), 'apps/web', envFile)

console.log(`📄 Loading environment from: ${envPath}`)

if (!existsSync(envPath)) {
  console.error(`❌ Error: Environment file not found: ${envPath}`)
  process.exit(1)
}

// Load environment variables
loadEnv({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AZURE_RESOURCE_NAME = process.env.AZURE_OPENAI_RESOURCE_NAME
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini'

/**
 * Infer market item details using AI (same logic as infer-item.ts)
 */
async function inferItemWithAI(
  item: any,
  azure: any,
  model: any
): Promise<{
  category: string | null
  item_type: string
  description: string | null
  aliases: string[]
  applications: string[]
  end_uses: string[]
  form: string | null
}> {
  const name = item.name
  const existingCategory = item.category
  const existingForm = item.attributes?.form || null
  const existingCategories = item.attributes?.categories || []
  const existingApplications = item.attributes?.applications || []
  const existingEndUses = item.attributes?.end_uses || []
  const existingDescription = item.description

  const prompt = `Analyze the following ingredient/product name and infer appropriate details. Return ONLY a JSON object with this structure:
{
  "category": "category name or null",
  "item_type": "ingredient" or "product",
  "description": "brief description based on ingredient knowledge (2-3 sentences)",
  "aliases": ["common alias 1", "common alias 2"],
  "applications": ["application 1", "application 2"],
  "end_uses": ["end use 1", "end use 2"],
  "form": "Powder" or "Liquid" or "Extract" or "Capsule" or null,
  "category_hint": "additional category context"
}

Ingredient/Product Name: "${name}"
${existingCategory ? `Existing Category: "${existingCategory}"` : ''}
${existingForm ? `Form (existing): "${existingForm}"` : ''}
${existingCategories.length > 0 ? `Categories (existing): ${JSON.stringify(existingCategories)}` : ''}
${existingApplications.length > 0 ? `Applications (existing): ${existingApplications.join(', ')}` : ''}
${existingDescription ? `Existing Description: "${existingDescription}"` : ''}

IMPORTANT:
- Use your knowledge of ingredients, supplements, and food products
- Infer category based on ingredient type (e.g., "Garlic Extract" -> "Botanical Extracts", "Vitamin C" -> "Vitamins")
- Infer applications based on common uses (e.g., dietary supplements, food fortification, functional foods)
- Only include aliases that are commonly used for this ingredient
- Description should be factual and based on ingredient knowledge, not generic
- If category/description already exists, you can enhance it but don't change it unnecessarily
- Return ONLY valid JSON, no markdown, no code blocks`;

  const { text } = await generateText({
    model,
    messages: [
      {
        role: 'system',
        content: 'You are an ingredient and product classification assistant. Return only valid JSON. Use your knowledge of ingredients, supplements, and food products to infer appropriate details. Never generate fake data - only use real knowledge about ingredients.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    maxTokens: 500,
  } as any);

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const aiInferred = JSON.parse(jsonMatch[0]);

  // Merge: existing data takes precedence, AI fills gaps
  return {
    category: existingCategory || aiInferred.category || null,
    item_type: item.item_type || aiInferred.item_type || 'ingredient',
    description: existingDescription || aiInferred.description || null,
    aliases: aiInferred.aliases || [],
    applications: existingApplications.length > 0 ? existingApplications : (aiInferred.applications || []),
    end_uses: existingEndUses.length > 0 ? existingEndUses : (aiInferred.end_uses || []),
    form: existingForm || aiInferred.form || null,
  };
}

async function reprocessItemsWithAI() {
  console.log('\n🚀 Reprocessing market items with AI inference...\n')

  // Validate Azure OpenAI is configured (REQUIRED)
  console.log('🔍 Checking Azure OpenAI configuration...')
  console.log(`   AZURE_OPENAI_RESOURCE_NAME: ${AZURE_RESOURCE_NAME ? '✅ Set' : '❌ Missing'}`)
  console.log(`   AZURE_OPENAI_API_KEY: ${AZURE_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`   AZURE_OPENAI_DEPLOYMENT: ${AZURE_DEPLOYMENT}\n`)

  if (!AZURE_RESOURCE_NAME || !AZURE_API_KEY) {
    console.error('❌ ERROR: Azure OpenAI is REQUIRED for this script')
    console.error('   Set AZURE_OPENAI_RESOURCE_NAME and AZURE_OPENAI_API_KEY in your .env file')
    console.error(`   Current env file: ${envPath}`)
    console.error('   This script will not run without AI configuration')
    process.exit(1)
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const azure = createAzure({
    resourceName: AZURE_RESOURCE_NAME,
    apiKey: AZURE_API_KEY
  })
  const model = azure(AZURE_DEPLOYMENT)

  console.log(`✅ Azure OpenAI configured: ${AZURE_DEPLOYMENT}\n`)

  // Find items that need AI inference
  // Criteria: missing category, aliases, description, or ai_inferred flag is false/missing
  // We'll filter in code since Supabase OR with JSONB is complex
  const { data: allItems, error } = await supabase
    .from('leads_market_items')
    .select('id, name, category, item_type, description, aliases, attributes')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching items:', error)
    process.exit(1)
  }

  // Filter items that need AI inference
  const items = (allItems || []).filter(item => {
    const needsCategory = !item.category
    const needsDescription = !item.description
    const needsAliases = !item.aliases || (Array.isArray(item.aliases) && item.aliases.length === 0)
    const aiInferred = item.attributes?.ai_inferred === true
    
    // Include if missing any field OR ai_inferred is false/missing
    return (needsCategory || needsDescription || needsAliases || !aiInferred)
  })

  if (error) {
    console.error('❌ Error fetching items:', error)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('✅ No items need AI reprocessing!\n')
    process.exit(0)
  }

  console.log(`📝 Found ${items.length} items to reprocess...\n`)

  let succeeded = 0
  let failed = 0
  let skipped = 0

  for (const item of items) {
    try {
      // Check if item really needs processing
      const needsCategory = !item.category
      const needsDescription = !item.description
      const needsAliases = !item.aliases || item.aliases.length === 0
      const aiInferred = item.attributes?.ai_inferred === true

      if (!needsCategory && !needsDescription && !needsAliases && aiInferred) {
        console.log(`   ⏭️  Skipping ${item.name} (already has AI data)`)
        skipped++
        continue
      }

      // Infer with AI
      const inferred = await inferItemWithAI(item, azure, model)

      // Prepare update
      const updateData: any = {
        attributes: {
          ...(item.attributes || {}),
          ai_inferred: true,
          reprocessed_at: new Date().toISOString()
        }
      }

      // Only update fields that are missing or need enhancement
      if (needsCategory && inferred.category) {
        updateData.category = inferred.category
      }

      if (needsDescription && inferred.description) {
        updateData.description = inferred.description
      }

      if (needsAliases && inferred.aliases.length > 0) {
        updateData.aliases = inferred.aliases
      }

      // Update attributes
      if (inferred.form && !item.attributes?.form) {
        updateData.attributes.form = inferred.form
      }

      if (inferred.applications.length > 0) {
        const existingApps = item.attributes?.applications || []
        updateData.attributes.applications = [...new Set([...existingApps, ...inferred.applications])]
      }

      if (inferred.end_uses.length > 0) {
        const existingEndUses = item.attributes?.end_uses || []
        updateData.attributes.end_uses = [...new Set([...existingEndUses, ...inferred.end_uses])]
      }

      // Update item type if missing
      if (!item.item_type && inferred.item_type) {
        updateData.item_type = inferred.item_type
      }

      // Update database
      const { error: updateError } = await supabase
        .from('leads_market_items')
        .update(updateData)
        .eq('id', item.id)

      if (updateError) {
        console.error(`   ❌ ${item.name}:`, updateError.message)
        failed++
      } else {
        const updates = []
        if (updateData.category) updates.push('category')
        if (updateData.description) updates.push('description')
        if (updateData.aliases) updates.push(`${updateData.aliases.length} aliases`)
        console.log(`   ✅ ${item.name} (${updates.join(', ') || 'attributes'})`)
        succeeded++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))

    } catch (error) {
      console.error(`   ❌ ${item.name}:`, error instanceof Error ? error.message : error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Succeeded: ${succeeded}`)
  console.log(`⏭️  Skipped: ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(50) + '\n')
}

reprocessItemsWithAI()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

