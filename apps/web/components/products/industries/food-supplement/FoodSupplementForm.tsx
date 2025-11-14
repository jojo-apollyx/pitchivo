'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Upload, X, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { SearchableMultiSelect } from '@/components/ui/searchable-multi-select'
import { SearchableSelect } from '@/components/ui/searchable-select'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TieredPricingSection } from './TieredPricingSection'
import { TechnicalFieldsSection } from './TechnicalFieldsSection'
import { AddFieldsModal } from './AddFieldsModal'
import type { FoodSupplementProductData, InventoryLocation, PriceTier } from './types'
import {
  FOOD_SUPPLEMENT_COUNTRIES,
  FOOD_SUPPLEMENT_CERTIFICATES,
  FOOD_SUPPLEMENT_PACKAGING,
  FOOD_SUPPLEMENT_PAYMENT_TERMS,
  FOOD_SUPPLEMENT_INCOTERMS,
  FOOD_SUPPLEMENT_CATEGORIES,
  FOOD_SUPPLEMENT_APPLICATIONS,
  FOOD_SUPPLEMENT_SAMPLE_TYPES,
  FOOD_SUPPLEMENT_FORMS,
  FOOD_SUPPLEMENT_GRADES,
  FOOD_SUPPLEMENT_STORAGE,
} from '@/lib/constants/industries/food-supplement/options'

interface FoodSupplementFormProps {
  formData: FoodSupplementProductData
  onChange: (updates: Partial<FoodSupplementProductData>) => void
  errors?: Record<string, string>
  visibleTechnicalFields?: Set<string>
  onAddFields?: (fields: string[]) => void
}

export function FoodSupplementForm({
  formData,
  onChange,
  errors = {},
  visibleTechnicalFields = new Set(),
  onAddFields = () => {},
}: FoodSupplementFormProps) {
  // Initialize imagePreview from formData.product_images (which may be base64 strings or File objects)
  const [imagePreview, setImagePreview] = useState<string[]>(() => {
    if (formData.product_images && formData.product_images.length > 0) {
      return formData.product_images.map((img: any) => {
        if (img instanceof File) {
          // File object - will be converted to preview when component mounts
          return ''
        } else if (typeof img === 'string') {
          // Already a base64 string or URL
          return img
        }
        return ''
      }).filter(Boolean)
    }
    return []
  })
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  // Restore image previews when formData.product_images changes (e.g., when loading from saved product)
  useEffect(() => {
    const productImages = formData.product_images || []
    if (productImages.length > 0) {
      setImagePreview((prev) => {
        const newPreviews: string[] = []
        
        // First, add existing previews that still match current images
        productImages.forEach((img: any, index: number) => {
          if (img instanceof File) {
            // Convert File to preview
            const reader = new FileReader()
            reader.onloadend = () => {
              setImagePreview((current) => {
                const updated = [...current]
                if (index < updated.length) {
                  updated[index] = reader.result as string
                } else {
                  updated.push(reader.result as string)
                }
                return updated
              })
            }
            reader.readAsDataURL(img)
            // Use existing preview at this index if available
            if (prev[index]) {
              newPreviews.push(prev[index])
            }
          } else if (typeof img === 'string') {
            // Base64 string or URL - use directly
            newPreviews.push(img)
          }
        })
        
        // If we have new previews, use them; otherwise keep existing
        return newPreviews.length > 0 ? newPreviews : prev
      })
    } else if (productImages.length === 0) {
      // Clear previews if images array is empty
      setImagePreview([])
    }
  }, [formData.product_images])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Upload files to storage
    const uploadPromises = files.map(async (file) => {
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(errorData.error || 'Failed to upload image')
        }

        const result = await response.json()
        return result.image.url // Return the storage URL
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        return null
      }
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    const validUrls = uploadedUrls.filter((url): url is string => url !== null)

    if (validUrls.length > 0) {
      // Add URLs to product images
      onChange({ product_images: [...(formData.product_images || []), ...validUrls] } as any)
      
      // Add previews
      validUrls.forEach((url) => {
        setImagePreview((prev) => [...prev, url])
      })

      toast.success(`${validUrls.length} image(s) uploaded successfully`)
    }
  }

  const removeImage = (index: number) => {
    const newImages = (formData.product_images || []).filter((_: any, i: number) => i !== index)
    const newPreviews = imagePreview.filter((_, i) => i !== index)
    onChange({ product_images: newImages } as any)
    // Update previews to match the new images array
    setImagePreview(newPreviews)
  }

  // Check if we have enough data to generate an image
  const canGenerateImage = () => {
    if (!formData.product_name || formData.product_name.trim().length < 3) {
      return { canGenerate: false, reason: 'Product name is required (minimum 3 characters)' }
    }

    const hasEnoughData = formData.description || formData.category || formData.form || formData.appearance
    if (!hasEnoughData) {
      return { 
        canGenerate: false, 
        reason: 'Please add at least one of: description, category, form, or appearance' 
      }
    }

    return { canGenerate: true, reason: '' }
  }

  const imageGenerationCheck = canGenerateImage()

  const handleGenerateImage = async () => {
    // Double-check validation
    if (!imageGenerationCheck.canGenerate) {
      toast.error(imageGenerationCheck.reason)
      return
    }

    setIsGeneratingImage(true)
    toast.info('Generating product image with AI...', { icon: '🎨' })

    try {
      const response = await fetch('/api/products/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productData: {
            product_name: formData.product_name,
            description: formData.description,
            category: formData.category,
            form: formData.form,
            grade: formData.grade,
            appearance: formData.appearance,
            applications: formData.applications,
          },
          industryCode: 'food_supplement'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const result = await response.json()

      if (result.success && result.image) {
        // Image is already uploaded to storage, use the URL directly
        const imageUrl = result.image.url || result.image.b64_json
        
        if (!imageUrl) {
          throw new Error('No image data received')
        }

        // If it's base64 (fallback), we need to upload it
        if (result.image.b64_json && !result.image.url) {
          // Convert base64 to File and upload
          const base64 = result.image.b64_json
          const byteString = atob(base64.replace(/^data:image\/\w+;base64,/, ''))
          const bytes = new Uint8Array(byteString.length)
          for (let i = 0; i < byteString.length; i++) {
            bytes[i] = byteString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: 'image/png' })
          const imageFile = new File([blob], result.image.filename || 'ai-generated.png', { type: 'image/png' })
          
          // Upload to storage
          const formData = new FormData()
          formData.append('file', imageFile)
          
          const uploadResponse = await fetch('/api/products/upload-image', {
            method: 'POST',
            body: formData,
          })
          
          if (!uploadResponse.ok) {
            throw new Error('Failed to upload generated image')
          }
          
          const uploadResult = await uploadResponse.json()
          const finalUrl = uploadResult.image.url
          
          // Add URL to product images
          onChange({ product_images: [...((formData as any).product_images || []), finalUrl] } as Partial<FoodSupplementProductData>)
          setImagePreview((prev) => [...prev, finalUrl])
        } else {
          // Already has URL from storage
          onChange({ product_images: [...((formData as any).product_images || []), imageUrl] } as Partial<FoodSupplementProductData>)
          setImagePreview((prev) => [...prev, imageUrl])
        }

        toast.success('Product image generated successfully!', { icon: '✨' })
      } else {
        throw new Error('Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const toggleItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item]
  }

  // Get inventory locations from formData (use camelCase: inventoryLocation)
  // Map from snake_case (inventory_locations) for backward compatibility
  const inventoryLocation = (formData as any).inventoryLocation || formData.inventory_locations || []
  
  // Ensure all locations have an id for React keys
  const locationsWithId = inventoryLocation.map((loc: any, index: number) => ({
    ...loc,
    id: loc.id || `loc-${index}`,
    quantity: loc.quantity ?? 0,
  }))

  const addWarehouseLocation = () => {
    const newLocation = { id: Date.now().toString(), country: '', city: '', quantity: 0 }
    onChange({
      inventoryLocation: [...locationsWithId, newLocation],
    } as any)
  }

  const updateWarehouseLocation = (id: string, updates: Partial<InventoryLocation>) => {
    onChange({
      inventoryLocation: locationsWithId.map((loc: any) =>
        loc.id === id ? { ...loc, ...updates } : loc
      ),
    } as any)
  }

  const removeWarehouseLocation = (id: string) => {
    onChange({
      inventoryLocation: locationsWithId.filter((loc: any) => loc.id !== id),
    } as any)
  }

  return (
    <div className="space-y-8"> {/* Removed pr-4 to fix border visibility */}
      {/* Section 1: Basic Information */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          {/* Product Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Product Images *</Label>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={isGeneratingImage || !imageGenerationCheck.canGenerate}
                        className="h-8 gap-2"
                      >
                        {isGeneratingImage ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5" />
                            AI Generate
                          </>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    {imageGenerationCheck.canGenerate ? (
                      <p className="text-sm">
                        ✨ Generate a professional product image using AI based on your product details
                      </p>
                    ) : (
                      <div className="text-sm space-y-1">
                        <p className="font-medium text-yellow-400">⚠️ Cannot generate image yet</p>
                        <p className="text-muted-foreground">{imageGenerationCheck.reason}</p>
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mt-2">
              {imagePreview.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {imagePreview.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Product ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label htmlFor="productImages">
                <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload product images
                  </p>
                </div>
              </label>
              <input
                id="productImages"
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {errors.productImages && (
              <p className="text-xs text-destructive mt-1">{errors.productImages}</p>
            )}
          </div>

          {/* Product Name */}
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={formData.product_name || ''}
              onChange={(e) => onChange({ product_name: e.target.value })}
              placeholder="e.g., Ascorbic Acid 99%"
              className={cn(errors.productName && 'border-destructive')}
            />
            {errors.productName && (
              <p className="text-xs text-destructive mt-1">{errors.productName}</p>
            )}
          </div>

          {/* Origin Country with Country Select */}
          <div>
            <Label htmlFor="originCountry">Origin Country *</Label>
            <CountrySelect
              value={formData.origin_country || ''}
              onValueChange={(value) => onChange({ origin_country: value })}
              countries={FOOD_SUPPLEMENT_COUNTRIES}
              placeholder="Select origin country..."
              className="mt-1"
            />
            {errors.originCountry && (
              <p className="text-xs text-destructive mt-1">{errors.originCountry}</p>
            )}
          </div>

          {/* Manufacturer Name - Full Width */}
          <div>
            <Label htmlFor="manufacturerName">Manufacturer Name *</Label>
            <Input
              id="manufacturerName"
              value={formData.manufacturer_name || ''}
              onChange={(e) => onChange({ manufacturer_name: e.target.value })}
              placeholder="e.g., ABC Pharma Co."
              className={cn(errors.manufacturerName && 'border-destructive')}
            />
            {errors.manufacturerName && (
              <p className="text-xs text-destructive mt-1">{errors.manufacturerName}</p>
            )}
          </div>

          {/* CAS and FDA Numbers - Share Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* CAS Number */}
            <div className="flex flex-col">
              <Label htmlFor="casNumber" className="mb-1 whitespace-nowrap">CAS Number *</Label>
              <Input
                id="casNumber"
                value={formData.cas_number || ''}
                onChange={(e) => onChange({ cas_number: e.target.value })}
                placeholder="e.g., 50-81-7"
                className={cn(errors.casNumber && 'border-destructive')}
              />
              {errors.casNumber && (
                <p className="text-xs text-destructive mt-1">{errors.casNumber}</p>
              )}
            </div>

            {/* FDA Number */}
            <div className="flex flex-col">
              <Label htmlFor="fdaNumber" className="mb-1 whitespace-nowrap">FDA Number *</Label>
              <Input
                id="fdaNumber"
                value={formData.fda_number || ''}
                onChange={(e) => onChange({ fda_number: e.target.value })}
                placeholder="e.g., 21CFR182.8013"
                className={cn(errors.fdaNumber && 'border-destructive')}
              />
              {errors.fdaNumber && (
                <p className="text-xs text-destructive mt-1">{errors.fdaNumber}</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category *</Label>
            <SearchableSelect
              value={formData.category || ''}
              onValueChange={(value) => onChange({ category: value })}
              options={FOOD_SUPPLEMENT_CATEGORIES}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
            />
            {errors.category && (
              <p className="text-xs text-destructive mt-1">{errors.category}</p>
            )}
          </div>

          {/* Form & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label htmlFor="form" className="mb-1 whitespace-nowrap">Physical Form *</Label>
              <Select value={formData.form} onValueChange={(value) => onChange({ form: value })}>
                <SelectTrigger className={cn("h-11 rounded-xl", errors.form && 'border-destructive')}>
                  <SelectValue placeholder="Select form" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_SUPPLEMENT_FORMS.map((form) => (
                    <SelectItem key={form} value={form}>
                      {form}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.form && (
                <p className="text-xs text-destructive mt-1">{errors.form}</p>
              )}
            </div>
            <div className="flex flex-col">
              <Label htmlFor="grade" className="mb-1 whitespace-nowrap">Grade *</Label>
              <Select value={formData.grade} onValueChange={(value) => onChange({ grade: value })}>
                <SelectTrigger className={cn("h-11 rounded-xl", errors.grade && 'border-destructive')}>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_SUPPLEMENT_GRADES.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-xs text-destructive mt-1">{errors.grade}</p>
              )}
            </div>
          </div>

          {/* Applications with Search */}
          <div>
            <SearchableMultiSelect
              label="Applications *"
              options={FOOD_SUPPLEMENT_APPLICATIONS}
              selected={formData.applications || []}
              onChange={(selected) => onChange({ applications: selected })}
              placeholder="Search applications..."
            />
            {errors.applications && (
              <p className="text-xs text-destructive mt-1">{errors.applications}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief product description..."
              rows={4}
              className={cn(errors.description && 'border-destructive')}
            />
            {errors.description && (
              <p className="text-xs text-destructive mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Tiered Pricing */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Pricing & Lead Time</h2>
        <TieredPricingSection
          priceTiers={(formData as any).priceTiers || formData.price_lead_time || []}
          onChange={(tiers) => onChange({ price_lead_time: tiers })}
          errors={errors}
        />
      </section>

      {/* Section 3: Packaging & Logistics */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Packaging & Logistics</h2>
        <div className="space-y-4">
          {/* Packaging Type */}
          <div>
            <Label htmlFor="packagingType">Packaging Type *</Label>
            <SearchableSelect
              value={formData.packaging_type || ''}
              onValueChange={(value) => onChange({ packaging_type: value })}
              options={FOOD_SUPPLEMENT_PACKAGING}
              placeholder="Select packaging"
              searchPlaceholder="Search packaging types..."
            />
            {errors.packagingType && (
              <p className="text-xs text-destructive mt-1">{errors.packagingType}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Net Weight */}
            <div className="flex flex-col">
              <Label htmlFor="netWeight" className="mb-1 whitespace-nowrap">Net Weight per Package</Label>
              <Input
                id="netWeight"
                value={formData.net_weight || ''}
                onChange={(e) => onChange({ net_weight: e.target.value })}
                placeholder="e.g., 25kg per drum"
                className={cn(errors.netWeight && 'border-destructive')}
              />
              {errors.netWeight && (
                <p className="text-xs text-destructive mt-1">{errors.netWeight}</p>
              )}
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <SearchableSelect
              value={formData.payment_terms || ''}
              onValueChange={(value) => onChange({ payment_terms: value })}
              options={FOOD_SUPPLEMENT_PAYMENT_TERMS}
              placeholder="Select payment terms"
              searchPlaceholder="Search payment terms..."
            />
            {errors.paymentTerms && (
              <p className="text-xs text-destructive mt-1">{errors.paymentTerms}</p>
            )}
          </div>

          {/* Incoterm */}
          <div>
            <Label htmlFor="incoterm">Incoterm</Label>
            <Select value={formData.incoterm} onValueChange={(value) => onChange({ incoterm: value })}>
              <SelectTrigger className={cn("h-11 rounded-xl", errors.incoterm && 'border-destructive')}>
                <SelectValue placeholder="Select incoterm" />
              </SelectTrigger>
              <SelectContent>
                {FOOD_SUPPLEMENT_INCOTERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.incoterm && (
              <p className="text-xs text-destructive mt-1">{errors.incoterm}</p>
            )}
          </div>
        </div>
      </section>

      {/* Section 4: Samples */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Samples</h2>
        <div className="space-y-4">
          {/* Provide Sample */}
          <div>
            <Label htmlFor="provideSample">Provide Sample *</Label>
            <Select value={formData.provide_sample || ''} onValueChange={(value) => onChange({ provide_sample: value })}>
              <SelectTrigger className={cn("h-11 rounded-xl", errors.provideSample && 'border-destructive')}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
            {errors.provideSample && (
              <p className="text-xs text-destructive mt-1">{errors.provideSample}</p>
            )}
          </div>

          {formData.provide_sample === 'yes' && (
            <>
              {/* Sample Type */}
              <div>
                <Label htmlFor="sampleType">Sample Type *</Label>
                <Select value={formData.sample_type || ''} onValueChange={(value) => onChange({ sample_type: value })}>
                  <SelectTrigger className={cn("h-11 rounded-xl", errors.sampleType && 'border-destructive')}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FOOD_SUPPLEMENT_SAMPLE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sampleType && (
                  <p className="text-xs text-destructive mt-1">{errors.sampleType}</p>
                )}
              </div>

              {formData.sample_type?.includes('Paid') && (
                <div>
                  <Label htmlFor="samplePrice">Sample Price (USD/kg) *</Label>
                  <Input
                    id="samplePrice"
                    type="number"
                    step="0.01"
                    value={formData.sample_price || ''}
                    onChange={(e) => onChange({ sample_price: parseFloat(e.target.value) || null } as any)}
                    placeholder="e.g., 5.00"
                    className={cn(errors.samplePrice && 'border-destructive')}
                  />
                  {errors.samplePrice && (
                    <p className="text-xs text-destructive mt-1">{errors.samplePrice}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="sampleQuantity" className="mb-1 whitespace-nowrap">Sample Quantity (kg) *</Label>
                  <Input
                    id="sampleQuantity"
                    type="number"
                    step="0.01"
                    value={formData.sample_quantity || ''}
                    onChange={(e) => onChange({ sample_quantity: parseFloat(e.target.value) || null } as any)}
                    placeholder="e.g., 0.5"
                    className={cn(errors.sampleQuantity && 'border-destructive')}
                  />
                  {errors.sampleQuantity && (
                    <p className="text-xs text-destructive mt-1">{errors.sampleQuantity}</p>
                  )}
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="sampleLeadTime" className="mb-1 whitespace-nowrap">Sample Lead Time *</Label>
                  <Input
                    id="sampleLeadTime"
                    value={formData.sample_lead_time || ''}
                    onChange={(e) => onChange({ sample_lead_time: e.target.value })}
                    placeholder="e.g., 3-5 business days"
                    className={cn(errors.sampleLeadTime && 'border-destructive')}
                  />
                  {errors.sampleLeadTime && (
                    <p className="text-xs text-destructive mt-1">{errors.sampleLeadTime}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section 5: Certificates */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Certificates</h2>
        <div className="space-y-4">
          {/* Certificates with Search */}
          <SearchableMultiSelect
            label="Select Certificates"
            options={FOOD_SUPPLEMENT_CERTIFICATES}
              selected={formData.certificates || []}
              onChange={(selected) => onChange({ certificates: selected })}
            placeholder="Search certificates..."
            maxHeight="max-h-96"
          />
        </div>
      </section>

      {/* Section 6: Inventory */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Warehouse Inventory *</h2>
        {errors.inventoryLocation && (
          <p className="text-xs text-destructive mb-2">{errors.inventoryLocation}</p>
        )}
        <div className="space-y-3">
          {locationsWithId.map((location: any) => (
            <div key={location.id} className="flex gap-3 items-end">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div className="flex flex-col">
                  <Label className="text-xs mb-1 whitespace-nowrap">Country</Label>
                  <CountrySelect
                    value={location.country}
                    onValueChange={(value) => updateWarehouseLocation(location.id, { country: value })}
                    countries={FOOD_SUPPLEMENT_COUNTRIES}
                    placeholder="Select"
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-xs mb-1 whitespace-nowrap">City</Label>
                  <Input
                    value={location.city}
                    onChange={(e) => updateWarehouseLocation(location.id, { city: e.target.value })}
                    placeholder="City"
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col">
                  <Label className="text-xs mb-1 whitespace-nowrap">Quantity (kg)</Label>
                  <Input
                    type="number"
                    value={location.quantity ?? 0}
                    onChange={(e) =>
                      updateWarehouseLocation(location.id, { quantity: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="h-11"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeWarehouseLocation(location.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addWarehouseLocation} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Warehouse Location
          </Button>
        </div>
      </section>

      {/* Section 7: Technical Data (Conditional - Only visible fields) */}
      <TechnicalFieldsSection
        formData={formData}
        onChange={onChange}
        visibleFields={visibleTechnicalFields}
      />

      {/* Add More Fields Button */}
      <section className="pb-4">
        <AddFieldsModal
          visibleFields={visibleTechnicalFields}
          onFieldsAdd={onAddFields}
        />
      </section>
    </div>
  )
}

