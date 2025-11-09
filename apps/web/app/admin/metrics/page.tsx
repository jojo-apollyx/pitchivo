import { requireAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export default async function AdminMetricsPage() {
  await requireAdmin()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">System Metrics</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Platform-wide analytics and performance metrics
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">System metrics functionality coming soon</p>
            <p className="text-sm mt-2">This page will display platform analytics, performance metrics, and system health</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

