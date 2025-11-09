'use client'

import Link from 'next/link'
import { Search, ArrowLeft } from 'lucide-react'
import { UserMenu } from '../dashboard/user-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AdminTopbarProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
  searchPlaceholder?: string
  onSearch?: (value: string) => void
}

export function AdminTopbar({ user, searchPlaceholder = "Search users or organizations...", onSearch }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Mobile back button and logo */}
          <div className="lg:hidden flex items-center gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[36px] px-2 -ml-2"
                title="Return to Merchant View"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="font-semibold text-lg">Admin Panel</span>
            </div>
          </div>
          {/* Desktop title */}
          <div className="hidden lg:block">
            <h1 className="text-lg sm:text-xl font-semibold">Admin Panel</h1>
          </div>
          {/* Search box */}
          {onSearch && (
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder={searchPlaceholder}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* User menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}

