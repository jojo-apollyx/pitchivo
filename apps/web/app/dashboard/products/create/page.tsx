'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FoodSupplementForm, type FoodSupplementFormData } from '@/components/products/industry-forms/FoodSupplementForm'
import { getIndustryName } from '@/lib/constants/industries'

const productNameSchema = z.object({
  product_name_raw: z.string().min(1, 'Product name is required').max(200),
})

type ProductNameFormData = z.infer<typeof productNameSchema>

export default function CreateProductPage() {
  const router = useRouter()
  const [step, setStep] = useState<'name' | 'detecting' | 'form' | 'creating'>('name')
  const [productNameRaw, setProductNameRaw] = useState('')
  const [detectedIndustry, setDetectedIndustry] = useState<{
    code: string
    name: string
  } | null>(null)

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

  // Handle product name submission - detect industry
  const onProductNameSubmit = async (data: ProductNameFormData) => {
    setProductNameRaw(data.product_name_raw)
    setStep('detecting')

    try {
      // Call API to detect industry
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name_raw: data.product_name_raw,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to detect industry')
      }

      const result = await response.json()
      
      setDetectedIndustry({
        code: result.industry_code,
        name: result.industry_name,
      })
      
      setStep('form')
    } catch (error) {
      console.error('Error detecting industry:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to detect industry'
      toast.error(errorMessage)
      setStep('name')
    }
  }

  // Handle product creation from industry-specific form
  const onProductFormSubmit = async (formData: FoodSupplementFormData) => {
    if (!detectedIndustry) {
      toast.error('Industry not detected')
      return
    }

    setStep('creating')

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: formData.product_name,
          industry_code: detectedIndustry.code,
          status: 'draft',
          // Include all the form data as product metadata
          product_data: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create product')
      }

      toast.success('Product created successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error creating product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
      toast.error(errorMessage)
      setStep('form')
    }
  }

  const handleCancel = () => {
    if (step === 'form') {
      setStep('name')
      setDetectedIndustry(null)
      setProductNameRaw('')
    } else {
      router.push('/dashboard/products')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={step === 'detecting' || step === 'creating'}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Create Product</h1>
              <p className="text-sm text-foreground/60">
                {step === 'name' && 'Enter your product name to get started'}
                {step === 'detecting' && 'Analyzing product...'}
                {step === 'form' && `Fill in details for ${detectedIndustry?.name || 'your product'}`}
                {step === 'creating' && 'Creating product...'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Step 1: Product Name Input */}
          {step === 'name' && (
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
              <div className="flex items-start gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    What product are you creating?
                  </h2>
                  <p className="text-sm text-foreground/60">
                    We'll use AI to determine the best form for your product
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onProductNameSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="product_name_raw" className="text-base">
                    Product Name *
                  </Label>
                  <Input
                    id="product_name_raw"
                    placeholder="e.g., Vitamin C Powder, Ascorbic Acid"
                    {...register('product_name_raw')}
                    className="text-base"
                    autoFocus
                  />
                  {errors.product_name_raw && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.product_name_raw.message}
                    </p>
                  )}
                  <p className="text-sm text-foreground/60">
                    Enter the name or type of product you want to create
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/products')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Continue
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Detecting Industry (Loading) */}
          {step === 'detecting' && (
            <div className="bg-card rounded-xl border border-border p-12 shadow-sm">
              <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Analyzing your product
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Determining the best form for "{productNameRaw}"...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Industry-Specific Form */}
          {step === 'form' && detectedIndustry && (
            <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  <Sparkles className="h-4 w-4" />
                  {detectedIndustry.name}
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Product Details
                </h2>
                <p className="text-sm text-foreground/60 mt-1">
                  Fill in the information about your product
                </p>
              </div>

              {/* Render industry-specific form based on detected industry */}
              {detectedIndustry.code === 'food_supplement' && (
                <FoodSupplementForm
                  productNameRaw={productNameRaw}
                  onSubmit={onProductFormSubmit}
                  onCancel={handleCancel}
                  isSubmitting={false}
                />
              )}

              {/* Future industries can be added here */}
              {detectedIndustry.code !== 'food_supplement' && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-foreground/40 mx-auto mb-3" />
                  <p className="text-foreground/60">
                    Form for {detectedIndustry.name} is coming soon
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="mt-4"
                  >
                    Go Back
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Creating Product (Loading) */}
          {step === 'creating' && (
            <div className="bg-card rounded-xl border border-border p-12 shadow-sm">
              <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Creating your product
                  </h3>
                  <p className="text-sm text-foreground/60">
                    Please wait...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
