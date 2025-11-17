// Mock data for buyers and contacts in Pitchivo Database

export interface BuyerContact {
  name: string
  email: string
  role: string
  title?: string
}

export interface Buyer {
  company: string
  contacts: number
  country: string
  industry: string
  matchedIngredients: string[]
  website?: string
  contactDetails?: BuyerContact[]
}

// Helper to generate mock contact details
function generateContactDetails(count: number, company: string): BuyerContact[] {
  const roles = ['Procurement Manager', 'Sourcing Director', 'Product Development Manager', 'Quality Assurance Lead', 'Supply Chain Coordinator', 'R&D Manager', 'Purchasing Agent', 'Operations Director']
  const firstNames = ['John', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Robert', 'Amanda', 'James', 'Lisa', 'William', 'Michelle', 'Richard', 'Jennifer', 'Joseph']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas']
  
  const contacts: BuyerContact[] = []
  for (let i = 0; i < Math.min(count, 5); i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const role = roles[Math.floor(Math.random() * roles.length)]
    contacts.push({
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(/\s+/g, '')}.com`,
      role: role,
      title: role
    })
  }
  return contacts
}

export const MOCK_BUYERS: Buyer[] = [
  { company: 'Vital Proteins', contacts: 26, country: 'USA', industry: 'Nutraceuticals', matchedIngredients: ['collagen', 'peptides', 'protein'], website: 'https://www.vitalproteins.com', contactDetails: generateContactDetails(26, 'Vital Proteins') },
  { company: 'Nestlé Health Science', contacts: 14, country: 'Switzerland', industry: 'Health Nutrition', matchedIngredients: ['vitamins', 'minerals', 'protein'], website: 'https://www.nestlehealthscience.com', contactDetails: generateContactDetails(14, 'Nestlé Health Science') },
  { company: "Nature's Bounty", contacts: 22, country: 'USA', industry: 'Supplements', matchedIngredients: ['herbal', 'vitamins', 'minerals'], website: 'https://www.naturesbounty.com', contactDetails: generateContactDetails(22, "Nature's Bounty") },
  { company: 'Swisse Wellness', contacts: 17, country: 'Australia', industry: 'Wellness', matchedIngredients: ['vitamins', 'superfoods', 'omega-3'], website: 'https://www.swisse.com', contactDetails: generateContactDetails(17, 'Swisse Wellness') },
  { company: 'NOW Foods', contacts: 31, country: 'USA', industry: 'Natural Products', matchedIngredients: ['amino acids', 'botanicals', 'enzymes'], website: 'https://www.nowfoods.com', contactDetails: generateContactDetails(31, 'NOW Foods') },
  { company: 'Garden of Life', contacts: 19, country: 'USA', industry: 'Organic Supplements', matchedIngredients: ['organic', 'probiotics', 'protein'], website: 'https://www.gardenoflife.com', contactDetails: generateContactDetails(19, 'Garden of Life') },
  { company: 'GNC Holdings', contacts: 28, country: 'USA', industry: 'Sports Nutrition', matchedIngredients: ['protein', 'creatine', 'amino acids'], website: 'https://www.gnc.com', contactDetails: generateContactDetails(28, 'GNC Holdings') },
  { company: 'Herbalife Nutrition', contacts: 24, country: 'USA', industry: 'Nutrition & Weight Loss', matchedIngredients: ['protein', 'fiber', 'vitamins'], website: 'https://www.herbalife.com', contactDetails: generateContactDetails(24, 'Herbalife Nutrition') },
  { company: 'Amway (Nutrilite)', contacts: 15, country: 'USA', industry: 'Dietary Supplements', matchedIngredients: ['phytonutrients', 'vitamins', 'minerals'], website: 'https://www.amway.com', contactDetails: generateContactDetails(15, 'Amway') },
  { company: 'Pharmavite (Nature Made)', contacts: 21, country: 'USA', industry: 'Vitamins & Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'], website: 'https://www.naturemade.com', contactDetails: generateContactDetails(21, 'Pharmavite') },
  { company: 'Solgar', contacts: 18, country: 'USA', industry: 'Premium Supplements', matchedIngredients: ['amino acids', 'antioxidants', 'minerals'], website: 'https://www.solgar.com', contactDetails: generateContactDetails(18, 'Solgar') },
  { company: 'New Chapter', contacts: 16, country: 'USA', industry: 'Organic Supplements', matchedIngredients: ['fermented', 'organic', 'turmeric'], website: 'https://www.newchapter.com', contactDetails: generateContactDetails(16, 'New Chapter') },
  { company: 'Thorne Research', contacts: 12, country: 'USA', industry: 'Professional Supplements', matchedIngredients: ['amino acids', 'vitamins', 'minerals'], website: 'https://www.thorne.com', contactDetails: generateContactDetails(12, 'Thorne Research') },
  { company: 'Pure Encapsulations', contacts: 11, country: 'USA', industry: 'Hypoallergenic Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'], website: 'https://www.pureencapsulations.com', contactDetails: generateContactDetails(11, 'Pure Encapsulations') },
  { company: 'Life Extension', contacts: 20, country: 'USA', industry: 'Anti-Aging Supplements', matchedIngredients: ['resveratrol', 'NAD+', 'antioxidants'], website: 'https://www.lifeextension.com', contactDetails: generateContactDetails(20, 'Life Extension') },
  { company: 'Jarrow Formulas', contacts: 23, country: 'USA', industry: 'Nutritional Supplements', matchedIngredients: ['probiotics', 'coQ10', 'vitamins'], website: 'https://www.jarrow.com', contactDetails: generateContactDetails(23, 'Jarrow Formulas') },
  { company: 'Nordic Naturals', contacts: 13, country: 'USA', industry: 'Omega-3 Products', matchedIngredients: ['omega-3', 'fish oil', 'algae oil'], website: 'https://www.nordicnaturals.com', contactDetails: generateContactDetails(13, 'Nordic Naturals') },
  { company: 'MegaFood', contacts: 14, country: 'USA', industry: 'Farm Fresh Supplements', matchedIngredients: ['whole food', 'vitamins', 'minerals'], website: 'https://www.megafood.com', contactDetails: generateContactDetails(14, 'MegaFood') },
  { company: 'Rainbow Light', contacts: 10, country: 'USA', industry: 'Natural Nutrition', matchedIngredients: ['probiotics', 'enzymes', 'vitamins'], contactDetails: generateContactDetails(10, 'Rainbow Light') },
  { company: 'Country Life', contacts: 9, country: 'USA', industry: 'Natural Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'], website: 'https://www.countrylifevitamins.com', contactDetails: generateContactDetails(9, 'Country Life') },
  { company: 'Source Naturals', contacts: 25, country: 'USA', industry: 'Wellness Formulas', matchedIngredients: ['adaptogens', 'nootropics', 'antioxidants'], website: 'https://www.sourcenaturals.com', contactDetails: generateContactDetails(25, 'Source Naturals') },
  { company: 'Bluebonnet Nutrition', contacts: 8, country: 'USA', industry: 'Kosher Supplements', matchedIngredients: ['vitamins', 'minerals', 'protein'], website: 'https://www.bluebonnetnutrition.com', contactDetails: generateContactDetails(8, 'Bluebonnet Nutrition') },
  { company: 'Youtheory', contacts: 27, country: 'USA', industry: 'Beauty & Wellness', matchedIngredients: ['collagen', 'turmeric', 'ashwagandha'], website: 'https://www.youtheory.com', contactDetails: generateContactDetails(27, 'Youtheory') },
  { company: 'Zhou Nutrition', contacts: 30, country: 'USA', industry: 'Sports & Wellness', matchedIngredients: ['apple cider vinegar', 'keto', 'energy'], website: 'https://www.zhounutrition.com', contactDetails: generateContactDetails(30, 'Zhou Nutrition') },
  { company: 'Sports Research', contacts: 29, country: 'USA', industry: 'Performance Nutrition', matchedIngredients: ['collagen', 'MCT oil', 'vitamins'], website: 'https://www.sportsresearch.com', contactDetails: generateContactDetails(29, 'Sports Research') }
]

// Generate additional buyers to reach 2,450 total
export function generateMockBuyers(count: number = 2450): Buyer[] {
  const baseBuyers = [...MOCK_BUYERS]
  const companies = [
    'BioTech', 'NutriCorp', 'VitaLife', 'HealthPlus', 'WellnessGroup',
    'PureLiving', 'NaturalWay', 'ProActive', 'LifeForce', 'BioVitality',
    'OptimalHealth', 'ZenBio', 'TruVital', 'CoreWellness', 'PrimaNutra'
  ]
  
  const countries = ['USA', 'Canada', 'UK', 'Germany', 'Australia', 'Japan', 'France', 'Italy', 'Spain', 'Netherlands']
  const industries = ['Nutraceuticals', 'Sports Nutrition', 'Supplements', 'Health Foods', 'Wellness Products']
  
  while (baseBuyers.length < count) {
    const company = companies[Math.floor(Math.random() * companies.length)]
    const number = Math.floor(Math.random() * 10000)
    const companyName = `${company} ${number}`
    const contactsCount = Math.floor(Math.random() * 35) + 5
    baseBuyers.push({
      company: companyName,
      contacts: contactsCount,
      country: countries[Math.floor(Math.random() * countries.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
      matchedIngredients: ['vitamins', 'minerals', 'protein'],
      website: Math.random() > 0.3 ? `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com` : undefined,
      contactDetails: generateContactDetails(contactsCount, companyName)
    })
  }
  
  return baseBuyers.slice(0, count)
}

// Config: All available email addresses for future use
export const EMAIL_ADDRESSES_CONFIG = [
  {
    email: 'updates@{org}.pitchivo.com',
    health: 'healthy' as const,
    deliveryRate: 98,
    lastWarmup: '3 days ago'
  },
  {
    email: 'news@{org}.pitchivo.com',
    health: 'healthy' as const,
    deliveryRate: 97,
    lastWarmup: '5 days ago'
  },
  {
    email: 'info@{org}.pitchivo.com',
    health: 'warming_up' as const,
    deliveryRate: 85,
    lastWarmup: '1 day ago'
  },
  {
    email: 'mail@{org}.pitchivo.com',
    health: 'caution' as const,
    deliveryRate: 72,
    lastWarmup: '2 weeks ago'
  }
] as const

// Mock sender addresses (for backward compatibility)
export const SENDER_ADDRESSES = EMAIL_ADDRESSES_CONFIG

export type SenderHealth = 'healthy' | 'warming_up' | 'caution' | 'poor'

export function getSenderHealthLabel(health: SenderHealth): { label: string; color: string; icon: string } {
  switch (health) {
    case 'healthy':
      return { label: 'Healthy', color: 'text-green-600', icon: '●' }
    case 'warming_up':
      return { label: 'Warming Up', color: 'text-yellow-600', icon: '▲' }
    case 'caution':
      return { label: 'Caution', color: 'text-orange-600', icon: '⚠️' }
    case 'poor':
      return { label: 'Poor', color: 'text-red-600', icon: '✖' }
  }
}

export function getSenderHealthGrade(deliveryRate: number): string {
  if (deliveryRate >= 95) return 'A'
  if (deliveryRate >= 90) return 'A-'
  if (deliveryRate >= 85) return 'B+'
  if (deliveryRate >= 80) return 'B'
  if (deliveryRate >= 75) return 'B-'
  if (deliveryRate >= 70) return 'C+'
  return 'C'
}

// Calculate campaign metrics
export function calculateCampaignMetrics(emailCount: number, durationDays: number) {
  const emailsPerDay = Math.ceil(emailCount / durationDays)
  const minDays = Math.max(Math.ceil(emailCount / 250), 1) // Max 250 emails/day for good deliverability
  
  let deliverabilityGrade = 'A'
  if (emailsPerDay > 250) deliverabilityGrade = 'C'
  else if (emailsPerDay > 200) deliverabilityGrade = 'B'
  else if (emailsPerDay > 150) deliverabilityGrade = 'A-'
  
  return {
    emailsPerDay,
    minDays,
    deliverabilityGrade,
    isOptimal: emailsPerDay <= 150
  }
}

// Mock campaign activities
export interface CampaignActivity {
  time: string
  type: 'email_opened' | 'email_clicked' | 'product_viewed' | 'rfq_submitted'
  buyerCompany: string
  description: string
}

export function generateMockActivities(campaignName: string): CampaignActivity[] {
  const activities: CampaignActivity[] = []
  const buyers = MOCK_BUYERS.slice(0, 15)
  const times = ['10:05', '10:31', '11:15', '11:42', '12:08', '13:20', '14:35', '15:17', '16:03', '16:45']
  
  buyers.forEach((buyer, index) => {
    if (index < 10) {
      activities.push({
        time: times[index],
        type: index % 4 === 0 ? 'rfq_submitted' : index % 3 === 0 ? 'product_viewed' : index % 2 === 0 ? 'email_clicked' : 'email_opened',
        buyerCompany: buyer.company,
        description: index % 4 === 0 
          ? 'Submitted RFQ' 
          : index % 3 === 0 
          ? 'Viewed product page' 
          : index % 2 === 0 
          ? 'Clicked email link' 
          : 'Opened email'
      })
    }
  })
  
  return activities.sort((a, b) => b.time.localeCompare(a.time))
}

