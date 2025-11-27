import { 
  Package, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  CheckCircle2,
  FileText,
  Send,
  Sparkles,
  type LucideIcon
} from 'lucide-react'

export type ActivityType = 
  | 'onboarding_welcome'
  | 'onboarding_product'
  | 'onboarding_campaign'
  | 'product_created'
  | 'campaign_created'
  | 'rfq_received'
  | 'subscription_updated'

export interface Activity {
  id: string
  type: ActivityType
  icon: LucideIcon
  title: string
  description: string
  timestamp: Date
  href?: string // URL to navigate to when clicked
  completed?: boolean // For onboarding tasks
  metadata?: Record<string, any> // Additional data
}

/**
 * Get icon for activity type
 */
function getActivityIcon(type: ActivityType): LucideIcon {
  switch (type) {
    case 'onboarding_welcome':
    case 'onboarding_product':
    case 'onboarding_campaign':
      return CheckCircle2
    case 'product_created':
      return Package
    case 'campaign_created':
      return Send
    case 'rfq_received':
      return MessageSquare
    case 'subscription_updated':
      return CreditCard
    default:
      return FileText
  }
}

/**
 * Format relative time (e.g., "2 hours ago", "Just now")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  // For older dates, show formatted date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Fetch and format activities from database
 */
export async function fetchActivities(orgId: string, userId: string): Promise<Activity[]> {
  const activities: Activity[] = []
  
  // We'll need to import createClient here, but for now return empty
  // This will be implemented in the page component
  return activities
}

/**
 * Create onboarding activities based on user progress
 */
export function createOnboardingActivities(
  hasProducts: boolean,
  hasCampaigns: boolean,
  productIntroCompleted: boolean,
  dashboardIntroCompleted: boolean
): Activity[] {
  const activities: Activity[] = []

  // Welcome activity (always completed if user is logged in)
  activities.push({
    id: 'onboarding_welcome',
    type: 'onboarding_welcome',
    icon: CheckCircle2,
    title: 'Welcome to Pitchivo!',
    description: 'Your account has been created successfully',
    timestamp: new Date(), // Use account creation date in real implementation
    completed: true,
  })

  // Product creation onboarding
  if (!hasProducts) {
    activities.push({
      id: 'onboarding_product',
      type: 'onboarding_product',
      icon: Package,
      title: 'Next step: Upload your first product',
      description: 'Create product pages to start reaching buyers',
      timestamp: new Date(),
      completed: false,
      href: '/dashboard/products/create',
    })
  } else {
    activities.push({
      id: 'onboarding_product',
      type: 'onboarding_product',
      icon: CheckCircle2,
      title: 'Product created!',
      description: 'You have successfully created your first product',
      timestamp: new Date(),
      completed: true,
      href: '/dashboard/products',
    })
  }

  // Campaign creation onboarding (only show if products exist)
  if (hasProducts) {
    if (!hasCampaigns) {
      activities.push({
        id: 'onboarding_campaign',
        type: 'onboarding_campaign',
        icon: Send,
        title: 'Set up your first campaign',
        description: 'Start sending personalized emails to potential buyers',
        timestamp: new Date(),
        completed: false,
        href: '/dashboard/campaigns',
      })
    } else {
      activities.push({
        id: 'onboarding_campaign',
        type: 'onboarding_campaign',
        icon: CheckCircle2,
        title: 'Campaign created!',
        description: 'You have successfully created your first campaign',
        timestamp: new Date(),
        completed: true,
        href: '/dashboard/campaigns',
      })
    }
  }

  return activities
}

/**
 * Format activity from database record
 */
export function formatProductActivity(product: any): Activity {
  return {
    id: `product_${product.product_id}`,
    type: 'product_created',
    icon: getActivityIcon('product_created'),
    title: 'Product created',
    description: product.product_name || 'New product',
    timestamp: new Date(product.created_at),
    href: `/dashboard/products/${product.product_id}`,
    metadata: { product_id: product.product_id },
  }
}

export function formatCampaignActivity(campaign: any): Activity {
  return {
    id: `campaign_${campaign.campaign_id}`,
    type: 'campaign_created',
    icon: getActivityIcon('campaign_created'),
    title: 'Campaign created',
    description: campaign.campaign_name || 'New campaign',
    timestamp: new Date(campaign.created_at),
    href: `/dashboard/campaigns/${campaign.campaign_id}`,
    metadata: { campaign_id: campaign.campaign_id },
  }
}

export function formatRFQActivity(rfq: any): Activity {
  return {
    id: `rfq_${rfq.rfq_id}`,
    type: 'rfq_received',
    icon: getActivityIcon('rfq_received'),
    title: 'New RFQ received',
    description: `${rfq.name} from ${rfq.company}`,
    timestamp: new Date(rfq.submitted_at),
    href: '/dashboard/rfqs',
    metadata: { rfq_id: rfq.rfq_id, product_id: rfq.product_id },
  }
}

export function formatSubscriptionActivity(subscription: any, previousTier?: string): Activity {
  const tierChanged = previousTier && previousTier !== subscription.tier
  const timestamp = subscription.updated_at || subscription.created_at
  return {
    id: `subscription_${Date.parse(timestamp)}`,
    type: 'subscription_updated',
    icon: getActivityIcon('subscription_updated'),
    title: tierChanged ? 'Subscription updated' : 'Subscription active',
    description: tierChanged 
      ? `Upgraded to ${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan`
      : `${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan active`,
    timestamp: new Date(timestamp),
    href: '/dashboard/billing',
    metadata: { tier: subscription.tier, status: subscription.status },
  }
}

