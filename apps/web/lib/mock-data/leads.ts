// Mock lead/contact database for campaign management
// Uses consolidated buyer data from buyers.ts

import { generateMockBuyers, type Buyer, type BuyerContact } from './buyers'

export interface Lead {
  lead_id: string
  campaign_id: string
  email: string
  name: string
  title: string
  company: string
  country?: string
  industry?: string
  phone?: string
  linkedin_url?: string
  status: 'active' | 'unsubscribed' | 'bounced' | 'invalid'
  added_at: string
  last_contacted?: string
  notes?: string
}

// Generate mock leads for a campaign from buyer data
// Now generates 200 leads by default, using consolidated buyer data
export function generateMockLeads(campaignId: string, count: number = 200): Lead[] {
  // Get buyers from the shared mock data
  const buyers = generateMockBuyers(Math.ceil(count / 2)) // Get enough buyers
  
  const leads: Lead[] = []
  const now = new Date()
  let leadIndex = 0
  
  // For each buyer, extract contacts as leads
  for (const buyer of buyers) {
    if (leadIndex >= count) break
    
    const contacts = buyer.contactDetails || []
    
    // Add each contact as a lead
    for (const contact of contacts) {
      if (leadIndex >= count) break
      
      // Randomly assign status (most are active)
      const rand = Math.random()
      let status: Lead['status'] = 'active'
      if (rand > 0.95) status = 'bounced'
      else if (rand > 0.92) status = 'unsubscribed'
      else if (rand > 0.88) status = 'invalid'
      
      const addedAt = new Date(now.getTime() - Math.random() * 45 * 24 * 60 * 60 * 1000) // Random date in last 45 days
      
      leads.push({
        lead_id: `lead_${campaignId}_${leadIndex + 1}`,
        campaign_id: campaignId,
        email: contact.email,
        name: contact.name,
        title: contact.title || contact.role,
        company: buyer.company,
        country: buyer.country,
        industry: buyer.industry,
        phone: Math.random() > 0.6 ? `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : undefined,
        linkedin_url: Math.random() > 0.4 ? `https://linkedin.com/in/${contact.name.toLowerCase().replace(/\s+/g, '-')}` : undefined,
        status,
        added_at: addedAt.toISOString(),
        last_contacted: Math.random() > 0.6 ? new Date(addedAt.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        notes: Math.random() > 0.8 ? `Key decision maker for ${buyer.company}` : undefined
      })
      
      leadIndex++
    }
  }
  
  return leads.sort((a, b) => b.added_at.localeCompare(a.added_at))
}

