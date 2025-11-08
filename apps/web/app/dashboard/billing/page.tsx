import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowUpRight } from 'lucide-react'

export default async function BillingPage() {
  await requireAuth()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Billing & Subscription</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription plan and billing information
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <Badge className="bg-primary text-primary-foreground">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">Basic Plan</p>
                <p className="text-muted-foreground mt-1">
                  Free tier - Limited features
                </p>
              </div>
              <Button className="gap-2">
                Upgrade Plan
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Billing Information</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No billing information on file
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              No invoices yet
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

