// Mock data for buyers and contacts in Pitchville Database

export interface BuyerContact {
  name: string
  email: string
  role: string
}

export interface Buyer {
  company: string
  contacts: number
  country: string
  industry: string
  matchedIngredients: string[]
}

export const MOCK_BUYERS: Buyer[] = [
  { company: 'Vital Proteins', contacts: 26, country: 'USA', industry: 'Nutraceuticals', matchedIngredients: ['collagen', 'peptides', 'protein'] },
  { company: 'Nestlé Health Science', contacts: 14, country: 'Switzerland', industry: 'Health Nutrition', matchedIngredients: ['vitamins', 'minerals', 'protein'] },
  { company: "Nature's Bounty", contacts: 22, country: 'USA', industry: 'Supplements', matchedIngredients: ['herbal', 'vitamins', 'minerals'] },
  { company: 'Swisse Wellness', contacts: 17, country: 'Australia', industry: 'Wellness', matchedIngredients: ['vitamins', 'superfoods', 'omega-3'] },
  { company: 'NOW Foods', contacts: 31, country: 'USA', industry: 'Natural Products', matchedIngredients: ['amino acids', 'botanicals', 'enzymes'] },
  { company: 'Garden of Life', contacts: 19, country: 'USA', industry: 'Organic Supplements', matchedIngredients: ['organic', 'probiotics', 'protein'] },
  { company: 'GNC Holdings', contacts: 28, country: 'USA', industry: 'Sports Nutrition', matchedIngredients: ['protein', 'creatine', 'amino acids'] },
  { company: 'Herbalife Nutrition', contacts: 24, country: 'USA', industry: 'Nutrition & Weight Loss', matchedIngredients: ['protein', 'fiber', 'vitamins'] },
  { company: 'Amway (Nutrilite)', contacts: 15, country: 'USA', industry: 'Dietary Supplements', matchedIngredients: ['phytonutrients', 'vitamins', 'minerals'] },
  { company: 'Pharmavite (Nature Made)', contacts: 21, country: 'USA', industry: 'Vitamins & Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'] },
  { company: 'Solgar', contacts: 18, country: 'USA', industry: 'Premium Supplements', matchedIngredients: ['amino acids', 'antioxidants', 'minerals'] },
  { company: 'New Chapter', contacts: 16, country: 'USA', industry: 'Organic Supplements', matchedIngredients: ['fermented', 'organic', 'turmeric'] },
  { company: 'Thorne Research', contacts: 12, country: 'USA', industry: 'Professional Supplements', matchedIngredients: ['amino acids', 'vitamins', 'minerals'] },
  { company: 'Pure Encapsulations', contacts: 11, country: 'USA', industry: 'Hypoallergenic Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'] },
  { company: 'Life Extension', contacts: 20, country: 'USA', industry: 'Anti-Aging Supplements', matchedIngredients: ['resveratrol', 'NAD+', 'antioxidants'] },
  { company: 'Jarrow Formulas', contacts: 23, country: 'USA', industry: 'Nutritional Supplements', matchedIngredients: ['probiotics', 'coQ10', 'vitamins'] },
  { company: 'Nordic Naturals', contacts: 13, country: 'USA', industry: 'Omega-3 Products', matchedIngredients: ['omega-3', 'fish oil', 'algae oil'] },
  { company: 'MegaFood', contacts: 14, country: 'USA', industry: 'Farm Fresh Supplements', matchedIngredients: ['whole food', 'vitamins', 'minerals'] },
  { company: 'Rainbow Light', contacts: 10, country: 'USA', industry: 'Natural Nutrition', matchedIngredients: ['probiotics', 'enzymes', 'vitamins'] },
  { company: 'Country Life', contacts: 9, country: 'USA', industry: 'Natural Supplements', matchedIngredients: ['vitamins', 'minerals', 'omega-3'] },
  { company: 'Source Naturals', contacts: 25, country: 'USA', industry: 'Wellness Formulas', matchedIngredients: ['adaptogens', 'nootropics', 'antioxidants'] },
  { company: 'Bluebonnet Nutrition', contacts: 8, country: 'USA', industry: 'Kosher Supplements', matchedIngredients: ['vitamins', 'minerals', 'protein'] },
  { company: 'Youtheory', contacts: 27, country: 'USA', industry: 'Beauty & Wellness', matchedIngredients: ['collagen', 'turmeric', 'ashwagandha'] },
  { company: 'Zhou Nutrition', contacts: 30, country: 'USA', industry: 'Sports & Wellness', matchedIngredients: ['apple cider vinegar', 'keto', 'energy'] },
  { company: 'Sports Research', contacts: 29, country: 'USA', industry: 'Performance Nutrition', matchedIngredients: ['collagen', 'MCT oil', 'vitamins'] }
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
    baseBuyers.push({
      company: `${company} ${number}`,
      contacts: Math.floor(Math.random() * 35) + 5,
      country: countries[Math.floor(Math.random() * countries.length)],
      industry: industries[Math.floor(Math.random() * industries.length)],
      matchedIngredients: ['vitamins', 'minerals', 'protein']
    })
  }
  
  return baseBuyers.slice(0, count)
}

// Mock sender addresses
export const SENDER_ADDRESSES = [
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

