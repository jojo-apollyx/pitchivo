'use client'

import { Bell, Sparkles } from 'lucide-react'
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
    <header className="sticky top-0 z-40 bg-background/98 backdrop-blur-sm border-b border-border/30">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary-dark flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          {/* Page title */}
          {title && (
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{title}</h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            className="relative h-10 w-10 rounded-md hover:bg-background-secondary touch-manipulation"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
            {/* Notification badge */}
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          
          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
