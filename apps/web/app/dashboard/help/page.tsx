import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HelpCircle, Mail, MessageCircle, Book, ExternalLink } from 'lucide-react'

export default async function HelpPage() {
  await requireAuth()

  const helpResources = [
    {
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      icon: Book,
      action: 'View Docs',
    },
    {
      title: 'Contact Support',
      description: 'Get help from our support team',
      icon: Mail,
      action: 'Email Us',
    },
    {
      title: 'Live Chat',
      description: 'Chat with us in real-time',
      icon: MessageCircle,
      action: 'Start Chat',
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Help & Support</h1>
        <p className="text-muted-foreground mt-1">
          Get help and learn how to use Pitchivo
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
        {helpResources.map((resource) => {
          const Icon = resource.icon
          return (
            <Card 
              key={resource.title}
              className="hover:shadow-md transition-all hover:-translate-y-1 hover:border-primary-light/50"
            >
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{resource.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {resource.description}
                </p>
                <Button variant="outline" className="w-full gap-2" disabled>
                  {resource.action}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              FAQ content coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

