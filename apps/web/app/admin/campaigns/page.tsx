import { requireAdmin } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'

export default async function AdminCampaignsPage() {
  await requireAdmin()

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold">Campaigns Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          View and manage all campaigns across the platform
        </p>
      </div>

      {/* Placeholder Content */}
      <Card className="rounded-xl border-border/50">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Campaigns Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">Campaigns overview functionality coming soon</p>
            <p className="text-sm mt-2">This page will display all campaigns, analytics, and management tools</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

