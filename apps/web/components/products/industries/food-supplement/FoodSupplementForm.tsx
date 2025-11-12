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
  showTechnicalData?: boolean
}

export function FoodSupplementForm({
  formData,
  onChange,
  errors = {},
  showTechnicalData = false,
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Manufacturer Name */}
            <div>
              <Label htmlFor="manufacturerName">Manufacturer Name</Label>
              <Input
                id="manufacturerName"
                value={formData.manufacturerName}
                onChange={(e) => onChange({ manufacturerName: e.target.value })}
                placeholder="e.g., ABC Pharma Co."
              />
            </div>

            {/* CAS Number */}
            <div>
              <Label htmlFor="casNumber">CAS Number</Label>
              <Input
                id="casNumber"
                value={formData.casNumber}
                onChange={(e) => onChange({ casNumber: e.target.value })}
                placeholder="e.g., 50-81-7"
              />
            </div>

            {/* FDA Number */}
            <div>
              <Label htmlFor="fdaNumber">FDA Number</Label>
              <Input
                id="fdaNumber"
                value={formData.fdaNumber}
                onChange={(e) => onChange({ fdaNumber: e.target.value })}
                placeholder="e.g., 21CFR182.8013"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <SearchableSelect
              value={formData.category}
              onValueChange={(value) => onChange({ category: value })}
              options={FOOD_SUPPLEMENT_CATEGORIES}
              placeholder="Select category"
              searchPlaceholder="Search categories..."
            />
          </div>

          {/* Form & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="form">Physical Form</Label>
              <Select value={formData.form} onValueChange={(value) => onChange({ form: value })}>
                <SelectTrigger className="h-11 rounded-xl">
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
            </div>
            <div>
              <Label htmlFor="grade">Grade</Label>
              <Select value={formData.grade} onValueChange={(value) => onChange({ grade: value })}>
                <SelectTrigger className="h-11 rounded-xl">
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
            </div>
          </div>

          {/* Applications with Search */}
          <SearchableMultiSelect
            label="Applications"
            options={FOOD_SUPPLEMENT_APPLICATIONS}
            selected={formData.applications}
            onChange={(selected) => onChange({ applications: selected })}
            placeholder="Search applications..."
          />

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Brief product description..."
              rows={4}
            />
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
            <Label htmlFor="packagingType">Packaging Type</Label>
            <SearchableSelect
              value={formData.packagingType}
              onValueChange={(value) => onChange({ packagingType: value })}
              options={FOOD_SUPPLEMENT_PACKAGING}
              placeholder="Select packaging"
              searchPlaceholder="Search packaging types..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Net Weight */}
            <div>
              <Label htmlFor="netWeight">Net Weight per Package</Label>
              <Input
                id="netWeight"
                value={formData.netWeight}
                onChange={(e) => onChange({ netWeight: e.target.value })}
                placeholder="e.g., 25kg per drum"
              />
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <SearchableSelect
              value={formData.paymentTerms}
              onValueChange={(value) => onChange({ paymentTerms: value })}
              options={FOOD_SUPPLEMENT_PAYMENT_TERMS}
              placeholder="Select payment terms"
              searchPlaceholder="Search payment terms..."
            />
          </div>

          {/* Incoterm */}
          <div>
            <Label htmlFor="incoterm">Incoterm</Label>
            <Select value={formData.incoterm} onValueChange={(value) => onChange({ incoterm: value })}>
              <SelectTrigger className="h-11 rounded-xl">
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
          </div>
        </div>
      </section>

      {/* Section 4: Samples */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Samples</h2>
        <div className="space-y-4">
          {/* Provide Sample */}
          <div>
            <Label htmlFor="provideSample">Provide Sample</Label>
            <Select value={formData.provideSample} onValueChange={(value) => onChange({ provideSample: value })}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.provideSample === 'yes' && (
            <>
              {/* Sample Type */}
              <div>
                <Label htmlFor="sampleType">Sample Type</Label>
                <Select value={formData.sampleType} onValueChange={(value) => onChange({ sampleType: value })}>
                  <SelectTrigger className="h-11 rounded-xl">
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
              </div>

              {formData.sampleType.includes('Paid') && (
                <div>
                  <Label htmlFor="samplePrice">Sample Price (USD/kg)</Label>
                  <Input
                    id="samplePrice"
                    type="number"
                    step="0.01"
                    value={formData.samplePrice || ''}
                    onChange={(e) => onChange({ samplePrice: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 5.00"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sampleQuantity">Sample Quantity (kg)</Label>
                  <Input
                    id="sampleQuantity"
                    type="number"
                    step="0.01"
                    value={formData.sampleQuantity || ''}
                    onChange={(e) => onChange({ sampleQuantity: parseFloat(e.target.value) || null })}
                    placeholder="e.g., 0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="sampleLeadTime">Sample Lead Time</Label>
                  <Input
                    id="sampleLeadTime"
                    value={formData.sampleLeadTime}
                    onChange={(e) => onChange({ sampleLeadTime: e.target.value })}
                    placeholder="e.g., 3-5 business days"
                  />
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
                <div>
                  <Label className="text-xs">Country</Label>
                  <CountrySelect
                    value={location.country}
                    onValueChange={(value) => updateWarehouseLocation(location.id, { country: value })}
                    countries={FOOD_SUPPLEMENT_COUNTRIES}
                    placeholder="Select"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    value={location.city}
                    onChange={(e) => updateWarehouseLocation(location.id, { city: e.target.value })}
                    placeholder="City"
                    className="h-11 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Quantity (kg)</Label>
                  <Input
                    type="number"
                    value={location.quantity}
                    onChange={(e) =>
                      updateWarehouseLocation(location.id, { quantity: parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="h-11 mt-1"
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

      {/* Section 7: Technical Data (Conditional) */}
      {showTechnicalData && (
        <section className="pb-8">
          <h2 className="text-lg font-semibold mb-4">Technical Data & Specifications</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Complete technical specifications (can be auto-filled from uploaded documents)
          </p>
          <div className="space-y-6">
            {/* Basic Technical Info */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Basic Specifications</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* EINECS */}
                <div>
                  <Label htmlFor="einecs">EINECS Number</Label>
                  <Input
                    id="einecs"
                    value={formData.einecs}
                    onChange={(e) => onChange({ einecs: e.target.value })}
                    placeholder="e.g., 200-066-2"
                  />
                </div>

                {/* Shelf Life */}
                <div>
                  <Label htmlFor="shelfLife">Shelf Life (months)</Label>
                  <Input
                    id="shelfLife"
                    type="number"
                    value={formData.shelfLife || ''}
                    onChange={(e) => onChange({ shelfLife: parseInt(e.target.value) || null })}
                    placeholder="e.g., 24"
                  />
                </div>
              </div>
            </div>

            {/* Physical Characteristics */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Physical Characteristics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appearance">Appearance</Label>
                  <Input
                    id="appearance"
                    value={formData.appearance}
                    onChange={(e) => onChange({ appearance: e.target.value })}
                    placeholder="e.g., White to off-white powder"
                  />
                </div>
                <div>
                  <Label htmlFor="odor">Odor</Label>
                  <Input
                    id="odor"
                    value={formData.odor}
                    onChange={(e) => onChange({ odor: e.target.value })}
                    placeholder="e.g., Mild"
                  />
                </div>
                <div>
                  <Label htmlFor="taste">Taste</Label>
                  <Input
                    id="taste"
                    value={formData.taste}
                    onChange={(e) => onChange({ taste: e.target.value })}
                    placeholder="e.g., Slightly acidic"
                  />
                </div>
                <div>
                  <Label htmlFor="solubility">Solubility</Label>
                  <Input
                    id="solubility"
                    value={formData.solubility}
                    onChange={(e) => onChange({ solubility: e.target.value })}
                    placeholder="e.g., Soluble in water"
                  />
                </div>
              </div>
            </div>

            {/* Storage Conditions */}
            <div>
              <SearchableMultiSelect
                label="Storage Conditions"
                options={FOOD_SUPPLEMENT_STORAGE}
                selected={formData.storageConditions}
                onChange={(selected) => onChange({ storageConditions: selected })}
                placeholder="Search storage conditions..."
              />
            </div>

            {/* Chemical Analysis */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Chemical Analysis</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assay */}
              <div>
                <Label htmlFor="assay">Assay / Purity (%)</Label>
                <Input
                  id="assay"
                  type="number"
                  step="0.01"
                  value={formData.assay || ''}
                  onChange={(e) => onChange({ assay: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 99.5"
                />
              </div>
              {/* Moisture */}
              <div>
                <Label htmlFor="moisture">Moisture (%)</Label>
                <Input
                  id="moisture"
                  type="number"
                  step="0.01"
                  value={formData.moisture || ''}
                  onChange={(e) => onChange({ moisture: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              {/* Ash Content */}
              <div>
                <Label htmlFor="ashContent">Ash Content (%)</Label>
                <Input
                  id="ashContent"
                  type="number"
                  step="0.01"
                  value={formData.ashContent || ''}
                  onChange={(e) => onChange({ ashContent: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.2"
                />
              </div>
              {/* Loss on Drying */}
              <div>
                <Label htmlFor="lossOnDrying">Loss on Drying (%)</Label>
                <Input
                  id="lossOnDrying"
                  type="number"
                  step="0.01"
                  value={formData.lossOnDrying || ''}
                  onChange={(e) => onChange({ lossOnDrying: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              {/* pH */}
              <div>
                <Label htmlFor="ph">pH</Label>
                <Input
                  id="ph"
                  value={formData.ph}
                  onChange={(e) => onChange({ ph: e.target.value })}
                  placeholder="e.g., 5.0-7.0"
                />
              </div>
              {/* Bulk Density */}
              <div>
                <Label htmlFor="bulkDensity">Bulk Density (g/ml)</Label>
                <Input
                  id="bulkDensity"
                  type="number"
                  step="0.01"
                  value={formData.bulkDensity || ''}
                  onChange={(e) => onChange({ bulkDensity: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              {/* Particle Size */}
              <div>
                <Label htmlFor="particleSize">Particle Size</Label>
                <Input
                  id="particleSize"
                  value={formData.particleSize}
                  onChange={(e) => onChange({ particleSize: e.target.value })}
                  placeholder="e.g., 80 mesh"
                />
              </div>
            </div>
            </div>

            {/* Heavy Metals */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Heavy Metals (ppm)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="lead" className="text-xs">Lead (Pb)</Label>
                  <Input
                    id="lead"
                    type="number"
                    step="0.01"
                    value={formData.lead || ''}
                    onChange={(e) => onChange({ lead: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="arsenic" className="text-xs">Arsenic (As)</Label>
                  <Input
                    id="arsenic"
                    type="number"
                    step="0.01"
                    value={formData.arsenic || ''}
                    onChange={(e) => onChange({ arsenic: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="cadmium" className="text-xs">Cadmium (Cd)</Label>
                  <Input
                    id="cadmium"
                    type="number"
                    step="0.01"
                    value={formData.cadmium || ''}
                    onChange={(e) => onChange({ cadmium: parseFloat(e.target.value) || null })}
                    placeholder="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="mercury" className="text-xs">Mercury (Hg)</Label>
                  <Input
                    id="mercury"
                    type="number"
                    step="0.01"
                    value={formData.mercury || ''}
                    onChange={(e) => onChange({ mercury: parseFloat(e.target.value) || null })}
                    placeholder="0.1"
                  />
                </div>
              </div>
            </div>

            {/* Microbiological */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Microbiological</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPlateCount">Total Plate Count (cfu/g)</Label>
                  <Input
                    id="totalPlateCount"
                    type="number"
                    value={formData.totalPlateCount || ''}
                    onChange={(e) => onChange({ totalPlateCount: parseInt(e.target.value) || null })}
                    placeholder="e.g., 1000"
                  />
                </div>
                <div>
                  <Label htmlFor="yeastMold">Yeast & Mold (cfu/g)</Label>
                  <Input
                    id="yeastMold"
                    type="number"
                    value={formData.yeastMold || ''}
                    onChange={(e) => onChange({ yeastMold: parseInt(e.target.value) || null })}
                    placeholder="e.g., 100"
                  />
                </div>
                <div>
                  <Label htmlFor="eColiPresence">E. Coli</Label>
                  <Select value={formData.eColiPresence} onValueChange={(value) => onChange({ eColiPresence: value })}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="salmonellaPresence">Salmonella</Label>
                  <Select value={formData.salmonellaPresence} onValueChange={(value) => onChange({ salmonellaPresence: value })}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="staphylococcusPresence">Staphylococcus</Label>
                  <Select value={formData.staphylococcusPresence} onValueChange={(value) => onChange({ staphylococcusPresence: value })}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Negative">Negative</SelectItem>
                      <SelectItem value="Positive">Positive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pesticide Residue */}
            <div>
              <Label htmlFor="pesticideResidue">Pesticide Residue Status</Label>
              <Input
                id="pesticideResidue"
                value={formData.pesticideResidue}
                onChange={(e) => onChange({ pesticideResidue: e.target.value })}
                placeholder="e.g., Complies with EU/USP/JP standards"
              />
            </div>

            {/* Compliance & Safety */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Compliance & Safety</h3>
              <div className="space-y-4">
                {/* Certificate Expiry */}
                <div>
                  <Label htmlFor="certificateExpiryDate">Certificate Expiry Date</Label>
                  <DatePicker
                    value={formData.certificateExpiryDate}
                    onChange={(value) => onChange({ certificateExpiryDate: value })}
                    placeholder="Select expiry date"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gmoStatus">GMO Status</Label>
                    <Select value={formData.gmoStatus} onValueChange={(value) => onChange({ gmoStatus: value })}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-GMO">Non-GMO</SelectItem>
                        <SelectItem value="GMO">GMO</SelectItem>
                        <SelectItem value="Unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="irradiationStatus">Irradiation Status</Label>
                    <Select value={formData.irradiationStatus} onValueChange={(value) => onChange({ irradiationStatus: value })}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Non-Irradiated">Non-Irradiated</SelectItem>
                        <SelectItem value="Irradiated">Irradiated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="allergenInfo">Allergen Information</Label>
                    <Input
                      id="allergenInfo"
                      value={formData.allergenInfo}
                      onChange={(e) => onChange({ allergenInfo: e.target.value })}
                      placeholder="e.g., None"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bseStatement">BSE/TSE Statement</Label>
                    <Input
                      id="bseStatement"
                      value={formData.bseStatement}
                      onChange={(e) => onChange({ bseStatement: e.target.value })}
                      placeholder="e.g., BSE/TSE Free"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

