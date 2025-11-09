import { requireAdmin } from '@/lib/auth'
import { MessageSquare } from 'lucide-react'

export default async function AdminRFQsPage() {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">RFQs Overview</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              View and manage all RFQs across the platform
            </p>
          </div>
        </section>

        {/* Placeholder Content */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 sm:p-12 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">RFQs Overview</h2>
                <p className="text-base text-muted-foreground mb-2">RFQs overview functionality coming soon</p>
                <p className="text-sm text-muted-foreground">This page will display all RFQs, analytics, and management tools</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

