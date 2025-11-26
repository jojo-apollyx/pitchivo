'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Home, Search, PackageX } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <div className="rounded-lg border border-border/50 bg-background-secondary p-8 sm:p-12 shadow-soft transition-colors duration-200 hover:bg-muted">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-lg bg-accent-surface p-6">
                <PackageX className="h-16 w-16 text-primary-dark" />
              </div>
            </div>

            {/* Error Code */}
            <div className="text-center mb-4">
              <h1 className="text-8xl sm:text-9xl font-bold text-foreground">
                404
              </h1>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3 text-foreground">
              Page Not Found
            </h2>

            {/* Description */}
            <p className="text-center text-muted-foreground mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or may have been moved. 
              If you're trying to preview a product, make sure it has been published first.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.back()}
                variant="outline"
                size="lg"
                className="gap-2 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
                Go Back
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                size="lg"
                className="gap-2 transition-colors duration-200"
              >
                <Home className="h-5 w-5" />
                Go to Dashboard
              </Button>
            </div>

            {/* Additional Help */}
            <div className="mt-8 pt-8 border-t border-border/50">
              <p className="text-sm text-center text-muted-foreground mb-4">
                Need help? Here are some suggestions:
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="font-medium text-foreground mb-1">📦 Products</p>
                  <p className="text-xs text-muted-foreground">
                    View and manage your products
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-xs"
                    onClick={() => router.push('/dashboard/products')}
                  >
                    Go to Products →
                  </Button>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border/50">
                  <p className="font-medium text-foreground mb-1">🚀 Campaigns</p>
                  <p className="text-xs text-muted-foreground">
                    Check your active campaigns
                  </p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-xs"
                    onClick={() => router.push('/dashboard/campaigns')}
                  >
                    Go to Campaigns →
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Error Code: 404 • Page Not Found
          </p>
        </div>
      </div>
    </div>
  )
}

