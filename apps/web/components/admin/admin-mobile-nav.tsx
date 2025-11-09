'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  MessageSquare, 
  UserPlus,
  Shield,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

const menuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
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
    label: 'System Metrics',
    href: '/admin/metrics',
    icon: BarChart3,
  },
]

interface AdminMobileNavProps {
  children: React.ReactNode
}

export function AdminMobileNav({ children }: AdminMobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="px-6 py-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <SheetTitle className="font-semibold text-lg">Admin Panel</SheetTitle>
          </div>
        </SheetHeader>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href))
            
            return (
              <SheetClose key={item.href} asChild>
                <Link
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
              </SheetClose>
            )
          })}
          <div className="pt-6 mt-6 border-t border-border/50">
            <SheetClose asChild>
              <Link
                href="/dashboard"
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  'active:scale-[0.98] touch-manipulation',
                  'text-foreground/70 hover:bg-accent/5 hover:text-foreground'
                )}
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Return to Merchant View</span>
              </Link>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

