'use client'

import { Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Header */}
        <header id="home-header" className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-dark transition-colors duration-200">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-foreground">Pitchivo</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <section id="home-content-section" className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="bg-background-secondary rounded-lg p-8 sm:p-12 transition-colors duration-200 hover:bg-muted hover:shadow-soft">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight text-foreground mb-4">
                Welcome to Pitchivo
              </h1>
              <p className="text-sm sm:text-base font-sans text-muted-foreground font-normal">
                Your workspace is ready. Let's start building something great.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

