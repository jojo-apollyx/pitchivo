'use client'

import { Bell } from 'lucide-react'
import { UserMenu } from './user-menu'
import { Button } from '@/components/ui/button'

interface TopbarProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
  title?: string
}

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
          </div>
          {/* Page title */}
          {title && (
            <h1 className="text-lg sm:text-xl font-semibold">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            className="relative min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <Bell className="h-5 w-5" />
            {/* Notification badge */}
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          
          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}

