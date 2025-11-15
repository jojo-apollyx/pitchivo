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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">More</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Additional menu options
            </p>
          </div>
        </section>

        {/* Menu Items */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-background/60 backdrop-blur-sm min-h-[500px]">
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl divide-y divide-border/30 overflow-hidden shadow-sm">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 touch-manipulation active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <p className="font-medium text-base sm:text-lg group-hover:text-primary transition-colors duration-300">{item.label}</p>
                        <p className="text-sm text-muted-foreground">
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
                    href={adminMenuItem.href}
                    className="flex items-center justify-between p-4 sm:p-6 hover:bg-primary/5 transition-all duration-300 touch-manipulation active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <p className="font-medium text-base sm:text-lg group-hover:text-primary transition-colors duration-300">{adminMenuItem.label}</p>
                        <p className="text-sm text-muted-foreground">
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
    </div>
  )
}

