'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Globe, Mail, Settings, Sparkles, Loader2 } from 'lucide-react'

interface SetupStep {
  id: string
  label: string
  icon: typeof Globe
  description: string
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'domain',
    label: 'Generating unique domain',
    icon: Globe,
    description: 'Creating your personalized workspace URL',
  },
  {
    id: 'workspace',
    label: 'Setting up workspace',
    icon: Settings,
    description: 'Configuring your organization settings',
  },
  {
    id: 'email',
    label: 'Configuring email system',
    icon: Mail,
    description: 'Preparing communication channels',
  },
  {
    id: 'finalize',
    label: 'Finalizing account',
    icon: Sparkles,
    description: 'Completing your setup',
  },
]

interface SetupCompletionAnimationProps {
  onComplete: () => void
  pitchivoDomain?: string | null
}

export function SetupCompletionAnimation({ onComplete, pitchivoDomain }: SetupCompletionAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [showDomain, setShowDomain] = useState(false)

  useEffect(() => {
    const stepDuration = 1500 // 1.5 seconds per step
    const totalSteps = SETUP_STEPS.length

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < totalSteps - 1) {
          // Mark current step as completed
          setCompletedSteps((prevCompleted) => {
            const newCompleted = new Set(prevCompleted)
            newCompleted.add(SETUP_STEPS[prev].id)
            return newCompleted
          })
          return prev + 1
        } else {
          // Final step - mark as completed and show domain
          setCompletedSteps((prevCompleted) => {
            const newCompleted = new Set(prevCompleted)
            newCompleted.add(SETUP_STEPS[prev].id)
            return newCompleted
          })
          setShowDomain(true)
          clearInterval(interval)
          
          // Wait a bit before calling onComplete
          setTimeout(() => {
            onComplete()
          }, 2000)
          return prev
        }
      })
    }, stepDuration)

    return () => clearInterval(interval)
  }, [onComplete])

  const isStepCompleted = (stepIndex: number) => {
    return completedSteps.has(SETUP_STEPS[stepIndex].id)
  }

  const isStepActive = (stepIndex: number) => {
    return stepIndex === currentStep && !isStepCompleted(stepIndex)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6">
        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-8 sm:p-12 shadow-premium-xl border border-border/50">
          {/* Header */}
          <div className="text-center mb-12 animate-fadeIn">
            <div className="inline-flex p-4 bg-gradient-accent rounded-2xl shadow-premium-lg mb-6 animate-scaleIn">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-slideUp">
              Setting up your workspace
            </h2>
            <p className="text-lg text-muted-foreground animate-slideUp" style={{ animationDelay: '0.1s' }}>
              We're preparing everything for you
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6 mb-8">
            {SETUP_STEPS.map((step, index) => {
              const Icon = step.icon
              const isCompleted = isStepCompleted(index)
              const isActive = isStepActive(index)
              const isPending = index > currentStep

              return (
                <div
                  key={step.id}
                  className={`
                    flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500
                    ${
                      isCompleted
                        ? 'bg-primary/10 border-primary/30 shadow-premium'
                        : isActive
                        ? 'bg-primary/5 border-primary/50 shadow-premium animate-pulse'
                        : 'bg-background/50 border-border/30'
                    }
                    animate-slideUp
                  `}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Icon */}
                  <div
                    className={`
                      flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-500
                      ${
                        isCompleted
                          ? 'bg-primary text-primary-foreground scale-110'
                          : isActive
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : 'bg-muted text-muted-foreground'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : isActive ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={`
                        font-semibold text-base mb-1 transition-all duration-500
                        ${isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'}
                      `}
                    >
                      {step.label}
                    </div>
                    <div
                      className={`
                        text-sm transition-all duration-500
                        ${isCompleted || isActive ? 'text-muted-foreground' : 'text-muted-foreground/60'}
                      `}
                    >
                      {step.description}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  {isActive && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Domain reveal */}
          {showDomain && pitchivoDomain && (
            <div className="mt-8 p-6 bg-gradient-accent-soft rounded-xl border border-primary/20 animate-scaleIn">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-background/20 rounded-lg mb-3">
                  <Globe className="w-5 h-5 text-white" />
                  <span className="text-sm font-medium text-white/90">Your workspace is ready!</span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {pitchivoDomain}
                </div>
                <p className="text-sm text-white/80">
                  Your unique Pitchivo domain has been generated
                </p>
              </div>
            </div>
          )}

          {/* Loading bar */}
          <div className="mt-8">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-accent rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep + 1) / SETUP_STEPS.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-center mt-3 text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / SETUP_STEPS.length) * 100)}% complete
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

