'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Eye, Globe, Mail, CheckCircle2, Loader2, FileText, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useProduct } from '@/lib/api/products'
import { cn } from '@/lib/utils'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { ACCESS_LEVEL_CONFIG } from '@/lib/constants/access-levels'

// Note: Full page preview will be added in future iteration

// Permission levels
type AccessLevel = 'public' | 'after_click' | 'after_rfq'
type FieldPermission = {
  [fieldName: string]: AccessLevel
}

// Step indicator component
function StepIndicator({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  const steps = [
    { number: 1, title: 'Edit Permissions', icon: FileText },
    { number: 2, title: 'Preview', icon: Eye },
  ]

  return (
    <div className="flex items-center justify-center gap-4 py-6">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = currentStep === step.number
        const isCompleted = currentStep > step.number
        const isClickable = step.number < currentStep

        return (
          <div key={step.number} className="flex items-center">
            <button
              onClick={() => isClickable && onStepClick(step.number)}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all',
                isActive && 'bg-primary text-primary-foreground border-primary shadow-lg',
                isCompleted && 'bg-accent/10 text-accent-dark border-accent/30 cursor-pointer hover:bg-accent/20',
                !isActive && !isCompleted && 'bg-muted/30 text-muted-foreground border-border/30 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all',
                  isActive && 'bg-primary-foreground text-primary',
                  isCompleted && 'bg-accent text-accent-foreground',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium">Step {step.number}</p>
                <p className="text-sm font-semibold">{step.title}</p>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-12 mx-2 transition-all',
                  isCompleted ? 'bg-accent' : 'bg-border/30'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Permission Widget Component
function PermissionWidget({
  value,
  onChange,
  disabled = false,
}: {
  value: AccessLevel
  onChange: (level: AccessLevel) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-1 w-full sm:w-auto">
      <button
        type="button"
        onClick={() => onChange('public')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          value === 'public'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">👀</span>
        <span className="hidden sm:inline">Basic</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_click')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          value === 'after_click'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">🔗</span>
        <span className="hidden sm:inline">More</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_rfq')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          value === 'after_rfq'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">✅</span>
        <span className="hidden sm:inline">All</span>
      </button>
    </div>
  )
}

// Field Display Component
function FieldDisplay({
  label,
  value,
  fieldName,
  permission,
  onPermissionChange,
}: {
  label: string
  value: any
  fieldName: string
  permission: AccessLevel
  onPermissionChange: (fieldName: string, level: AccessLevel) => void
}) {
  const displayValue = useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '-'
    if (Array.isArray(value)) return `${value.length} item(s)`
    if (typeof value === 'object') return 'Complex data'
    return String(value).slice(0, 100)
  }, [value])

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border/30">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground truncate">{displayValue}</p>
      </div>
      <div className="flex-shrink-0">
        <PermissionWidget
          value={permission}
          onChange={(level) => onPermissionChange(fieldName, level)}
        />
      </div>
    </div>
  )
}

export default function PreviewPublishPageNew() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string

  const [currentStep, setCurrentStep] = useState(1)
  const [permissions, setPermissions] = useState<FieldPermission>({})
  const [previewStage, setPreviewStage] = useState<'guest' | 'link' | 'rfq'>('guest')
  const [isPublishing, setIsPublishing] = useState(false)

  const permissionsInitialized = useRef(false)

  // Load product data
  const { data: productData, isLoading } = useProduct(productId)

  // Extract product form data
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // Initialize permissions
  useEffect(() => {
    if (!formData || permissionsInitialized.current) return

    const formDataAny = formData as any

    if (formDataAny.field_permissions && typeof formDataAny.field_permissions === 'object') {
      setPermissions(formDataAny.field_permissions)
      permissionsInitialized.current = true
      return
    }

    // Default permissions
    const defaultPermissions: FieldPermission = {}
    const sensitiveFields = ['price_lead_time', 'samples', 'coa_file', 'tds_file', 'uploaded_files']

    Object.keys(formData).forEach((key) => {
      if (key.startsWith('_') || key === 'field_permissions' || key === 'channel_links') return

      const value = formData[key as keyof typeof formData]
      const hasValue = value !== null && value !== undefined && value !== '' &&
        (!Array.isArray(value) || value.length > 0)

      if (hasValue) {
        defaultPermissions[key] = sensitiveFields.includes(key) ? 'after_rfq' : 'public'
      }
    })

    setPermissions(defaultPermissions)
    permissionsInitialized.current = true
  }, [formData])

  const handlePermissionChange = (fieldName: string, level: AccessLevel) => {
    setPermissions((prev) => ({ ...prev, [fieldName]: level }))
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      const updatedProductData = {
        ...formData,
        field_permissions: permissions,
      }

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          status: 'published',
          product_data: updatedProductData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to publish product')
      }

      toast.success('Product published successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error publishing product:', error)
      toast.error('Failed to publish product')
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Product not found</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  const fieldsWithValues = Object.keys(formData).filter((key) => {
    if (key.startsWith('_') || key === 'field_permissions' || key === 'channel_links') return false
    const value = formData[key as keyof typeof formData]
    return value !== null && value !== undefined && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
  })

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/products/create?productId=${productId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">
                  {formData.product_name || 'Product'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Review & Publish
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              Ready to Publish
            </Badge>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Step Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Explanation Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h2 className="text-lg font-semibold mb-3">Step 1: Control What Visitors See</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set the visibility level for each field. You can always change these later.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">👀 Basic Info</p>
                  <p className="text-xs text-muted-foreground">Visible to everyone</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">🔗 More Details</p>
                  <p className="text-xs text-muted-foreground">For marketing link visitors</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">✅ Complete Access</p>
                  <p className="text-xs text-muted-foreground">After quote request</p>
                </div>
              </div>
            </div>

            {/* Fields List */}
            <div className="rounded-xl border border-border/30 bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Product Fields ({fieldsWithValues.length})</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPerms: FieldPermission = {}
                      Object.keys(permissions).forEach((k) => { newPerms[k] = 'public' })
                      setPermissions(newPerms)
                      toast.success('All fields set to Basic Info')
                    }}
                  >
                    Set All Basic
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPerms: FieldPermission = {}
                      Object.keys(permissions).forEach((k) => { newPerms[k] = 'after_rfq' })
                      setPermissions(newPerms)
                      toast.success('All fields set to Complete')
                    }}
                  >
                    Set All Complete
                  </Button>
                </div>
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {fieldsWithValues.map((fieldName) => {
                  const value = formData[fieldName as keyof typeof formData]
                  const label = fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

                  return (
                    <FieldDisplay
                      key={fieldName}
                      label={label}
                      value={value}
                      fieldName={fieldName}
                      permission={permissions[fieldName] || 'public'}
                      onPermissionChange={handlePermissionChange}
                    />
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
              <Button size="lg" onClick={() => setCurrentStep(2)} className="gap-2">
                Continue to Preview
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Explanation Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h2 className="text-lg font-semibold mb-3">Step 2: Preview Your Product Page</h2>
              <p className="text-sm text-muted-foreground mb-4">
                See exactly how your product appears to different visitors. Switch between stages below.
              </p>
            </div>

            {/* Stage Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPreviewStage('guest')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'guest'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="text-sm font-semibold">Guest Visitor</span>
                </div>
                <p className={cn('text-xs', previewStage === 'guest' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  Anyone browsing without a special link sees only basic information
                </p>
              </button>

              <button
                onClick={() => setPreviewStage('link')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'link'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-semibold">Marketing Link</span>
                </div>
                <p className={cn('text-xs', previewStage === 'link' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  People who click your email, social, or QR code links see more details
                </p>
              </button>

              <button
                onClick={() => setPreviewStage('rfq')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'rfq'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">After Quote</span>
                </div>
                <p className={cn('text-xs', previewStage === 'rfq' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  After submitting a quote request, visitors see everything including downloads
                </p>
              </button>
            </div>

            {/* Preview Content */}
            <div className="rounded-xl border border-border/30 bg-card p-6">
              <h3 className="text-lg font-semibold mb-4">
                What {previewStage === 'guest' ? 'Guest Visitors' : previewStage === 'link' ? 'Marketing Link Visitors' : 'Quote Requesters'} Can See
              </h3>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {fieldsWithValues.map((fieldName) => {
                  const label = fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  const permission = permissions[fieldName] || 'public'
                  
                  // Determine if field is visible in current preview stage
                  let isVisible = false
                  if (previewStage === 'guest') {
                    isVisible = permission === 'public'
                  } else if (previewStage === 'link') {
                    isVisible = permission === 'public' || permission === 'after_click'
                  } else {
                    isVisible = true // rfq stage sees everything
                  }
                  
                  return (
                    <div 
                      key={fieldName}
                      className={cn(
                        'p-3 rounded-lg border flex items-center justify-between',
                        isVisible 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                          : 'bg-muted/30 border-border/30 opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isVisible ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {permission === 'public' ? '👀 Basic' : permission === 'after_click' ? '🔗 More' : '✅ All'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-dashed border-border/30">
                <p className="text-xs text-muted-foreground text-center">
                  {previewStage === 'guest' && `${fieldsWithValues.filter(f => (permissions[f] || 'public') === 'public').length} of ${fieldsWithValues.length} fields visible`}
                  {previewStage === 'link' && `${fieldsWithValues.filter(f => ['public', 'after_click'].includes(permissions[f] || 'public')).length} of ${fieldsWithValues.length} fields visible`}
                  {previewStage === 'rfq' && `All ${fieldsWithValues.length} fields visible + file downloads enabled`}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setCurrentStep(1)} className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back to Permissions
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/dashboard/products')}
                >
                  Skip & Save as Draft
                </Button>
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Publish Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

