'use client'

import { Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Pitchivo</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 sm:p-12 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Welcome to Pitchivo
              </h1>
              <p className="text-base sm:text-lg text-foreground/70">
                Your workspace is ready. Let's start building something great.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

