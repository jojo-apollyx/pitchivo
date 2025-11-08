import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Plus } from 'lucide-react'

export default async function CampaignsPage() {
  await requireAuth()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your email campaigns
          </p>
        </div>
        <Button className="min-h-[44px] gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center p-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mb-2">No campaigns yet</CardTitle>
          <p className="text-muted-foreground mb-6">
            Start your first email campaign to reach potential buyers
          </p>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

