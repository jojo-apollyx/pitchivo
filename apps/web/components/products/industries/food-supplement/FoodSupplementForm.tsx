'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CountrySelect } from '@/components/ui/country-select'
import { DatePicker } from '@/components/ui/date-picker'
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
import type { FoodSupplementProductData, WarehouseLocation, PriceTier } from './types'
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
  const [imagePreview, setImagePreview] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange({ productImages: [...formData.productImages, ...files] })
    
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    const newImages = formData.productImages.filter((_, i) => i !== index)
    const newPreviews = imagePreview.filter((_, i) => i !== index)
    onChange({ productImages: newImages })
    setImagePreview(newPreviews)
  }

  const toggleItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item]
  }

  const addWarehouseLocation = () => {
    onChange({
      warehouseLocations: [
        ...formData.warehouseLocations,
        { id: Date.now().toString(), country: '', city: '', quantity: 0 },
      ],
    })
  }

  const updateWarehouseLocation = (id: string, updates: Partial<WarehouseLocation>) => {
    onChange({
      warehouseLocations: formData.warehouseLocations.map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc
      ),
    })
  }

  const removeWarehouseLocation = (id: string) => {
    onChange({
      warehouseLocations: formData.warehouseLocations.filter((loc) => loc.id !== id),
    })
  }

  return (
    <div className="space-y-8"> {/* Removed pr-4 to fix border visibility */}
      {/* Section 1: Basic Information */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          {/* Product Images */}
          <div>
            <Label>Product Images</Label>
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
          </div>

          {/* Product Name */}
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => onChange({ productName: e.target.value })}
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
              value={formData.originCountry}
              onValueChange={(value) => onChange({ originCountry: value })}
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
              value={formData.manufacturerName}
              onChange={(e) => onChange({ manufacturerName: e.target.value })}
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
                value={formData.casNumber}
                onChange={(e) => onChange({ casNumber: e.target.value })}
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
                value={formData.fdaNumber}
                onChange={(e) => onChange({ fdaNumber: e.target.value })}
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
              value={formData.category}
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
              selected={formData.applications}
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
              value={formData.description}
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
          priceTiers={formData.priceTiers}
          onChange={(tiers) => onChange({ priceTiers: tiers })}
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
              value={formData.packagingType}
              onValueChange={(value) => onChange({ packagingType: value })}
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
              <Label htmlFor="netWeight" className="mb-1 whitespace-nowrap">Net Weight per Package *</Label>
              <Input
                id="netWeight"
                value={formData.netWeight}
                onChange={(e) => onChange({ netWeight: e.target.value })}
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
            <Label htmlFor="paymentTerms">Payment Terms *</Label>
            <SearchableSelect
              value={formData.paymentTerms}
              onValueChange={(value) => onChange({ paymentTerms: value })}
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
            <Label htmlFor="incoterm">Incoterm *</Label>
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
            <Select value={formData.provideSample} onValueChange={(value) => onChange({ provideSample: value })}>
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

          {formData.provideSample === 'yes' && (
            <>
              {/* Sample Type */}
              <div>
                <Label htmlFor="sampleType">Sample Type *</Label>
                <Select value={formData.sampleType} onValueChange={(value) => onChange({ sampleType: value })}>
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

              {formData.sampleType.includes('Paid') && (
                <div>
                  <Label htmlFor="samplePrice">Sample Price (USD/kg) *</Label>
                  <Input
                    id="samplePrice"
                    type="number"
                    step="0.01"
                    value={formData.samplePrice || ''}
                    onChange={(e) => onChange({ samplePrice: parseFloat(e.target.value) || null })}
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
                    value={formData.sampleQuantity || ''}
                    onChange={(e) => onChange({ sampleQuantity: parseFloat(e.target.value) || null })}
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
                    value={formData.sampleLeadTime}
                    onChange={(e) => onChange({ sampleLeadTime: e.target.value })}
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
            selected={formData.certificates}
            onChange={(selected) => onChange({ certificates: selected })}
            placeholder="Search certificates..."
            maxHeight="max-h-96"
          />
        </div>
      </section>

      {/* Section 6: Inventory */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Warehouse Inventory</h2>
        <div className="space-y-3">
          {formData.warehouseLocations.map((location) => (
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
                    value={location.quantity}
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

