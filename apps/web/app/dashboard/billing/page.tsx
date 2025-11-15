import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowUpRight } from 'lucide-react'

export default async function BillingPage() {
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Billing & Subscription</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your subscription plan and billing information
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl bg-background/60 backdrop-blur-sm min-h-[500px]">
          {/* Current Plan */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold">Current Plan</h2>
              <Badge className="bg-primary text-primary-foreground">Active</Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-2xl sm:text-3xl font-bold">Basic Plan</p>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Free tier - Limited features
                </p>
              </div>
              <Button className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
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
              <p className="text-sm sm:text-base text-muted-foreground">
                No billing information on file
              </p>
            </div>
          </section>

          {/* Invoice History */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              No invoices yet
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

