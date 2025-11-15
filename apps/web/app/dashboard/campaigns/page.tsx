import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Mail, Plus } from 'lucide-react'

export default async function CampaignsPage() {
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Campaigns</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Create and manage your email campaigns
                </p>
              </div>
              <Button className="min-h-[44px] gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                <Plus className="h-4 w-4" />
                New Campaign
              </Button>
            </div>
          </div>
        </section>

        {/* Empty State */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-background/60 backdrop-blur-sm min-h-[500px]">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl min-h-[400px] flex items-center justify-center p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Mail className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">No campaigns yet</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Start your first email campaign to reach potential buyers
                </p>
                <Button className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                  <Plus className="h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

