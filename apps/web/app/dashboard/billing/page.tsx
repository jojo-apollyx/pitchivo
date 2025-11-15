import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowUpRight } from 'lucide-react'

export default async function BillingPage() {
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Billing & Subscription</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
              Manage your subscription plan and billing information
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl">
          {/* Current Plan */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">Current Plan</h2>
              <Badge className="bg-primary text-primary-foreground text-xs sm:text-sm">Active</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Basic Plan</p>
                <p className="text-sm text-muted-foreground mt-1 font-normal">
                  Free tier - Limited features
                </p>
              </div>
              <Button className="gap-2">
                Upgrade Plan
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Billing Information */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="text-center">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground font-normal">
                No billing information on file
              </p>
            </div>
          </section>

          {/* Invoice History */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <p className="text-sm text-muted-foreground text-center font-normal">
              No invoices yet
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

