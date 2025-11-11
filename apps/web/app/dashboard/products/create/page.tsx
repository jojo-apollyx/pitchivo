'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useGetProductTemplate, useCreateProduct } from '@/lib/api/products'
import type { TemplateSchema, FieldSchema, SectionSchema } from '@/lib/api/template-validation'

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
      message: 'Analyzing product to determine industry...',
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
              message: 'Loading template for detected industry...',
            }
          }
          return prev
        })
      }, 1500)

      const response = await responsePromise

      // Template was found for detected industry
      setLoadingState({
        stage: 'ready',
        message: `Template found for ${response.industry_name}!`,
        industryName: response.industry_name,
      })
      // Small delay to show success message
      await new Promise((resolve) => setTimeout(resolve, 600))

      setTemplate(response.template as TemplateSchema)
      setTemplateId(response.template_id)
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
  const renderField = (field: FieldSchema, sectionId: string) => {
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
          <div key={field.key} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <textarea
                id={fieldKey}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            ) : (
              <Input
                id={fieldKey}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                type="text"
              />
            )}
            {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
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
                className="flex-1"
              />
              {field.unit && (
                <span className="px-3 py-2 bg-muted rounded-lg text-sm flex items-center">
                  {field.unit}
                </span>
              )}
              {field.unit_options && field.unit_type === 'select' && (
                <select
                  value={formData[`${field.key}_unit`] || field.unit_options[0]}
                  onChange={(e) => handleChange({ ...value, unit: e.target.value })}
                  className="px-3 py-2 bg-muted rounded-lg text-sm border border-border"
                >
                  {field.unit_options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'select':
      case 'multiselect':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {field.type === 'multiselect' ? (
              <div className="space-y-2">
                {field.options?.map((option) => (
                  <label key={option} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(value as string[])?.includes(option) || false}
                      onChange={(e) => {
                        const current = (value as string[]) || []
                        handleChange(
                          e.target.checked
                            ? [...current, option]
                            : current.filter((v) => v !== option)
                        )
                      }}
                      className="rounded border-border"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <select
                id={fieldKey}
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                required={field.required}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select...</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'file':
      case 'image':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
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
            />
            {field.accepted && (
              <p className="text-sm text-muted-foreground">
                Accepted formats: {field.accepted.join(', ')}
              </p>
            )}
            {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={fieldKey}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={fieldKey}
              type="date"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              required={field.required}
            />
            {field.help && <p className="text-sm text-muted-foreground">{field.help}</p>}
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
            title: 'Analyzing product',
            description: 'Using AI to determine the most suitable industry for your product...',
            showSpinner: true,
          }
        case 'checking_template':
          return {
            title: 'Looking for template',
            description: 'Searching for existing product template...',
            showSpinner: true,
          }
        case 'ready':
          return {
            title: loadingState.message,
            description: loadingState.industryName
              ? `Template ready for ${loadingState.industryName}`
              : 'Template ready!',
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

          <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 mb-6">
            <h1 className="text-2xl font-semibold mb-2">{productNameRaw}</h1>
            <p className="text-sm text-muted-foreground">
              Fill in the product details below
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onFormSubmit(); }} className="space-y-8">
            {template.sections.map((section: SectionSchema) => (
              <div
                key={section.section_id}
                className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8"
              >
                <h2 className="text-xl font-semibold mb-6">{section.title}</h2>
                <div className="space-y-6">
                  {section.fields.map((field) => renderField(field, section.section_id))}
                </div>
              </div>
            ))}

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

