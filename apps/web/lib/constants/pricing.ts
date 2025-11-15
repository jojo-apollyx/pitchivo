// Pricing tier configuration

export const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null, // No Stripe price ID for free tier
    interval: 'month',
    features: {
      productListing: 'Unlimited',
      emailQuota: 30,
      qrLinksPerProduct: 3,
      apiAccess: false,
      datasetIntegration: false,
      sla: false,
      aiExposed: true,
      browseable: true
    },
    description: 'For early users; exposed to AI & browseable',
    cta: 'Get Started',
    popular: false
  },
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 499,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC, // Set in environment
    interval: 'month',
    features: {
      productListing: 'Unlimited',
      emailQuota: 400,
      qrLinksPerProduct: 10,
      apiAccess: false,
      datasetIntegration: false,
      sla: false,
      aiExposed: false,
      browseable: true
    },
    description: 'For small exporters & startups',
    cta: 'Subscribe',
    popular: false
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 1999,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM,
    interval: 'month',
    features: {
      productListing: 'Unlimited',
      emailQuota: 2000,
      qrLinksPerProduct: 999999, // Unlimited
      apiAccess: false,
      datasetIntegration: false,
      sla: false,
      aiExposed: false,
      browseable: true
    },
    description: 'For established exporters & marketing teams',
    cta: 'Subscribe',
    popular: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    priceId: null,
    interval: 'custom',
    features: {
      productListing: 'Unlimited',
      emailQuota: 999999, // Unlimited
      qrLinksPerProduct: 999999, // Unlimited
      apiAccess: true,
      datasetIntegration: true,
      sla: true,
      aiExposed: false,
      browseable: false
    },
    description: 'Custom API access, dataset integration, SLA',
    cta: 'Contact Sales',
    popular: false
  }
} as const

export type PricingTier = keyof typeof PRICING_TIERS
export type PricingTierConfig = typeof PRICING_TIERS[PricingTier]

// Stripe product IDs (set these in your Stripe dashboard)
export const STRIPE_PRODUCTS = {
  basic: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_BASIC,
  premium: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_PREMIUM
}

// Feature comparison for pricing page
export const FEATURE_COMPARISON = [
  {
    name: 'Product Listings',
    free: 'Unlimited',
    basic: 'Unlimited',
    premium: 'Unlimited',
    enterprise: 'Unlimited'
  },
  {
    name: 'Email Quota (monthly)',
    free: '30',
    basic: '400',
    premium: '2,000',
    enterprise: 'Unlimited'
  },
  {
    name: 'QR / Custom Links per Product',
    free: '3',
    basic: '10',
    premium: 'Unlimited',
    enterprise: 'Unlimited'
  },
  {
    name: 'AI Exposure',
    free: 'Yes',
    basic: 'No',
    premium: 'No',
    enterprise: 'No'
  },
  {
    name: 'Browseable Directory',
    free: 'Yes',
    basic: 'Yes',
    premium: 'Yes',
    enterprise: 'Optional'
  },
  {
    name: 'Custom API Access',
    free: '—',
    basic: '—',
    premium: '—',
    enterprise: 'Yes'
  },
  {
    name: 'Dataset Integration',
    free: '—',
    basic: '—',
    premium: '—',
    enterprise: 'Yes'
  },
  {
    name: 'SLA Support',
    free: '—',
    basic: '—',
    premium: '—',
    enterprise: 'Yes'
  }
]

// Helper function to get tier configuration
export function getTierConfig(tier: PricingTier): PricingTierConfig {
  return PRICING_TIERS[tier]
}

// Helper function to check if feature is available in tier
export function hasFeature(tier: PricingTier, feature: keyof PricingTierConfig['features']): boolean {
  return !!PRICING_TIERS[tier].features[feature]
}

// Helper function to format price
export function formatPrice(price: number | null): string {
  if (price === null) return 'Custom'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(price)
}

// Helper function to check if tier has unlimited quota
export function isUnlimited(value: number): boolean {
  return value >= 999999
}

// Helper function to format quota display
export function formatQuota(value: number): string {
  return isUnlimited(value) ? 'Unlimited' : value.toLocaleString()
}

