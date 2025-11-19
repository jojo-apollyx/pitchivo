import { requireAuth, getUserProfile } from '@/lib/auth'
import Link from 'next/link'
import { 
  Mail, 
  CreditCard, 
  Settings, 
  User, 
  HelpCircle, 
  ChevronRight,
  Shield
} from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'More - Pitchivo',
  description: 'Access additional features, settings, and admin tools.',
}

export default async function MorePage() {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  const isAdmin = profile?.is_pitchivo_admin ?? false

  const menuItems = [
    {
      label: 'Campaigns',
      href: '/dashboard/campaigns',
      icon: Mail,
      description: 'Email campaigns',
    },
    {
      label: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      description: 'Subscription & invoices',
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'Organization settings',
    },
    {
      label: 'My Profile',
      href: '/dashboard/profile',
      icon: User,
      description: 'Personal information',
    },
    {
      label: 'Help & Support',
      href: '/dashboard/help',
      icon: HelpCircle,
      description: 'Get help',
    },
  ]

  const adminMenuItem = {
    label: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    description: 'System administration',
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl animate-float pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl animate-float pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section id="more-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground">More</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Additional menu options
            </p>
          </div>
        </section>

        {/* Menu Items */}
        <section id="more-menu-section" className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl divide-y divide-border/30 overflow-hidden shadow-sm">
              {menuItems.map((item) => {
                const Icon = item.icon
                const linkId = item.href.split('/').pop() || 'link'
                return (
                  <Link
                    key={item.href}
                    id={`more-${linkId}-link`}
                    href={item.href}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 touch-manipulation active:scale-[0.98] group"
                    aria-label={`Go to ${item.label}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors duration-300 text-foreground">{item.label}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                )
              })}
              {isAdmin && (
                <>
                  <div className="border-t border-border/30 my-2" />
                  <Link
                    id="more-admin-panel-link"
                    href={adminMenuItem.href}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 touch-manipulation active:scale-[0.98] group"
                    aria-label="Go to Admin Panel"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors duration-300 text-foreground">{adminMenuItem.label}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                          {adminMenuItem.description}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

