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
    origin: 'Origin & Source',
    physical: 'Physical Properties',
    chemical: 'Chemical Specifications',
    microbial: 'Microbiological Data',
    nutrition: 'Nutritional Values',
    allergen: 'Allergen Information',
    health_usage: 'Health Benefits & Usage',
    formulation: 'Formulation & Technical',
    quality: 'Quality Standards & Testing',
    compliance: 'Compliance & Certifications',
    packaging: 'Packaging Information',
    supplier: 'Supplier & Traceability',
    sustainability: 'Sustainability & Ethical Sourcing',
    commercial: 'Commercial & Logistics',
    technical: 'Technical Data',
    safety: 'Safety & Compliance',
    other: 'Other Information',
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
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAlreadyReviewed ? 'Review Extracted Fields' : 'Review & Confirm Extracted Fields'}
              </DialogTitle>
              <DialogDescription className="mt-1.5">
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
          {isAlreadyReviewed && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-700">
                This document was previously reviewed. Values shown are the corrected ones.
              </span>
            </div>
          )}
          {!isAlreadyReviewed && (
            <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                Review AI-extracted fields. Edit any incorrect values before applying.
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Action buttons */}
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

        {/* Fields list */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {Object.entries(groupedFields).map(([section, sectionFields]) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-foreground/70 mb-3">
                  {sectionTitles[section] || section}
                </h3>
                <div className="space-y-3">
                  {sectionFields.map((field) => (
                    <div
                      key={field.key}
                      className={cn(
                        'border rounded-lg p-3 transition-all',
                        selectedFields.has(field.key)
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border/30 bg-card'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedFields.has(field.key)}
                          onChange={() => toggleFieldSelection(field.key)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <label className="text-sm font-medium text-foreground">
                              {field.label}
                            </label>
                            {!isAlreadyReviewed && getConfidenceBadge(field.confidence)}
                          </div>
                          <input
                            type="text"
                            value={editedFields[field.key]?.toString() || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className={cn(
                              'w-full px-3 py-2 text-sm rounded-md border',
                              'focus:outline-none focus:ring-2 focus:ring-primary/20',
                              'bg-background',
                              !selectedFields.has(field.key) && 'opacity-60'
                            )}
                            disabled={!selectedFields.has(field.key)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

