'use client'

import { User, LogOut, Building2, CreditCard, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  user: {
    id: string
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const avatarUrl = user.user_metadata?.avatar_url
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm">
          <p className="font-semibold">{fullName}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => router.push('/dashboard/profile')}
          className="cursor-pointer"
        >
          <User className="h-4 w-4 mr-2" />
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push('/dashboard/settings')}
          className="cursor-pointer"
        >
          <Building2 className="h-4 w-4 mr-2" />
          Organization Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push('/dashboard/billing')}
          className="cursor-pointer"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Billing & Subscription
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push('/dashboard/help')}
          className="cursor-pointer"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Help / Support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

