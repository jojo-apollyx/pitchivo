'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Multiselect } from '@/components/ui/multiselect'
import { toast } from 'sonner'
import { useGetProductTemplate, useCreateProduct } from '@/lib/api/products'
import type { TemplateSchema, FieldSchema, SectionSchema } from '@/lib/api/template-validation'
import { Importance, Visibility } from '@/lib/api/template-validation'

const productNameSchema = z.object({
  product_name_raw: z.string().min(1, 'Product name is required').max(200),
})

type ProductNameFormData = z.infer<typeof productNameSchema>

export default function CreateProductPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'loading' | 'form' | 'error'>('name')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [template, setTemplate] = useState<TemplateSchema | null>(null)
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [productNameRaw, setProductNameRaw] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [loadingState, setLoadingState] = useState<{
    stage: 'analyzing_product' | 'checking_template' | 'ready'
    message: string
    industryName?: string
  } | null>(null)

  const getTemplateMutation = useGetProductTemplate()
  const createProductMutation = useCreateProduct()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductNameFormData>({
    resolver: zodResolver(productNameSchema),
    defaultValues: {
      product_name_raw: '',
    },
  })

  // Handle product name submission - get template
  const onProductNameSubmit = async (data: ProductNameFormData) => {
    setProductNameRaw(data.product_name_raw)
    setStep('loading')
    setLoadingState({
      stage: 'analyzing_product',
      message: 'Loading template...',
    })

    try {
      // Start the API call (this will use AI to detect industry)
      const responsePromise = getTemplateMutation.mutateAsync({
        product_name_raw: data.product_name_raw,
      })

      // Update state after a moment to show template checking
      setTimeout(() => {
        setLoadingState((prev) => {
          if (prev?.stage === 'analyzing_product') {
            return {
              stage: 'checking_template',
              message: 'Loading template...',
            }
          }
          return prev
        })
      }, 1500)

      const response = await responsePromise

      // Template was found for detected industry
      setLoadingState({
        stage: 'ready',
        message: 'Loading template...',
        industryName: response.industry_name,
      })
      // Small delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 600))

      const templateData = response.template as TemplateSchema
      setTemplate(templateData)
      setTemplateId(response.template_id)
      
      // Initialize form data with default values from template
      const initialFormData: Record<string, any> = {}
      templateData.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.default_value !== undefined) {
            initialFormData[field.key] = field.default_value
          }
        })
      })
      setFormData(initialFormData)
      
      setStep('form')
      setLoadingState(null)
    } catch (error) {
      console.error('Error loading template:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load template'
      
      // Check if it's a "no template found" error
      if (errorMessage.includes('No product template found')) {
        setErrorMessage(errorMessage)
        setStep('error')
      } else {
        // Other errors - show toast and go back
        const firstLine = errorMessage.split('\n')[0]
        toast.error(firstLine)
        if (errorMessage.includes('\n')) {
          console.error('Full error details:', errorMessage)
        }
        setStep('name')
      }
      setLoadingState(null)
    }
  }

  // Handle form submission - create product
  const onFormSubmit = async () => {
    if (!template || !templateId) {
      toast.error('Template not loaded')
      return
    }

    try {
      await createProductMutation.mutateAsync({
        product_name: productNameRaw,
        industry_code: template.industry,
        template_id: templateId,
        template_version_snapshot: template, // Store template snapshot
        status: 'draft',
        product_data: formData, // Dynamic form data
      })

      toast.success('Product created successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create product')
    }
  }

  // Render dynamic form field based on template field schema
  const renderField = (field: FieldSchema, sectionId: string, isAIGenerated = false) => {
    const fieldKey = `${sectionId}.${field.key}`
    const value = formData[field.key] || ''

    const handleChange = (newValue: any) => {
      setFormData((prev) => ({
        ...prev,
        [field.key]: newValue,
      }))
    }

    switch (field.type) {
      case 'text':
      case 'textarea':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-sm flex items-center gap-1.5 flex-wrap">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {(isAIGenerated || field.ai_generated) && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={fieldKey}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="text-sm"
              />
            ) : (
              <Input
                id={fieldKey}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                type="text"
                className="text-sm"
              />
            )}
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-sm flex items-center gap-1.5 flex-wrap">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {(isAIGenerated || field.ai_generated) && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </Label>
            <div className="flex gap-2">
              <Input
                id={fieldKey}
                type="number"
                value={value}
                onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
                placeholder={field.placeholder}
                required={field.required}
                min={field.validation_rules?.min}
                max={field.validation_rules?.max}
                className="flex-1 text-sm"
              />
              {field.unit && (
                <span className="px-2 py-1.5 bg-muted rounded-md text-xs flex items-center whitespace-nowrap">
                  {field.unit}
                </span>
              )}
              {field.unit_options && field.unit_type === 'select' && (
                <Select
                  value={formData[`${field.key}_unit`] || field.unit_options[0]}
                  onValueChange={(val) => handleChange({ ...value, unit: val })}
                >
                  <SelectTrigger className="w-[120px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.unit_options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'select':
      case 'multiselect':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-sm flex items-center gap-1.5 flex-wrap">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {(isAIGenerated || field.ai_generated) && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </Label>
            {field.type === 'multiselect' ? (
              <Multiselect
                options={field.options || []}
                value={(value as string[]) || []}
                onChange={handleChange}
                placeholder={`Select ${field.label.toLowerCase()}...`}
              />
            ) : (
              <Select
                value={value}
                onValueChange={handleChange}
                required={field.required}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'file':
      case 'image':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-sm flex items-center gap-1.5 flex-wrap">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {(isAIGenerated || field.ai_generated) && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </Label>
            <Input
              id={fieldKey}
              type="file"
              accept={field.accepted?.map((ext) => `.${ext}`).join(',')}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleChange(file)
                }
              }}
              required={field.required}
              className="text-sm"
            />
            {field.accepted && (
              <p className="text-xs text-muted-foreground">
                Accepted: {field.accepted.join(', ')}
              </p>
            )}
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={fieldKey} className="text-sm flex items-center gap-1.5 flex-wrap">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
              {(isAIGenerated || field.ai_generated) && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </span>
              )}
            </Label>
            <Input
              id={fieldKey}
              type="date"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
              className="text-sm"
            />
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
        )

      default:
        return null
    }
  }

  // Loading screen component
  if (step === 'loading') {
    const getLoadingMessage = (): {
      title: string
      description: string
      showSpinner: boolean
      showWarning?: boolean
      showSuccess?: boolean
    } => {
      if (!loadingState) {
        return {
          title: 'Loading...',
          description: '',
          showSpinner: true,
        }
      }
      
      switch (loadingState.stage) {
        case 'analyzing_product':
          return {
            title: 'Loading template...',
            description: '',
            showSpinner: true,
          }
        case 'checking_template':
          return {
            title: 'Loading template...',
            description: '',
            showSpinner: true,
          }
        case 'ready':
          return {
            title: 'Loading template...',
            description: '',
            showSpinner: false,
            showSuccess: true,
          }
        default:
          return {
            title: 'Loading...',
            description: '',
            showSpinner: true,
          }
      }
    }

    const loadingInfo = getLoadingMessage()

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              {loadingInfo.showSuccess ? (
                <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              ) : loadingInfo.showSpinner ? (
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : null}
            </div>

            <h2 className="text-2xl font-semibold mb-2">{loadingInfo.title}</h2>
            <p className="text-muted-foreground mb-6">{loadingInfo.description}</p>

            {loadingInfo.showSpinner && (
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                </div>
                <p className="text-xs text-muted-foreground">Please wait...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Error screen - template not found
  if (step === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-2">Template Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {errorMessage || 'No product template is available for your industry.'}
            </p>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Industry not supported:</strong> Product templates need to be created by an administrator 
                for your industry before you can add products. Please contact support or an administrator.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('name')
                  setErrorMessage('')
                }}
              >
                Try Again
              </Button>
              <Button onClick={() => router.push('/dashboard/products')}>
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'name') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Create New Product</h1>
                  <p className="text-sm text-muted-foreground">
                    Start by entering your product name
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onProductNameSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="product_name_raw">Product Name *</Label>
                  <Input
                    id="product_name_raw"
                    placeholder="e.g., Hydrolyzed Collagen Peptide Powder"
                    {...register('product_name_raw')}
                    disabled={getTemplateMutation.isPending}
                  />
                  {errors.product_name_raw && (
                    <p className="text-sm text-destructive">{errors.product_name_raw.message}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    We'll load a form template based on your industry
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={getTemplateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={getTemplateMutation.isPending}>
                    {getTemplateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading Template...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Dynamic form based on template
  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading template...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setStep('name')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 mb-4">
            <h1 className="text-xl font-semibold mb-1">{productNameRaw}</h1>
            <p className="text-xs text-muted-foreground">
              Fill in the product details below
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(); }} className="space-y-6">
            {/* Collect all fields from all sections and reorganize */}
            {(() => {
              // Collect all fields from all sections
              const allFields: Array<{ field: FieldSchema; sectionId: string; sectionTitle: string }> = []
              template.sections.forEach((section: SectionSchema) => {
                if (section.display_mode !== 'hidden') {
                  section.fields.forEach((field) => {
                    if (field.visibility !== Visibility.HIDDEN) {
                      allFields.push({
                        field,
                        sectionId: section.section_id,
                        sectionTitle: section.title,
                      })
                    }
                  })
                }
              })

              // Group by importance and prioritize images/files
              const coreImageFields = allFields.filter(
                (f) => f.field.importance === Importance.CORE && (f.field.type === 'image' || f.field.type === 'file')
              )
              const coreOtherFields = allFields.filter(
                (f) => f.field.importance === Importance.CORE && f.field.type !== 'image' && f.field.type !== 'file'
              )
              const optionalFields = allFields.filter((f) => f.field.importance === Importance.OPTIONAL)
              const extendedFields = allFields.filter(
                (f) => f.field.importance === Importance.EXTENDED && (formData[f.field.key] || f.field.ai_generated)
              )

              const areOptionalFieldsExpanded = expandedSections.has('_optional_fields')
              const areExtendedFieldsExpanded = expandedSections.has('_extended_fields')

              // Helper to render fields in 2-column grid
              const renderFieldGrid = (fields: typeof allFields) => {
                if (fields.length === 0) return null
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map(({ field, sectionId }) => (
                      <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                        {renderField(field, sectionId, field.ai_generated)}
                      </div>
                    ))}
                  </div>
                )
              }

              return (
                <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 sm:p-6 space-y-6">
                  {/* Core Fields - Images/Files First */}
                  {coreImageFields.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-foreground">Images & Files</h3>
                      {renderFieldGrid(coreImageFields)}
                    </div>
                  )}

                  {/* Core Fields - Other Important Fields */}
                  {coreOtherFields.length > 0 && (
                    <div className="space-y-4">
                      {coreImageFields.length > 0 && (
                        <h3 className="text-sm font-semibold text-foreground">Core Information</h3>
                      )}
                      {renderFieldGrid(coreOtherFields)}
                    </div>
                  )}

                  {/* Optional Fields - Collapsible */}
                  {optionalFields.length > 0 && (
                    <div className="space-y-4 border-t border-border/50 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set(expandedSections)
                          if (areOptionalFieldsExpanded) {
                            newExpanded.delete('_optional_fields')
                          } else {
                            newExpanded.add('_optional_fields')
                          }
                          setExpandedSections(newExpanded)
                        }}
                        className="w-full justify-between h-auto py-2"
                      >
                        <span className="text-sm font-medium">
                          Optional Fields ({optionalFields.length})
                        </span>
                        {areOptionalFieldsExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {areOptionalFieldsExpanded && renderFieldGrid(optionalFields)}
                    </div>
                  )}

                  {/* Extended Fields - AI Detected */}
                  {extendedFields.length > 0 && (
                    <div className="space-y-4 border-t border-border/50 pt-4">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set(expandedSections)
                          if (areExtendedFieldsExpanded) {
                            newExpanded.delete('_extended_fields')
                          } else {
                            newExpanded.add('_extended_fields')
                          }
                          setExpandedSections(newExpanded)
                        }}
                        className="w-full justify-between h-auto py-2"
                      >
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Detected Fields ({extendedFields.length})
                        </span>
                        {areExtendedFieldsExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      {areExtendedFieldsExpanded && renderFieldGrid(extendedFields)}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('name')}
                disabled={createProductMutation.isPending}
              >
                Back
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending}>
                {createProductMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Product'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

