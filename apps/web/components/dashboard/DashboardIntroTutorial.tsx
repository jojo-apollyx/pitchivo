'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Send, MessageSquare, CheckCircle2, Package, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'pitchivo_dashboard_intro_completed'

interface TutorialStep {
  id: number
  title: string
  description: string
  illustration: React.ReactNode
  highlightElement?: string // ID or selector of element to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: 'Create Your First Product',
    description: 'At the top of your dashboard, you will find quick action buttons. Click the "Upload Product" button (highlighted) to start creating your first product. Our AI will automatically extract information from your documents and help you create professional product pages.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock dashboard layout */}
        <div className="h-full flex flex-col">
          {/* Header/Welcome Section */}
          <div className="px-4 py-4 border-b border-border/30 bg-background/95">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-48 bg-foreground/20 rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              
              {/* Quick Actions - Desktop */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse" />
                  <div className="relative px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2">
                    <Plus className="h-3.5 w-3.5" />
                    Upload Product
                  </div>
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Metrics Section (dimmed) */}
          <div className="flex-1 p-4 space-y-3 opacity-30">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Start Your First Campaign',
    description: 'Once you have products, click the "Start Campaign" button in the top right of your dashboard to create email campaigns. Set up personalized outreach campaigns that automatically send targeted emails to your buyer database.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock dashboard layout */}
        <div className="h-full flex flex-col">
          {/* Header/Welcome Section */}
          <div className="px-4 py-4 border-b border-border/30 bg-background/95">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-48 bg-foreground/20 rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              
              {/* Quick Actions - Desktop */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse" />
                  <div className="relative px-4 py-2 rounded-md border border-border bg-background text-xs font-medium flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Start Campaign
                  </div>
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Metrics Section (dimmed) */}
          <div className="flex-1 p-4 space-y-3 opacity-30">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'View & Respond to RFQs',
    description: 'Click the "View RFQs" button in the top right of your dashboard to monitor incoming Requests for Quotations from potential buyers. View details, respond to inquiries, and manage your sales pipeline all in one place.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock dashboard layout */}
        <div className="h-full flex flex-col">
          {/* Header/Welcome Section */}
          <div className="px-4 py-4 border-b border-border/30 bg-background/95">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="h-5 w-48 bg-foreground/20 rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              
              {/* Quick Actions - Desktop */}
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <div className="px-3 py-2 rounded-md border border-border bg-background text-xs opacity-50">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse" />
                  <div className="relative px-4 py-2 rounded-md border border-border bg-background text-xs font-medium flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5" />
                    View RFQs
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Metrics Section (dimmed) */}
          <div className="flex-1 p-4 space-y-3 opacity-30">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted/50 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

interface DashboardIntroTutorialProps {
  open: boolean
  onClose: () => void
}

export function DashboardIntroTutorial({ open, onClose }: DashboardIntroTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    // Mark tutorial as completed in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    onClose()
  }

  const currentStepData = TUTORIAL_STEPS[currentStep]
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleComplete()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <DialogTitle className="text-xl font-semibold">
            Welcome to Your Dashboard
          </DialogTitle>
          <DialogDescription className="mt-1">
            Let's explore the key features to help you get started
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2">
            {TUTORIAL_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                )}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-4 min-h-[480px] flex flex-col">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Illustration */}
            <div className="flex items-center justify-center py-4 flex-1 overflow-hidden">
              <div className="w-full max-w-4xl">
                {currentStepData.illustration}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-border/30">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {TUTORIAL_STEPS.length}
              </span>
            </div>

            <Button
              onClick={handleNext}
              className="gap-2"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <CheckCircle2 className="h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Hook to check if the dashboard intro tutorial should be shown
 * Returns true if the tutorial hasn't been completed yet
 */
export function useShouldShowDashboardIntro(): boolean {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(STORAGE_KEY)
      setShouldShow(!completed)
    }
  }, [])

  return shouldShow
}

