'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ImpersonateBarClientProps {
  userName: string
  organizationName: string
}

export function ImpersonateBarClient({ userName, organizationName }: ImpersonateBarClientProps) {
  const router = useRouter()

  const handleReturnToAdmin = async () => {
    try {
      // Clear impersonate cookie
      const response = await fetch('/api/impersonate', {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear impersonate session')
      }
      
      // Redirect to admin
      router.push('/admin/users')
      router.refresh()
    } catch (error) {
      console.error('Error clearing impersonation:', error)
      // Still try to redirect
      router.push('/admin/users')
      router.refresh()
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600/50">
      <div className="flex items-center justify-between h-12 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-950" />
          <span className="text-sm sm:text-base font-medium text-yellow-950">
            {`Impersonating: `}<span className="font-semibold">{userName}</span> ({organizationName})
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToAdmin}
          className="min-h-[36px] px-3 text-xs sm:text-sm bg-background/50 hover:bg-background border-yellow-950/30 text-yellow-950"
        >
          <X className="h-4 w-4 mr-2" />
          Return to Admin View
        </Button>
      </div>
    </div>
  )
}

