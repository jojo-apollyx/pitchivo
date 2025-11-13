'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ReviewField {
  key: string
  label: string
  value: any
  confidence?: number
  section?: string
  group?: string // e.g., 'basic', 'physical', 'chemical'
}

interface ReviewFieldsModalProps {
  isOpen: boolean
  onClose: () => void
  fields: ReviewField[]
  filename: string
  documentType?: string
  isAlreadyReviewed?: boolean
  onApply: (reviewedFields: Record<string, any>) => Promise<void>
}

// Product-related document types (industry-standard documents for B2B food/supplement trading)
const PRODUCT_DOCUMENT_TYPES = [
  // Technical & Quality
  'COA',
  'TDS',
  'MSDS',
  'SDS',
  'Specification_Sheet',
  'COO',
  'Quality_Certificate',
  // Compliance & Regulatory
  'Allergen_Statement',
  'Irradiation_Statement',
  'GMO_Statement',
  'GMO_Free_Statement',
  'Non_GMO_Statement',
  'Prop65_Statement',
  'Prop_65_Statement',
  'California_Prop_65_Statement',
  'Vegan_Statement',
  'Nutritional_Info',
  'Organic_Certificate',
  'Halal_Certificate',
  'Kosher_Certificate',
  'GMP_Certificate',
  'ISO_Certificate',
  'FDA_Letter',
  'GRAS_Notice',
  // Product Information
  'Product_Specification',
  'Product_Label',
  'Product_Catalog',
  'Ingredient_List',
  // Business Documents
  'Quote',
  'Product_Offer',
  'Sample_Information',
  // Generic
  'Certificate'
]

export function ReviewFieldsModal({
  isOpen,
  onClose,
  fields,
  filename,
  documentType,
  isAlreadyReviewed = false,
  onApply,
}: ReviewFieldsModalProps) {
  const [editedFields, setEditedFields] = useState<Record<string, any>>({})
  const [isApplying, setIsApplying] = useState(false)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set())
  
  // Check if this is a non-product document (anything not in the product types list, including "Other")
  // Normalize document type for comparison (handle case, spaces, underscores)
  const normalizeDocumentType = (type?: string): string => {
    if (!type) return ''
    return type
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }
  
  const normalizedDocType = normalizeDocumentType(documentType)
  const isNonProductDocument = documentType && !PRODUCT_DOCUMENT_TYPES.some(
    productType => normalizeDocumentType(productType) === normalizedDocType
  )

  useEffect(() => {
    if (isOpen && fields.length > 0) {
      // Initialize edited fields with current values
      const initial: Record<string, any> = {}
      fields.forEach(field => {
        initial[field.key] = field.value
      })
      setEditedFields(initial)

      // Auto-select high confidence fields or all if already reviewed
      if (isAlreadyReviewed) {
        setSelectedFields(new Set(fields.map(f => f.key)))
      } else {
        setSelectedFields(new Set(
          fields
            .filter(f => (f.confidence || 0) >= 0.7)
            .map(f => f.key)
        ))
      }
    }
  }, [isOpen, fields, isAlreadyReviewed])

  const handleFieldChange = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }))
  }

  const toggleFieldSelection = (key: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    setSelectedFields(new Set(fields.map(f => f.key)))
  }

  const handleDeselectAll = () => {
    setSelectedFields(new Set())
  }

  const handleApply = async () => {
    if (selectedFields.size === 0) {
      toast.error('Please select at least one field to apply')
      return
    }

    setIsApplying(true)
    try {
      const fieldsToApply: Record<string, any> = {}
      selectedFields.forEach(key => {
        fieldsToApply[key] = editedFields[key]
      })
      
      await onApply(fieldsToApply)
      toast.success(`Applied ${selectedFields.size} fields to product`)
      onClose()
    } catch (error) {
      console.error('Error applying fields:', error)
      toast.error('Failed to apply fields')
    } finally {
      setIsApplying(false)
    }
  }

  const groupedFields = fields.reduce((acc, field) => {
    const section = field.section || 'other'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(field)
    return acc
  }, {} as Record<string, ReviewField[]>)

  const sectionTitles: Record<string, string> = {
    basic: 'Basic Information',
    physical: 'Physical Characteristics',
    chemical: 'Chemical Analysis',
    microbial: 'Microbiological',
    supplier: 'Supplier Information',
    commercial: 'Commercial & Logistics',
    packaging: 'Packaging',
    allergen: 'Allergen Information',
    compliance: 'Compliance & Safety',
    other: 'Other Information',
  }

  // Determine field width - some fields should be half width, others full width
  const getFieldWidth = (key: string): 'full' | 'half' | 'third' => {
    // Full width fields
    const fullWidthFields = ['product_name', 'description', 'appearance', 'manufacturer_name', 
      'allergen_statement', 'pesticide_residue', 'specification_standard', 'botanical_name',
      'carrier_material', 'storage_temperature', 'sample_availability', 'residual_solvents']
    
    // Third width fields (for numbers/short values)
    const thirdWidthFields = ['assay_min', 'moisture_max', 'ash_max', 'ph_value', 'bulk_density',
      'lead_max', 'arsenic_max', 'cadmium_max', 'mercury_max', 'aflatoxins_max',
      'total_plate_count_max', 'yeast_mold_max', 'shelf_life_months', 'particle_size_range',
      'mesh_size', 'packages_per_pallet', 'moq', 'extraction_ratio']
    
    if (fullWidthFields.some(f => key.includes(f))) return 'full'
    if (thirdWidthFields.some(f => key.includes(f))) return 'third'
    return 'half'
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500'
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-orange-600'
  }

  const getConfidenceBadge = (confidence?: number) => {
    if (!confidence) return null
    const percentage = Math.round(confidence * 100)
    return (
      <Badge
        variant="outline"
        className={cn(
          'text-xs px-1.5 py-0',
          confidence >= 0.9 && 'border-green-500/50 text-green-700',
          confidence >= 0.7 && confidence < 0.9 && 'border-yellow-500/50 text-yellow-700',
          confidence < 0.7 && 'border-orange-500/50 text-orange-700'
        )}
      >
        {percentage}%
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAlreadyReviewed ? 'Review Extracted Fields' : 'Review & Confirm Extracted Fields'}
              </DialogTitle>
              <div className="mt-1.5">
                <DialogDescription asChild>
                  <div className="flex items-center gap-2 text-sm">
                    <span>{filename}</span>
                    {documentType && (
                      <>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {documentType}
                        </Badge>
                      </>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </div>
          {isAlreadyReviewed && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                This document was previously reviewed. Values shown are the corrected ones.
              </span>
            </div>
          )}
          {isNonProductDocument && (
            <div className="flex items-start gap-2 mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 mb-1">
                  This document is not suitable for product creation
                </p>
                <p className="text-xs text-amber-700">
                  This appears to be a {documentType?.replace(/_/g, ' ').toLowerCase()} document, which cannot be used to populate product information. 
                  Please upload product-related documents such as COA, TDS, MSDS, or Specification Sheets.
                </p>
              </div>
            </div>
          )}
          {!isAlreadyReviewed && !isNonProductDocument && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Review AI-extracted fields. Edit any incorrect values before applying.
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Action buttons - only show for product documents */}
        {!isNonProductDocument && (
          <div className="flex items-center justify-between py-3 border-y">
            <div className="text-sm text-muted-foreground">
              {selectedFields.size} of {fields.length} fields selected
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>
          </div>
        )}

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isNonProductDocument ? (
            <div className="py-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Document Not Suitable for Products
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  This document has been analyzed, but it contains information that is not relevant for product creation. 
                  The extracted data is shown below for reference only.
                </p>
                {fields.length > 0 && (
                  <div className="mt-6 space-y-4 text-left">
                    <h4 className="text-sm font-medium text-foreground/70">Extracted Information:</h4>
                    <div className="space-y-2">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className="border rounded-lg p-3 bg-card"
                        >
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            {field.label}
                          </div>
                          <div className="text-sm text-foreground">
                            {(() => {
                              if (field.value === null || field.value === undefined) return 'N/A'
                              if (Array.isArray(field.value)) return field.value.join(', ')
                              if (typeof field.value === 'object') return JSON.stringify(field.value, null, 2)
                              return field.value.toString()
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {Object.entries(groupedFields).map(([section, sectionFields]) => (
                <div key={section}>
                  <h3 className="text-sm font-semibold text-foreground mb-3 pb-2 border-b border-border/50">
                    {sectionTitles[section] || section}
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {sectionFields.map((field) => {
                      const width = getFieldWidth(field.key)
                      const colSpan = width === 'full' ? 'col-span-6' : width === 'half' ? 'col-span-3' : 'col-span-2'
                      
                      return (
                        <div
                          key={field.key}
                          className={cn(
                            colSpan,
                            'border rounded-lg p-3 transition-all',
                            selectedFields.has(field.key)
                              ? 'border-primary/50 bg-primary/5'
                              : 'border-border/30 bg-card'
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFields.has(field.key)}
                              onChange={() => toggleFieldSelection(field.key)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <label className="text-xs font-medium text-foreground truncate">
                                  {field.label}
                                </label>
                                {!isAlreadyReviewed && getConfidenceBadge(field.confidence)}
                              </div>
                              {Array.isArray(editedFields[field.key]) || (typeof editedFields[field.key] === 'object' && editedFields[field.key] !== null) ? (
                                <textarea
                                  value={(() => {
                                    const val = editedFields[field.key]
                                    if (Array.isArray(val)) return val.join(', ')
                                    if (typeof val === 'object') return JSON.stringify(val, null, 2)
                                    return val?.toString() || ''
                                  })()}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    // Try to parse as array if comma-separated
                                    if (val.includes(',')) {
                                      handleFieldChange(field.key, val.split(',').map(s => s.trim()))
                                    } else {
                                      handleFieldChange(field.key, val)
                                    }
                                  }}
                                  className={cn(
                                    'w-full px-2 py-1.5 text-sm rounded-md border',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                                    'bg-background resize-none',
                                    !selectedFields.has(field.key) && 'opacity-60'
                                  )}
                                  rows={3}
                                  disabled={!selectedFields.has(field.key)}
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={editedFields[field.key]?.toString() || ''}
                                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                  className={cn(
                                    'w-full px-2 py-1.5 text-sm rounded-md border',
                                    'focus:outline-none focus:ring-2 focus:ring-primary/20',
                                    'bg-background',
                                    !selectedFields.has(field.key) && 'opacity-60'
                                  )}
                                  disabled={!selectedFields.has(field.key)}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isApplying}
          >
            {isNonProductDocument ? 'Close' : 'Cancel'}
          </Button>
          {!isNonProductDocument && (
            <Button
              type="button"
              onClick={handleApply}
              disabled={isApplying || selectedFields.size === 0}
              className="min-w-32"
            >
              {isApplying ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply to Product
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

