'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ImpersonateBarProps {
  organizationName: string
  organizationId: string
}

export function ImpersonateBar({ organizationName, organizationId }: ImpersonateBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleReturnToAdmin = () => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.delete('impersonate')
    const newPath = pathname.replace('/dashboard', '/admin')
    router.push(`${newPath}?${newSearchParams.toString()}`)
  }

  return (
    <div className="sticky top-0 z-50 bg-yellow-500/90 backdrop-blur-sm border-b border-yellow-600/50">
      <div className="flex items-center justify-between h-12 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-950" />
          <span className="text-sm sm:text-base font-medium text-yellow-950">
            You are impersonating: <span className="font-semibold">{organizationName}</span>
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

