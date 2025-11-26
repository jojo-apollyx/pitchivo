/**
 * Generate embeddings for market items missing embeddings
 * 
 * Usage: 
 *   npm run generate:embeddings        (local - uses .env.local)
 *   npm run generate:embeddings:prod    (prod - uses .env.prod)
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { createAzure } from '@ai-sdk/azure'
import { embed } from 'ai'

// Parse command line arguments for --env flag
const args = process.argv.slice(2)
const envFileArg = args.find(arg => arg.startsWith('--env=') || arg.startsWith('--env-file='))
const envFile = envFileArg 
  ? (envFileArg.split('=')[1] || '.env.local')
  : '.env.local'

// Resolve env file path (same pattern as migration scripts)
const envPath = envFile.startsWith('/') 
  ? envFile 
  : resolve(process.cwd(), 'apps/web', envFile)

console.log(`📄 Loading environment from: ${envPath}`)

if (!existsSync(envPath)) {
  console.error(`❌ Error: Environment file not found: ${envPath}`)
  console.error(`   Please create the file or check the path.`)
  process.exit(1)
}

// Load environment variables
loadEnv({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AZURE_RESOURCE_NAME = process.env.AZURE_OPENAI_RESOURCE_NAME
const AZURE_API_KEY = process.env.AZURE_OPENAI_API_KEY
const AZURE_EMBEDDING_DEPLOYMENT = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002'

async function generateEmbeddings() {
  console.log('\n🚀 Generating embeddings for market items...')
  console.log(`   Environment: ${envFile}\n`)

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  if (!AZURE_RESOURCE_NAME || !AZURE_API_KEY) {
    console.error('❌ Missing Azure OpenAI credentials')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const azure = createAzure({
    resourceName: AZURE_RESOURCE_NAME,
    apiKey: AZURE_API_KEY
  })

  // Check status
  const { count: totalItems } = await supabase
    .from('leads_market_items')
    .select('*', { count: 'exact', head: true })

  const { count: itemsWithEmbeddings } = await supabase
    .from('leads_market_items')
    .select('*', { count: 'exact', head: true })
    .not('embedding', 'is', null)

  const itemsNeedingEmbeddings = (totalItems || 0) - (itemsWithEmbeddings || 0)

  console.log(`📊 Total items: ${totalItems}`)
  console.log(`   With embeddings: ${itemsWithEmbeddings}`)
  console.log(`   Need embeddings: ${itemsNeedingEmbeddings}\n`)

  if (itemsNeedingEmbeddings === 0) {
    console.log('✅ All items already have embeddings!\n')
    process.exit(0)
  }

  // Get items without embeddings
  const { data: items, error } = await supabase
    .from('leads_market_items')
    .select('id, name, category, aliases, description')
    .is('embedding', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error fetching items:', error)
    process.exit(1)
  }

  if (!items || items.length === 0) {
    console.log('✅ No items need embeddings!\n')
    process.exit(0)
  }

  console.log(`📝 Processing ${items.length} items...\n`)

  let succeeded = 0
  let failed = 0

  for (const item of items) {
    try {
      // Create text for embedding
      const textParts = [
        item.name,
        item.category,
        item.description,
        ...(item.aliases || [])
      ].filter(Boolean)

      const text = textParts.join(' ')

      if (!text.trim()) {
        console.warn(`   ⚠️  Skipping ${item.name} (no text content)`)
        failed++
        continue
      }

      // Generate embedding
      const { embedding } = await embed({
        model: azure.embedding(AZURE_EMBEDDING_DEPLOYMENT),
        value: text
      })

      // Update database
      const { error: updateError } = await supabase
        .from('leads_market_items')
        .update({ embedding })
        .eq('id', item.id)

      if (updateError) {
        console.error(`   ❌ ${item.name}:`, updateError.message)
        failed++
      } else {
        console.log(`   ✅ ${item.name}`)
        succeeded++
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`   ❌ ${item.name}:`, error instanceof Error ? error.message : error)
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Succeeded: ${succeeded}`)
  console.log(`❌ Failed: ${failed}`)
  console.log('='.repeat(50) + '\n')
}

generateEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

