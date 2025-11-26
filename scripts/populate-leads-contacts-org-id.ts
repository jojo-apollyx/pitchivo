/**
 * Populate org_id in leads_contacts by matching email domains to leads_organizations
 * 
 * Usage: 
 *   npm run populate:contacts-org-id        (local - uses .env.local)
 *   npm run populate:contacts-org-id:prod   (prod - uses .env.prod)
 * 
 * This script:
 * 1. Finds all leads_contacts with email but no org_id
 * 2. Extracts domain from email
 * 3. Matches to leads_organizations.domain
 * 4. Updates org_id for matching contacts
 */

import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Parse command line arguments
const args = process.argv.slice(2)
const envFileArg = args.find(arg => arg.startsWith('--env=') || arg.startsWith('--env-file='))
const envFile = envFileArg 
  ? (envFileArg.split('=')[1] || '.env.local')
  : '.env.local'

// Load environment variables
const envPath = resolve(process.cwd(), envFile)
if (!existsSync(envPath)) {
  console.error(`❌ Error: Environment file not found: ${envPath}`)
  process.exit(1)
}

loadEnv({ path: envPath })
console.log(`📁 Loaded environment from: ${envFile}`)

// Validate required environment variables
// Accept both NEXT_PUBLIC_SUPABASE_URL (for frontend) and SUPABASE_URL (for scripts)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing required environment variables')
  console.error('   Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
  console.error('')
  console.error('   The Supabase URL is your project URL, typically:')
  console.error('   https://<project-ref>.supabase.co')
  console.error('')
  console.error('   You can find both values in your Supabase dashboard:')
  console.error('   Settings → API → Project URL (for SUPABASE_URL)')
  console.error('   Settings → API → service_role key (for SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Function to extract domain from email
function extractEmailDomain(email: string): string | null {
  if (!email || !email.includes('@')) {
    return null
  }
  const parts = email.split('@')
  if (parts.length !== 2) {
    return null
  }
  return parts[1].toLowerCase().trim()
}

async function main() {
  console.log('\n🚀 Starting org_id population for leads_contacts...\n')

  try {
    // Get statistics before update
    const { count: totalContacts } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })

    const { count: contactsWithEmail } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null)

    const { count: contactsWithoutOrg } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .is('org_id', null)
      .not('email', 'is', null)

    const { count: contactsWithOrg } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .not('org_id', 'is', null)

    console.log('📊 Current Statistics:')
    console.log(`   Total contacts: ${totalContacts || 0}`)
    console.log(`   Contacts with email: ${contactsWithEmail || 0}`)
    console.log(`   Contacts with org_id: ${contactsWithOrg || 0}`)
    console.log(`   Contacts without org_id (need update): ${contactsWithoutOrg || 0}\n`)

    if (contactsWithoutOrg === 0) {
      console.log('✅ All contacts already have org_id populated. Nothing to do.')
      return
    }

    // Fetch all contacts without org_id that have email (with pagination)
    console.log('📥 Fetching contacts without org_id...')
    let contacts: Array<{ id: string; email: string }> = []
    let offset = 0
    const pageSize = 1000
    let hasMore = true

    while (hasMore) {
      const { data: pageContacts, error: contactsError } = await supabase
        .from('leads_contacts')
        .select('id, email')
        .is('org_id', null)
        .not('email', 'is', null)
        .range(offset, offset + pageSize - 1)

      if (contactsError) {
        throw new Error(`Failed to fetch contacts: ${contactsError.message}`)
      }

      if (pageContacts && pageContacts.length > 0) {
        contacts = contacts.concat(pageContacts)
        offset += pageContacts.length
        hasMore = pageContacts.length === pageSize
        process.stdout.write(`   Fetched ${contacts.length.toLocaleString()} contacts...\r`)
      } else {
        hasMore = false
      }
    }

    console.log(`\n   Found ${contacts.length.toLocaleString()} contacts to process\n`)

    if (contacts.length === 0) {
      console.log('✅ No contacts found that need updating.')
      return
    }

    // Fetch all organizations with domain (with pagination)
    console.log('📥 Fetching organizations with domains...')
    let organizations: Array<{ id: string; domain: string }> = []
    offset = 0
    hasMore = true

    while (hasMore) {
      const { data: pageOrgs, error: orgsError } = await supabase
        .from('leads_organizations')
        .select('id, domain')
        .not('domain', 'is', null)
        .range(offset, offset + pageSize - 1)

      if (orgsError) {
        throw new Error(`Failed to fetch organizations: ${orgsError.message}`)
      }

      if (pageOrgs && pageOrgs.length > 0) {
        organizations = organizations.concat(pageOrgs)
        offset += pageOrgs.length
        hasMore = pageOrgs.length === pageSize
        process.stdout.write(`   Fetched ${organizations.length.toLocaleString()} organizations...\r`)
      } else {
        hasMore = false
      }
    }

    console.log(`\n   Found ${organizations.length.toLocaleString()} organizations with domains\n`)

    if (organizations.length === 0) {
      console.log('⚠️  No organizations with domains found. Cannot populate org_id.')
      return
    }

    // Create domain -> org_id map
    const domainToOrgId = new Map<string, string>()
    for (const org of organizations) {
      if (org.domain) {
        const normalizedDomain = org.domain.toLowerCase().trim()
        // Only keep first match if duplicates exist
        if (!domainToOrgId.has(normalizedDomain)) {
          domainToOrgId.set(normalizedDomain, org.id)
        }
      }
    }

    console.log(`   Found ${domainToOrgId.size.toLocaleString()} unique organization domains\n`)

    // Show sample domains for debugging
    const sampleContactDomains = new Set<string>()
    const sampleOrgDomains = Array.from(domainToOrgId.keys()).slice(0, 10)
    
    for (let i = 0; i < Math.min(20, contacts.length); i++) {
      const domain = extractEmailDomain(contacts[i].email)
      if (domain) {
        sampleContactDomains.add(domain)
      }
    }

    console.log('🔍 Sample domains for debugging:')
    console.log(`   Sample contact email domains (first 10): ${Array.from(sampleContactDomains).slice(0, 10).join(', ')}`)
    console.log(`   Sample organization domains (first 10): ${sampleOrgDomains.join(', ')}\n`)

    // Process contacts in batches
    const BATCH_SIZE = 100
    let updated = 0
    let notFound = 0
    let invalidEmail = 0
    const updates: Array<{ id: string; org_id: string }> = []

    console.log('🔄 Processing contacts...')
    for (const contact of contacts) {
      if (!contact.email) {
        invalidEmail++
        continue
      }

      const domain = extractEmailDomain(contact.email)
      if (!domain) {
        invalidEmail++
        continue
      }

      const orgId = domainToOrgId.get(domain)
      if (orgId) {
        updates.push({ id: contact.id, org_id: orgId })
        updated++
      } else {
        notFound++
      }
    }

    console.log(`   Matched: ${updated.toLocaleString()} contacts`)
    console.log(`   No match: ${notFound.toLocaleString()} contacts`)
    console.log(`   Invalid email: ${invalidEmail.toLocaleString()} contacts\n`)

    if (updates.length === 0) {
      console.log('⚠️  No contacts could be matched to organizations.')
      return
    }

    // Update in batches using parallel updates
    console.log(`💾 Updating ${updates.length} contacts in batches of ${BATCH_SIZE}...`)
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE)
      
      // Update in parallel for better performance
      const updatePromises = batch.map(update =>
        supabase
          .from('leads_contacts')
          .update({ org_id: update.org_id })
          .eq('id', update.id)
      )

      const results = await Promise.all(updatePromises)
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        console.error(`\n   ⚠️  ${errors.length} updates failed in this batch`)
        errors.forEach((r, idx) => {
          if (r.error) {
            console.error(`      Contact ${batch[idx].id}: ${r.error.message}`)
          }
        })
      }

      const progress = Math.min(i + BATCH_SIZE, updates.length)
      process.stdout.write(`   Progress: ${progress}/${updates.length} (${Math.round(progress / updates.length * 100)}%)\r`)
    }

    console.log(`\n   ✅ Updated ${updates.length} contacts\n`)

    // Get final statistics
    const { count: finalContactsWithOrg } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .not('org_id', 'is', null)

    const { count: finalContactsWithoutOrg } = await supabase
      .from('leads_contacts')
      .select('*', { count: 'exact', head: true })
      .is('org_id', null)
      .not('email', 'is', null)

    console.log('📊 Final Statistics:')
    console.log(`   Contacts with org_id: ${finalContactsWithOrg || 0} (was ${contactsWithOrg || 0})`)
    console.log(`   Contacts without org_id: ${finalContactsWithoutOrg || 0} (was ${contactsWithoutOrg || 0})`)
    console.log(`   Successfully updated: ${updated} contacts`)
    console.log(`   No matching organization: ${notFound} contacts\n`)

    console.log('✅ Migration complete!\n')

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

main()

