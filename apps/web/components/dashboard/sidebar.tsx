'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Settings 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'Campaigns',
    href: '/dashboard/campaigns',
    icon: Mail,
  },
  {
    label: 'RFQs',
    href: '/dashboard/rfqs',
    icon: MessageSquare,
  },
  {
    label: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border/50 bg-card">
      <div className="flex items-center h-16 px-6 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">P</span>
          </div>
          <span className="font-semibold text-lg">Pitchivo</span>
        </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                'active:scale-[0.98] touch-manipulation',
                isActive 
                  ? 'bg-primary/10 text-primary font-medium' 
                  : 'text-foreground/70 hover:bg-accent/5 hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-colors',
                isActive && 'text-primary'
              )} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

