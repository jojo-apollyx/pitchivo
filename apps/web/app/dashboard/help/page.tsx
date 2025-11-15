import { requireAuth } from '@/lib/auth'
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Help & Support</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Get help and learn how to use Pitchivo
            </p>
          </div>
        </section>

        {/* Help Resources */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/20 bg-background/80 backdrop-blur-sm">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl">
            {helpResources.map((resource) => {
              const Icon = resource.icon
              return (
                <div
                  key={resource.title}
                  className="bg-card/50 backdrop-blur-sm rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary-light/20 active:scale-[0.98] group"
                >
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary-light/20">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">{resource.title}</h2>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                  <Button variant="outline" className="w-full gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20" disabled>
                    {resource.action}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-background/60 backdrop-blur-sm min-h-[500px]">
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-lg sm:text-xl font-semibold">Frequently Asked Questions</h2>
              </div>
              <div className="min-h-[300px] flex items-center justify-center">
                <p className="text-sm sm:text-base text-muted-foreground text-center">
                  FAQ content coming soon
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

