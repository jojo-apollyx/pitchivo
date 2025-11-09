import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Package, Plus } from 'lucide-react'

export default async function ProductsPage() {
  await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Products</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  Manage your product pages and catalog
                </p>
              </div>
              <Button className="min-h-[44px] gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </div>
          </div>
        </section>

        {/* Empty State */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl min-h-[400px] flex items-center justify-center p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2">No products yet</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Create your first product page to start showcasing to buyers
                </p>
                <Button className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20">
                  <Plus className="h-4 w-4" />
                  Create Product
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

