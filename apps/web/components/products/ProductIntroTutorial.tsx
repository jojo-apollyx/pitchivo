'use client'

import { useState, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight, Upload, FileText, Sparkles, Wand2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'pitchivo_product_intro_completed'

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
    title: 'Upload Your Documents',
    description: 'On the right side of the page, you will find the file upload panel. Start by uploading your product documents like COA (Certificate of Analysis), TDS (Technical Data Sheet), or MSDS. Our AI will automatically read and extract all the important information from your files.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock page layout */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 bg-background/95">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
          
          {/* Main content - split layout */}
          <div className="flex-1 flex gap-4 p-4">
            {/* Left side - Form (dimmed) */}
            <div className="flex-1 bg-muted/20 rounded-lg p-4 space-y-3 opacity-50">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-full bg-muted/50 rounded" />
              <div className="h-8 w-full bg-muted/50 rounded" />
            </div>
            
            {/* Right side - Upload Panel (highlighted) */}
            <div className="flex-1 border-l border-border/30 pl-4">
              <div className="relative">
                <div className="absolute -inset-2 rounded-lg bg-red-500/20 animate-pulse" />
                <div className="relative bg-card rounded-xl border-2 border-dashed border-primary/30 p-6 space-y-4">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-xs font-medium text-foreground">Drop files here or click to browse</p>
                      <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, Images</p>
                    </div>
                    <div className="px-3 py-1.5 rounded border border-border bg-background text-xs">
                      Choose Files
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Review & Merge Extracted Data',
    description: 'Once AI finishes analyzing your document, you will see it in the file list on the right panel. Click the "Review" button (highlighted in yellow) to see all extracted information. You can review, edit, and then merge the data into your product form with a single click.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock page layout */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 bg-background/95">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
          
          {/* Main content - split layout */}
          <div className="flex-1 flex gap-4 p-4">
            {/* Left side - Form (dimmed) */}
            <div className="flex-1 bg-muted/20 rounded-lg p-4 space-y-3 opacity-50">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-8 w-full bg-muted/50 rounded" />
              <div className="h-8 w-full bg-muted/50 rounded" />
            </div>
            
            {/* Right side - File List (highlighted) */}
            <div className="flex-1 border-l border-border/30 pl-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-foreground/70 mb-2">Uploaded Files (1)</div>
                <div className="relative">
                  <div className="bg-card rounded-xl border border-border/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-medium truncate">COA.pdf</h4>
                          <div className="flex gap-2 items-center flex-shrink-0">
                            <div className="relative">
                              <div className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping" />
                              <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse" />
                              <div className="relative px-2 py-0.5 rounded border border-yellow-500/50 bg-yellow-50 text-yellow-700 text-xs flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Review
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">Extracted 15 fields</div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Extraction completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Generate Product Image with AI',
    description: 'In the product form on the left side, scroll to the "Product Images" section. Once you have enough product information (name, description, category, etc.), you can click the "AI Generate" button to automatically create a professional product image. The AI uses your product details to generate a high-quality image.',
    illustration: (
      <div className="w-full bg-background rounded-xl border border-border/30 overflow-hidden" style={{ height: '400px' }}>
        {/* Mock page layout */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/30 bg-background/95">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-muted" />
              <div className="h-3 w-32 rounded bg-muted" />
            </div>
          </div>
          
          {/* Main content - split layout */}
          <div className="flex-1 flex gap-4 p-4">
            {/* Left side - Form with Product Images section (highlighted) */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-6 pr-4">
                {/* Other form sections (dimmed) */}
                <div className="space-y-3 opacity-30">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-8 w-full bg-muted/50 rounded" />
                </div>
                
                {/* Product Images section (highlighted) */}
                <div className="relative">
                  <div className="absolute -inset-2 rounded-lg bg-red-500/10 animate-pulse" />
                  <div className="relative space-y-3 p-4 bg-card rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 bg-foreground/20 rounded" />
                      <div className="relative">
                        <div className="absolute -inset-3 rounded-full bg-red-500/40 animate-ping" />
                        <div className="absolute -inset-2 rounded-full bg-red-500/30 animate-pulse" />
                        <div className="relative px-3 py-1.5 rounded border border-primary bg-primary/10 text-primary text-xs flex items-center gap-2">
                          <Wand2 className="h-3.5 w-3.5" />
                          AI Generate
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-border/30 flex items-center justify-center">
                        <Wand2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="aspect-square bg-muted/30 rounded-lg border border-dashed border-border/30 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* More form sections (dimmed) */}
                <div className="space-y-3 opacity-30">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-8 w-full bg-muted/50 rounded" />
                </div>
              </div>
            </div>
            
            {/* Right side - Upload Panel (dimmed) */}
            <div className="flex-1 border-l border-border/30 pl-4 opacity-30">
              <div className="bg-muted/20 rounded-lg p-4 h-full" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

interface ProductIntroTutorialProps {
  open: boolean
  onClose: () => void
}

export function ProductIntroTutorial({ open, onClose }: ProductIntroTutorialProps) {
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

  const handleSkip = () => {
    handleComplete()
  }

  const currentStepData = TUTORIAL_STEPS[currentStep]
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleComplete()}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                Welcome to Product Creation
              </DialogTitle>
              <DialogDescription className="mt-1">
                Let's walk through the key features to help you create your first product
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
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
 * Hook to check if the product intro tutorial should be shown
 * Returns true if the tutorial hasn't been completed yet
 */
export function useShouldShowProductIntro(): boolean {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem(STORAGE_KEY)
      setShouldShow(!completed)
    }
  }, [])

  return shouldShow
}

