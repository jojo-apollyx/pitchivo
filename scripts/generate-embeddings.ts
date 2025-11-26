/**
 * Generate embeddings for market items missing embeddings
 * 
 * Usage: 
 *   npm run generate:embeddings        (local - uses .env.local)
 *   npm run generate:embeddings:prod    (prod - uses .env.prod)
 * 
 * Parallel processing:
 *   --worker=0 --total-workers=4    (process items 0-999 if total is 4000)
 *   --worker=1 --total-workers=4    (process items 1000-1999)
 *   --worker=2 --total-workers=4    (process items 2000-2999)
 *   --worker=3 --total-workers=4    (process items 3000-3999)
 * 
 * Run multiple instances in parallel with different worker IDs
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { createAzure } from '@ai-sdk/azure'
import { embed } from 'ai'

// Parse command line arguments
const args = process.argv.slice(2)
const envFileArg = args.find(arg => arg.startsWith('--env=') || arg.startsWith('--env-file='))
const envFile = envFileArg 
  ? (envFileArg.split('=')[1] || '.env.local')
  : '.env.local'

// Parse worker arguments for parallel processing
const workerArg = args.find(arg => arg.startsWith('--worker='))
const totalWorkersArg = args.find(arg => arg.startsWith('--total-workers='))
const workerId = workerArg ? parseInt(workerArg.split('=')[1]) : undefined
const totalWorkers = totalWorkersArg ? parseInt(totalWorkersArg.split('=')[1]) : undefined

if (workerId !== undefined && totalWorkers === undefined) {
  console.error('❌ Error: --total-workers is required when using --worker')
  process.exit(1)
}

if (totalWorkers !== undefined && workerId === undefined) {
  console.error('❌ Error: --worker is required when using --total-workers')
  process.exit(1)
}

if (workerId !== undefined && (workerId < 0 || workerId >= totalWorkers!)) {
  console.error(`❌ Error: --worker must be between 0 and ${totalWorkers! - 1}`)
  process.exit(1)
}

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
  const workerInfo = workerId !== undefined 
    ? `\n🔧 Worker ${workerId + 1}/${totalWorkers} (ID: ${workerId})`
    : ''
  
  console.log('\n🚀 Generating embeddings for market items...')
  console.log(`   Environment: ${envFile}${workerInfo}\n`)

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

  const { count: totalNeedingEmbeddings } = await supabase
    .from('leads_market_items')
    .select('*', { count: 'exact', head: true })
    .is('embedding', null)

  console.log(`📊 Total items: ${totalItems}`)
  console.log(`   With embeddings: ${itemsWithEmbeddings}`)
  console.log(`   Need embeddings: ${totalNeedingEmbeddings || 0}`)

  const totalNeeding = totalNeedingEmbeddings || 0

  if (totalNeeding === 0) {
    console.log('✅ All items already have embeddings!\n')
    process.exit(0)
  }

  // Calculate worker range if using parallel processing
  let startOffset = 0
  let endOffset = totalNeeding - 1
  let itemsPerWorker = totalNeeding

  if (workerId !== undefined && totalWorkers !== undefined) {
    itemsPerWorker = Math.ceil(totalNeeding / totalWorkers)
    startOffset = workerId * itemsPerWorker
    endOffset = Math.min(startOffset + itemsPerWorker - 1, totalNeeding - 1)
    
    console.log(`\n📋 Worker ${workerId + 1}/${totalWorkers} assigned range:`)
    console.log(`   Items ${startOffset + 1} to ${endOffset + 1} (${endOffset - startOffset + 1} items)`)
  }

  console.log(`\n📝 Processing items in batches of 1000...\n`)

  // Process items in batches using pagination
  let offset = startOffset
  const pageSize = 1000
  let hasMore = true
  let succeeded = 0
  let failed = 0
  let totalProcessed = 0
  const workerPrefix = workerId !== undefined ? `[Worker ${workerId + 1}] ` : ''

  while (hasMore && offset <= endOffset) {
    // Calculate actual range for this batch
    const batchStart = offset
    const batchEnd = Math.min(offset + pageSize - 1, endOffset)

    // Fetch a batch of items without embeddings
    const { data: items, error } = await supabase
      .from('leads_market_items')
      .select('id, name, category, aliases, description')
      .is('embedding', null)
      .order('created_at', { ascending: true })
      .range(batchStart, batchEnd)

    if (error) {
      console.error(`${workerPrefix}❌ Error fetching items (offset ${offset}):`, error)
      process.exit(1)
    }

    if (!items || items.length === 0) {
      hasMore = false
      break
    }

    const progress = totalWorkers 
      ? `[${batchStart + 1}-${batchEnd + 1}/${totalNeeding}]`
      : `[${totalProcessed + 1}-${totalProcessed + items.length}/${totalNeeding}]`
    
    console.log(`${workerPrefix}📦 Processing batch: ${items.length} items ${progress}...`)

    let batchSucceeded = 0
    let batchFailed = 0

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
          console.warn(`${workerPrefix}   ⚠️  Skipping ${item.name} (no text content)`)
          batchFailed++
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
          console.error(`${workerPrefix}   ❌ ${item.name}:`, updateError.message)
          batchFailed++
          failed++
        } else {
          batchSucceeded++
          succeeded++
          // Only log every 10th success to reduce output
          if (batchSucceeded % 10 === 0 || batchSucceeded === 1) {
            console.log(`${workerPrefix}   ✅ ${item.name} (${batchSucceeded}/${items.length} in batch)`)
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`${workerPrefix}   ❌ ${item.name}:`, error instanceof Error ? error.message : error)
        batchFailed++
        failed++
      }
    }

    console.log(`${workerPrefix}   ✓ Batch complete: ${batchSucceeded} succeeded, ${batchFailed} failed`)

    totalProcessed += items.length
    offset += items.length
    hasMore = items.length === pageSize && offset <= endOffset

    // Small delay between batches to avoid overwhelming the API
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (totalProcessed === 0) {
    console.log(`${workerPrefix}✅ No items to process in this range!\n`)
    process.exit(0)
  }

  console.log(`\n${workerPrefix}` + '='.repeat(50))
  console.log(`${workerPrefix}✅ Succeeded: ${succeeded}`)
  console.log(`${workerPrefix}❌ Failed: ${failed}`)
  console.log(`${workerPrefix}📊 Total processed: ${totalProcessed}`)
  console.log(`${workerPrefix}` + '='.repeat(50) + '\n')
}

generateEmbeddings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

