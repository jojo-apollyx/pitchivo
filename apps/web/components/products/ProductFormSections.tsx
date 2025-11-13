'use client'

import { useState } from 'react'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  COUNTRIES,
  CERTIFICATES,
  PACKAGING_TYPES,
  PAYMENT_TERMS,
  INCOTERMS,
  PRODUCT_CATEGORIES,
  APPLICATIONS,
  SAMPLE_TYPES,
} from '@/lib/constants/product-options'

export interface InventoryLocation {
  id: string
  country: string
  city: string
  quantity: number
}

export interface ProductFormData {
  // Basic Information
  productImages: File[]
  productName: string
  originCountry: string
  manufacturerName: string
  casNumber: string
  fdaNumber: string
  description: string
  category: string
  applications: string[]

  // Pricing & Commerce
  unitPrice: number | null
  moq: number | null
  leadTime: number | null
  packagingType: string
  paymentTerms: string
  shelfLife: number | null
  incoterm: string

  // Samples
  provideSample: string
  sampleType: string
  samplePrice: number | null
  sampleQuantity: number | null
  sampleLeadTime: string

  // Certificates
  certificates: string[]
  certificateFiles: File[]
  certificateExpiryDate: string

  // Inventory
  inventoryLocation: InventoryLocation[]

  // Documents
  coaFile: File | null
  tdsFile: File | null
  msdsFile: File | null
  specSheet: File | null
  otherFiles: File[]

  // Technical Data (visible only if populated)
  assay: number | null
  moisture: number | null
  lead: number | null
  arsenic: number | null
  cadmium: number | null
  mercury: number | null
  totalPlateCount: number | null
  salmonella: string
  color: string
  odor: string
}

interface ProductFormSectionsProps {
  formData: ProductFormData
  onChange: (updates: Partial<ProductFormData>) => void
  errors?: Record<string, string>
  showTechnicalData?: boolean
}

export function ProductFormSections({
  formData,
  onChange,
  errors = {},
  showTechnicalData = false,
}: ProductFormSectionsProps) {
  const [imagePreview, setImagePreview] = useState<string[]>([])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    onChange({ productImages: [...formData.productImages, ...files] })
    
    // Create previews
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

  const toggleCertificate = (cert: string) => {
    const current = formData.certificates
    const updated = current.includes(cert)
      ? current.filter((c) => c !== cert)
      : [...current, cert]
    onChange({ certificates: updated })
  }

  const toggleApplication = (app: string) => {
    const current = formData.applications
    const updated = current.includes(app)
      ? current.filter((a) => a !== app)
      : [...current, app]
    onChange({ applications: updated })
  }

  const addWarehouseLocation = () => {
    onChange({
      inventoryLocation: [
        ...(formData.inventoryLocation || []),
        { id: Date.now().toString(), country: '', city: '', quantity: 0 },
      ],
    })
  }

  const updateWarehouseLocation = (id: string, updates: Partial<InventoryLocation>) => {
    onChange({
      inventoryLocation: (formData.inventoryLocation || []).map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc
      ),
    })
  }

  const removeWarehouseLocation = (id: string) => {
    onChange({
      inventoryLocation: (formData.inventoryLocation || []).filter((loc) => loc.id !== id),
    })
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Basic Information */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          {/* Product Images */}
          <div>
            <Label htmlFor="productImages">Product Images</Label>
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
              placeholder="e.g., Ascorbic Acid"
              className={cn(errors.productName && 'border-destructive')}
            />
            {errors.productName && (
              <p className="text-xs text-destructive mt-1">{errors.productName}</p>
            )}
          </div>

          {/* Origin Country */}
          <div>
            <Label htmlFor="originCountry">Origin Country *</Label>
            <select
              id="originCountry"
              value={formData.originCountry}
              onChange={(e) => onChange({ originCountry: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

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

          {/* Category */}
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => onChange({ category: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select category</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Applications */}
          <div>
            <Label>Applications</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {APPLICATIONS.map((app) => (
                <Badge
                  key={app}
                  variant={formData.applications.includes(app) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleApplication(app)}
                >
                  {app}
                </Badge>
              ))}
            </div>
          </div>

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

      {/* Section 2: Pricing & Commerce */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Pricing & Commerce</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unit Price */}
            <div>
              <Label htmlFor="unitPrice">Unit Price (USD/kg)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice || ''}
                onChange={(e) => onChange({ unitPrice: parseFloat(e.target.value) || null })}
                placeholder="e.g., 15.50"
              />
            </div>

            {/* MOQ */}
            <div>
              <Label htmlFor="moq">MOQ (kg)</Label>
              <Input
                id="moq"
                type="number"
                value={formData.moq || ''}
                onChange={(e) => onChange({ moq: parseInt(e.target.value) || null })}
                placeholder="e.g., 500"
              />
            </div>

            {/* Lead Time */}
            <div>
              <Label htmlFor="leadTime">Lead Time (days)</Label>
              <Input
                id="leadTime"
                type="number"
                value={formData.leadTime || ''}
                onChange={(e) => onChange({ leadTime: parseInt(e.target.value) || null })}
                placeholder="e.g., 10"
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

          {/* Packaging Type */}
          <div>
            <Label htmlFor="packagingType">Packaging Type</Label>
            <select
              id="packagingType"
              value={formData.packagingType}
              onChange={(e) => onChange({ packagingType: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select packaging</option>
              {PACKAGING_TYPES.map((pkg) => (
                <option key={pkg} value={pkg}>
                  {pkg}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Terms */}
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <select
              id="paymentTerms"
              value={formData.paymentTerms}
              onChange={(e) => onChange({ paymentTerms: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select payment terms</option>
              {PAYMENT_TERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>

          {/* Incoterm */}
          <div>
            <Label htmlFor="incoterm">Incoterm</Label>
            <select
              id="incoterm"
              value={formData.incoterm}
              onChange={(e) => onChange({ incoterm: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select incoterm</option>
              {INCOTERMS.map((term) => (
                <option key={term} value={term}>
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Section 3: Samples */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Samples</h2>
        <div className="space-y-4">
          {/* Provide Sample */}
          <div>
            <Label htmlFor="provideSample">Provide Sample</Label>
            <select
              id="provideSample"
              value={formData.provideSample}
              onChange={(e) => onChange({ provideSample: e.target.value })}
              className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          {formData.provideSample === 'yes' && (
            <>
              {/* Sample Type */}
              <div>
                <Label htmlFor="sampleType">Sample Type</Label>
                <select
                  id="sampleType"
                  value={formData.sampleType}
                  onChange={(e) => onChange({ sampleType: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="">Select type</option>
                  {SAMPLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {formData.sampleType === 'Paid' && (
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

      {/* Section 4: Certificates */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Certificates</h2>
        <div className="space-y-4">
          <div>
            <Label>Select Certificates</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {CERTIFICATES.map((cert) => (
                <Badge
                  key={cert}
                  variant={formData.certificates.includes(cert) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleCertificate(cert)}
                >
                  {cert}
                </Badge>
              ))}
            </div>
          </div>

          {/* Certificate Expiry */}
          <div>
            <Label htmlFor="certificateExpiryDate">Certificate Expiry Date</Label>
            <Input
              id="certificateExpiryDate"
              type="date"
              value={formData.certificateExpiryDate}
              onChange={(e) => onChange({ certificateExpiryDate: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Section 5: Inventory */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Warehouse Inventory</h2>
        <div className="space-y-3">
          {(formData.inventoryLocation || []).map((location) => (
            <div key={location.id} className="flex gap-3 items-end">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Country</Label>
                  <select
                    value={location.country}
                    onChange={(e) => updateWarehouseLocation(location.id, { country: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm"
                  >
                    <option value="">Select</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input
                    value={location.city}
                    onChange={(e) => updateWarehouseLocation(location.id, { city: e.target.value })}
                    placeholder="City"
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

      {/* Section 6: Documents */}
      <section className="pb-8 border-b border-border/30">
        <h2 className="text-lg font-semibold mb-4">Documents</h2>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upload technical documents (these can also be auto-filled from uploaded files)
          </p>
          
          {/* Placeholder for document uploads - simplified for now */}
          <div className="grid grid-cols-1 gap-3">
            <div className="p-4 border border-border/30 rounded-lg text-sm text-muted-foreground text-center">
              Documents will be managed via the file upload panel
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: Technical Data (Conditional) */}
      {showTechnicalData && (
        <section className="pb-8">
          <h2 className="text-lg font-semibold mb-4">Technical Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            These fields were detected from your uploaded documents
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div>
                <Label htmlFor="lead">Lead (ppm)</Label>
                <Input
                  id="lead"
                  type="number"
                  step="0.01"
                  value={formData.lead || ''}
                  onChange={(e) => onChange({ lead: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              <div>
                <Label htmlFor="arsenic">Arsenic (ppm)</Label>
                <Input
                  id="arsenic"
                  type="number"
                  step="0.01"
                  value={formData.arsenic || ''}
                  onChange={(e) => onChange({ arsenic: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              <div>
                <Label htmlFor="cadmium">Cadmium (ppm)</Label>
                <Input
                  id="cadmium"
                  type="number"
                  step="0.01"
                  value={formData.cadmium || ''}
                  onChange={(e) => onChange({ cadmium: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.5"
                />
              </div>
              <div>
                <Label htmlFor="mercury">Mercury (ppm)</Label>
                <Input
                  id="mercury"
                  type="number"
                  step="0.01"
                  value={formData.mercury || ''}
                  onChange={(e) => onChange({ mercury: parseFloat(e.target.value) || null })}
                  placeholder="e.g., 0.1"
                />
              </div>
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
                <Label htmlFor="salmonella">Salmonella</Label>
                <Input
                  id="salmonella"
                  value={formData.salmonella}
                  onChange={(e) => onChange({ salmonella: e.target.value })}
                  placeholder="e.g., Absent"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => onChange({ color: e.target.value })}
                  placeholder="e.g., Light Yellow Powder"
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
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

