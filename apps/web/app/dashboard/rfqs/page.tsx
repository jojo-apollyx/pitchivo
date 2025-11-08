import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default async function RFQsPage() {
  await requireAuth()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">RFQs</h1>
        <p className="text-muted-foreground mt-1">
          View and manage requests for quotation from buyers
        </p>
      </div>

      <Card className="min-h-[400px] flex items-center justify-center">
        <CardContent className="text-center p-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mb-2">No RFQs received yet</CardTitle>
          <p className="text-muted-foreground">
            When buyers send you requests for quotation, they'll appear here
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

