import { requireAdmin } from '@/lib/auth'
import { BarChart3 } from 'lucide-react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Metrics - Admin - Pitchivo',
  description: 'Platform-wide analytics, performance metrics, and system health monitoring.',
}

export default async function AdminMetricsPage() {
  await requireAdmin()

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Page Header */}
        <section id="admin-metrics-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold">System Metrics</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Platform-wide analytics and performance metrics
            </p>
          </div>
        </section>

        {/* Placeholder Content */}
        <section id="admin-metrics-content-section" className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-background-secondary rounded-lg p-8 sm:p-12 transition-colors duration-200 hover:bg-muted hover:shadow-soft">
              <div className="text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg bg-accent-surface flex items-center justify-center mx-auto mb-6 transition-colors duration-200">
                  <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-primary-dark" />
                </div>
                <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2">System Metrics</h2>
                <p className="text-base text-muted-foreground mb-2">System metrics functionality coming soon</p>
                <p className="text-sm text-muted-foreground">This page will display platform analytics, performance metrics, and system health</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

