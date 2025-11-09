import { requireAuth, getUserProfile } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">More</h1>
        <p className="text-muted-foreground mt-1">
          Additional menu options
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/30">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors touch-manipulation active:bg-accent/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              )
            })}
            {isAdmin && (
              <>
                <div className="border-t border-border/30 my-2" />
                <Link
                  href={adminMenuItem.href}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors touch-manipulation active:bg-accent/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{adminMenuItem.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {adminMenuItem.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

