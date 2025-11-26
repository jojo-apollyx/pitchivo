'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Settings,
  Shield,
  Sparkles
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

interface SidebarProps {
  isAdmin?: boolean
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border/30 bg-background">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border/30">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary-dark flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-foreground tracking-tight">Pitchivo</span>
        </Link>
      </div>
      
      {/* Navigation */}
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
                'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-200',
                'touch-manipulation',
                isActive 
                  ? 'bg-accent-surface text-primary-dark font-medium' 
                  : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 transition-colors',
                isActive ? 'text-primary-dark' : ''
              )} />
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
        
        {/* Admin Link */}
        {isAdmin && (
          <>
            <div className="pt-6 mt-6 border-t border-border/30" />
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-200',
                'touch-manipulation',
                pathname.startsWith('/admin')
                  ? 'bg-accent-surface text-primary-dark font-medium' 
                  : 'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
              )}
            >
              <Shield className={cn(
                'h-5 w-5 transition-colors',
                pathname.startsWith('/admin') ? 'text-primary-dark' : ''
              )} />
              <span className="text-sm">Admin Panel</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
