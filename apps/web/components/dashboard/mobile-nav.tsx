'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, MessageSquare, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNavItems = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Products',
    href: '/dashboard/products',
    icon: Package,
  },
  {
    label: 'RFQs',
    href: '/dashboard/rfqs',
    icon: MessageSquare,
  },
  {
    label: 'More',
    href: '/dashboard/more',
    icon: Menu,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border/50 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/dashboard/more' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
                'transition-colors touch-manipulation min-h-[44px] min-w-[44px]',
                isActive 
                  ? 'text-primary' 
                  : 'text-foreground/60'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

