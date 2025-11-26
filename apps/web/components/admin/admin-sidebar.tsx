'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Inbox,
  Users, 
  Mail, 
  Send,
  MessageSquare, 
  UserPlus,
  Shield,
  BarChart3,
  TestTube2,
  ArrowLeft,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Master Inbox',
    href: '/admin/inbox',
    icon: Inbox,
  },
  {
    label: 'Users / Organizations',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Campaigns Overview',
    href: '/admin/campaigns',
    icon: Mail,
  },
  {
    label: 'Brevo Emails',
    href: '/admin/emails',
    icon: Send,
  },
  {
    label: 'RFQs Overview',
    href: '/admin/rfqs',
    icon: MessageSquare,
  },
  {
    label: 'Waitlist Management',
    href: '/admin/waitlist',
    icon: UserPlus,
  },
  {
    label: 'Domain Control',
    href: '/admin/domains',
    icon: Shield,
  },
  {
    label: 'Leads Management',
    href: '/admin/leads',
    icon: Database,
  },
  {
    label: 'System Metrics',
    href: '/admin/metrics',
    icon: BarChart3,
  },
  {
    label: 'Test Data',
    href: '/admin/test-data',
    icon: TestTube2,
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-border/30 bg-background">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border/30">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary-dark flex items-center justify-center">
            <span className="text-white font-semibold text-lg">A</span>
          </div>
          <span className="font-semibold text-lg text-foreground tracking-tight">Admin Panel</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href))
          
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
        
        {/* Return to Merchant View */}
        <div className="pt-6 mt-6 border-t border-border/30">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors duration-200',
              'touch-manipulation',
              'text-muted-foreground hover:bg-background-secondary hover:text-foreground'
            )}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Return to Merchant View</span>
          </Link>
        </div>
      </nav>
    </aside>
  )
}
