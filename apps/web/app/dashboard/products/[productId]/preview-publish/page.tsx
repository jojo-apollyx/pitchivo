'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Eye, Globe, Mail, FileText, Plus, QrCode, Download, Package, MapPin, File, FileCheck, FileX, FileImage, FileSpreadsheet, FileCode, FileJson, Image as ImageIcon, Package2, Box, ExternalLink, Copy, Edit, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { useProduct } from '@/lib/api/products'
import { cn } from '@/lib/utils'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { PRODUCT_FIELDS } from '@/lib/industries/food-supplement/extraction-schema'
import QRCode from 'react-qr-code'
import { SharingLinksPanel } from '@/components/products/SharingLinksPanel'
import { PreviewModeSelector } from '@/components/products/PreviewModeSelector'
import { ACCESS_LEVEL_CONFIG, getAccessLevelLabel } from '@/lib/constants/access-levels'

// Permission levels with inclusion relationship: Public ⊂ After Click ⊂ After RFQ
type AccessLevel = 'public' | 'after_click' | 'after_rfq'

// Field permission configuration
type FieldPermission = {
  [fieldName: string]: AccessLevel
}

// Channel link configuration
type ChannelLink = {
  id: string
  name: string
  parameter: string
  enabled: boolean
}

// Default channel links
const DEFAULT_CHANNELS: ChannelLink[] = [
  { id: 'email', name: 'Email Default', parameter: 'ch=email', enabled: true },
  { id: 'qr', name: 'QR Booth', parameter: 'ch=expo', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', parameter: 'ch=linkedin', enabled: true },
]

/**
 * Permission Widget Component
 * Single control widget to set minimum access level for a field
 */
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
          'touch-manipulation',
          value === 'public'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={ACCESS_LEVEL_CONFIG.public.description}
      >
        <span className="flex-shrink-0">👀</span>
        <span className="hidden sm:inline">Browse</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_click')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          'touch-manipulation',
          value === 'after_click'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={ACCESS_LEVEL_CONFIG.after_click.description}
      >
        <span className="flex-shrink-0">🔗</span>
        <span className="hidden sm:inline">Link</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_rfq')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          'touch-manipulation',
          value === 'after_rfq'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={ACCESS_LEVEL_CONFIG.after_rfq.description}
      >
        <span className="flex-shrink-0">✅</span>
        <span className="hidden sm:inline">Full</span>
      </button>
    </div>
  )
}

/**
 * Note: Using new PreviewModeSelector from @/components/products/PreviewModeSelector
 * Old version removed - new one has better labels (Browse/Link/Full instead of Public/After Click/After RFQ)
 */

/**
 * Get file icon based on mime type or filename
 */
function getFileIcon(mimeType?: string, filename?: string) {
  if (!mimeType && !filename) return File
  
  const type = mimeType?.toLowerCase() || ''
  const ext = filename?.split('.').pop()?.toLowerCase() || ''
  
  if (type.includes('pdf') || ext === 'pdf') return FileText
  if (type.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return FileImage
  if (type.includes('spreadsheet') || type.includes('excel') || ['xlsx', 'xls'].includes(ext)) return FileSpreadsheet
  if (type.includes('word') || ['docx', 'doc'].includes(ext)) return FileText
  if (type.includes('json') || ext === 'json') return FileJson
  if (type.includes('code') || ['js', 'ts', 'py', 'java'].includes(ext)) return FileCode
  
  return File
}

/**
 * Format file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get document type from extracted values or file summary
 */
function getDocumentType(extraction: any): string | null {
  if (!extraction) return null
  
  try {
    const extracted = typeof extraction.extracted_values === 'string' 
      ? JSON.parse(extraction.extracted_values) 
      : extraction.extracted_values
    const summary = typeof extraction.file_summary === 'string'
      ? JSON.parse(extraction.file_summary)
      : extraction.file_summary
      
    return extracted?.document_type || summary?.document_type || null
  } catch {
    return null
  }
}

/**
 * Get page count from metadata
 */
function getPageCount(extraction: any): number | null {
  if (!extraction) return null
  
  try {
    const extracted = typeof extraction.extracted_values === 'string'
      ? JSON.parse(extraction.extracted_values)
      : extraction.extracted_values
    const metadata = extracted?._metadata || extracted?.metadata
    return metadata?.pageCount || metadata?.pages || null
  } catch {
    return null
  }
}

/**
 * Helper to get access level hint message
 */
function getAccessLevelHint(requiredLevel: AccessLevel): string {
  switch (requiredLevel) {
    case 'after_click':
      return 'Click the link in your email or channel to view this field'
    case 'after_rfq':
      return 'Submit a Request for Quote (RFQ) to view this field'
    default:
      return 'This field is publicly visible'
  }
}

/**
 * Helper to get access level badge name
 */
function getAccessLevelName(level: AccessLevel): string {
  switch (level) {
    case 'public':
      return 'Public'
    case 'after_click':
      return 'After Click'
    case 'after_rfq':
      return 'After RFQ'
  }
}

/**
 * Restricted Field Display Component
 * Shows field value with blur/hide effect and hint when restricted
 */
function RestrictedFieldDisplay({
  value,
  isAccessible,
  requiredLevel,
  children,
}: {
  value: any
  isAccessible: boolean
  requiredLevel: AccessLevel
  children: React.ReactNode
}) {
  if (isAccessible) {
    return <>{children}</>
  }

  const hint = getAccessLevelHint(requiredLevel)
  const levelName = getAccessLevelName(requiredLevel)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group">
            <div className="blur-sm select-none pointer-events-none">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md border border-dashed border-muted-foreground/30">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-medium">{levelName} Access Required</span>
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{levelName} Access Required</p>
            <p className="text-xs">{hint}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Real Page Preview Component
 * Shows product like a public-facing page
 */
function RealPagePreview({
  formData,
  permissions,
  viewMode,
  documentMetadata = {},
}: {
  formData: FoodSupplementProductData
  permissions: FieldPermission
  viewMode: 'public' | 'after_click' | 'after_rfq'
  documentMetadata?: Record<string, any>
}) {
  // Check if field is accessible in current view mode
  const isFieldAccessible = (fieldName: string): boolean => {
    const permission = permissions[fieldName] || 'public'
    // Special case: uploaded_files should be visible in all modes (but only downloadable in after_rfq)
    if (fieldName === 'uploaded_files') {
      return true // Always visible, download is controlled separately
    }
    if (viewMode === 'public') return permission === 'public'
    if (viewMode === 'after_click') return permission === 'public' || permission === 'after_click'
    if (viewMode === 'after_rfq') return true
    return false
  }

  // Get required access level for a field
  const getRequiredAccessLevel = (fieldName: string): AccessLevel => {
    return permissions[fieldName] || 'public'
  }

  // Get field label from PRODUCT_FIELDS
  const getFieldLabel = (fieldName: string): string => {
    return PRODUCT_FIELDS[fieldName as keyof typeof PRODUCT_FIELDS]?.label || 
           fieldName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  // Check if a field should be excluded from dynamic rendering
  const isExcludedField = (fieldName: string): boolean => {
    const excludedFields = [
      'field_permissions',
      'channel_links',
      'uploaded_files', // Handled separately in files section
      'product_images', // Handled separately
      'product_name', // Handled in header
      'category', // Handled in header
      'description', // Handled separately
      'applications', // Handled separately (array)
      'certificates', // Handled separately (array)
      'allergen_info', // Handled separately (array)
      'storage_conditions', // Handled separately (array)
      'price_lead_time', // Handled separately (complex formatting)
      'samples', // Handled separately (complex formatting)
      'inventory_locations', // Handled separately (complex formatting)
      'coa_file', // Handled in files section
      'tds_file', // Handled in files section
      'msds_file', // Handled in files section
      'spec_sheet', // Handled in files section
      'certificate_files', // Handled in files section
      'other_files', // Handled in files section
      // Individual sample fields (handled via samples array)
      'provide_sample',
      'sample_type',
      'sample_price',
      'sample_quantity',
      'sample_lead_time',
      'sample_availability',
    ]
    return excludedFields.includes(fieldName)
  }

  // Get all fields with values for dynamic rendering
  const getFieldsWithValues = (): Array<{ key: string; label: string; value: any }> => {
    const fields: Array<{ key: string; label: string; value: any }> = []
    
    Object.keys(formData).forEach((key) => {
      if (isExcludedField(key)) return
      
      const value = formData[key as keyof typeof formData]
      const hasValue = value !== null && value !== undefined && value !== '' && 
        (!Array.isArray(value) || value.length > 0) &&
        (typeof value !== 'object' || Object.keys(value).length > 0)
      
      if (hasValue) {
        fields.push({
          key,
          label: getFieldLabel(key),
          value,
        })
      }
    })
    
    return fields
  }

  // Legacy function for backward compatibility
  const shouldShow = (fieldName: string): boolean => {
    return isFieldAccessible(fieldName)
  }

  const formatValue = (value: any, fieldName: string): string => {
    if (!value || (Array.isArray(value) && value.length === 0)) return ''
    
    if (fieldName === 'price_lead_time' && Array.isArray(value)) {
      return value.map((tier: any) => {
        const parts = []
        if (tier.moq) parts.push(`MOQ: ${tier.moq}`)
        if (tier.price) parts.push(`Price: ${tier.price}`)
        if (tier.lead_time) parts.push(`Lead Time: ${tier.lead_time}`)
        return parts.join(', ')
      }).join(' | ')
    }
    
    if (fieldName === 'samples' && Array.isArray(value)) {
      return value.map((sample: any) => {
        const parts = []
        if (sample.sample_type) parts.push(`Type: ${sample.sample_type}`)
        if (sample.price) parts.push(`Price: ${sample.price}`)
        if (sample.quantity) parts.push(`Qty: ${sample.quantity}`)
        return parts.join(', ')
      }).join(' | ')
    }
    
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
      }
    }
    
    return String(value)
  }

  return (
    <TooltipProvider>
      <div className="bg-background">
        {/* Product Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-8 border-b border-border/30">
          {formData.product_name && (
            <RestrictedFieldDisplay
              value={formData.product_name}
              isAccessible={isFieldAccessible('product_name')}
              requiredLevel={getRequiredAccessLevel('product_name')}
            >
              <h1 className="text-3xl font-bold mb-2">{formData.product_name}</h1>
            </RestrictedFieldDisplay>
          )}
          {formData.category && (
            <RestrictedFieldDisplay
              value={formData.category}
              isAccessible={isFieldAccessible('category')}
              requiredLevel={getRequiredAccessLevel('category')}
            >
              <p className="text-muted-foreground">{formData.category}</p>
            </RestrictedFieldDisplay>
          )}
        </div>

      {/* Product Images */}
      {formData.product_images && Array.isArray(formData.product_images) && formData.product_images.length > 0 && (
        <RestrictedFieldDisplay
          value={formData.product_images}
          isAccessible={isFieldAccessible('product_images')}
          requiredLevel={getRequiredAccessLevel('product_images')}
        >
          <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {formData.product_images.map((img: any, index: number) => {
                let imgSrc: string
                if (typeof img === 'string') {
                  imgSrc = img
                } else if (img instanceof File) {
                  imgSrc = URL.createObjectURL(img as Blob)
                } else {
                  return null
                }
                if (!imgSrc) return null
                return (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/30">
                    <img
                      src={imgSrc}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </RestrictedFieldDisplay>
      )}

      {/* Product Details */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {formData.description && (
          <RestrictedFieldDisplay
            value={formData.description}
            isAccessible={isFieldAccessible('description')}
            requiredLevel={getRequiredAccessLevel('description')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Description</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Additional Product Information - Dynamically rendered from all fields */}
        {(() => {
          const fields = getFieldsWithValues()
          
          if (fields.length === 0) return null
          
          return (
            <div>
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => {
                  const fieldAccessible = isFieldAccessible(field.key)
                  const requiredLevel = getRequiredAccessLevel(field.key)
                  
                  return (
                    <RestrictedFieldDisplay
                      key={field.key}
                      value={field.value}
                      isAccessible={fieldAccessible}
                      requiredLevel={requiredLevel}
                    >
                      <div>
                        <p className="text-sm text-muted-foreground">{field.label}</p>
                        <p className="font-medium">{String(field.value)}</p>
                      </div>
                    </RestrictedFieldDisplay>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Applications */}
        {formData.applications && Array.isArray(formData.applications) && formData.applications.length > 0 && (
          <RestrictedFieldDisplay
            value={formData.applications}
            isAccessible={isFieldAccessible('applications')}
            requiredLevel={getRequiredAccessLevel('applications')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Applications</h2>
              <div className="flex flex-wrap gap-2">
                {formData.applications.map((app, idx) => (
                  <Badge key={idx} variant="secondary">{app}</Badge>
                ))}
              </div>
            </div>
          </RestrictedFieldDisplay>
        )}


        {/* Storage Conditions - Array field with special formatting */}
        {formData.storage_conditions && Array.isArray(formData.storage_conditions) && formData.storage_conditions.length > 0 && (
          <RestrictedFieldDisplay
            value={formData.storage_conditions}
            isAccessible={isFieldAccessible('storage_conditions')}
            requiredLevel={getRequiredAccessLevel('storage_conditions')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Storage Conditions</h2>
              <p className="text-muted-foreground">{formData.storage_conditions.join(', ')}</p>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Certificates - Array field with badges */}
        {formData.certificates && Array.isArray(formData.certificates) && formData.certificates.length > 0 && (
          <RestrictedFieldDisplay
            value={formData.certificates}
            isAccessible={isFieldAccessible('certificates')}
            requiredLevel={getRequiredAccessLevel('certificates')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Certificates</h2>
              <div className="flex flex-wrap gap-2">
                {formData.certificates.map((cert, idx) => (
                  <Badge key={idx} variant="secondary">{cert}</Badge>
                ))}
              </div>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Allergen Information - Array field with badges */}
        {formData.allergen_info && Array.isArray(formData.allergen_info) && formData.allergen_info.length > 0 && (
          <RestrictedFieldDisplay
            value={formData.allergen_info}
            isAccessible={isFieldAccessible('allergen_info')}
            requiredLevel={getRequiredAccessLevel('allergen_info')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Allergen Information</h2>
              <div className="flex flex-wrap gap-2">
                {formData.allergen_info.map((allergen, idx) => (
                  <Badge key={idx} variant="outline">Free from: {allergen}</Badge>
                ))}
              </div>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Inventory Locations */}
        {formData.inventory_locations && Array.isArray(formData.inventory_locations) && formData.inventory_locations.length > 0 && (
          <RestrictedFieldDisplay
            value={formData.inventory_locations}
            isAccessible={isFieldAccessible('inventory_locations')}
            requiredLevel={getRequiredAccessLevel('inventory_locations')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-4">Inventory Locations</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.inventory_locations.map((loc: any, idx: number) => (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-5 hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">
                          {loc.city && loc.country ? `${loc.city}, ${loc.country}` : loc.country || loc.city || 'Location'}
                        </h3>
                        {loc.quantity && (
                          <div className="flex items-center gap-2 mt-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Quantity: <span className="font-medium text-foreground">{loc.quantity}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Pricing */}
        {formData.price_lead_time && (
          <RestrictedFieldDisplay
            value={formData.price_lead_time}
            isAccessible={isFieldAccessible('price_lead_time')}
            requiredLevel={getRequiredAccessLevel('price_lead_time')}
          >
            <div>
              <h2 className="text-xl font-semibold mb-2">Pricing & Lead Time</h2>
              <p className="text-muted-foreground">{formatValue(formData.price_lead_time, 'price_lead_time')}</p>
            </div>
          </RestrictedFieldDisplay>
        )}

        {/* Samples */}
        {(() => {
          const hasSamplesArray = formData.samples && Array.isArray(formData.samples) && formData.samples.length > 0
          const formDataAny = formData as any
          const hasIndividualSamples = formDataAny.provide_sample && 
            (formDataAny.provide_sample.toLowerCase() === 'yes' || formDataAny.provide_sample.toLowerCase() === 'true')
          
          if (!hasSamplesArray && !hasIndividualSamples) return null
          
          const samples: any[] = hasSamplesArray ? (formData.samples || []) : (hasIndividualSamples ? [{
            sample_type: formDataAny.sample_type,
            price: formDataAny.sample_price,
            quantity: formDataAny.sample_quantity,
            lead_time: formDataAny.sample_lead_time,
            availability: formDataAny.sample_availability,
          }] : [])
          
          if (samples.length === 0) return null
          
          const samplesAccessible = isFieldAccessible('samples')
          const samplesRequiredLevel = getRequiredAccessLevel('samples')
          
          return (
            <RestrictedFieldDisplay
              value={samples}
              isAccessible={samplesAccessible}
              requiredLevel={samplesRequiredLevel}
            >
              <div>
                <h2 className="text-xl font-semibold mb-4">Samples</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {samples.map((sample: any, idx: number) => (
                  <div key={idx} className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-5 hover:border-primary/50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-primary/10 p-3">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        {sample.sample_type && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Type</p>
                            <p className="font-semibold text-foreground">{sample.sample_type}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {sample.price && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Price</p>
                              <p className="font-medium text-foreground">{sample.price}</p>
                            </div>
                          )}
                          {sample.quantity && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                              <p className="font-medium text-foreground">{sample.quantity}</p>
                            </div>
                          )}
                          {sample.lead_time && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Lead Time</p>
                              <p className="font-medium text-foreground">{sample.lead_time}</p>
                            </div>
                          )}
                          {sample.availability && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Availability</p>
                              <p className="font-medium text-foreground">{sample.availability}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </RestrictedFieldDisplay>
          )
        })()}

        {/* Documentation Files */}
        {(() => {
          const formDataAny = formData as any
          const docFields = [
            { key: 'coa_file', label: 'Certificate of Analysis (COA)', category: 'Certificate' },
            { key: 'tds_file', label: 'Technical Data Sheet (TDS)', category: 'Technical' },
            { key: 'msds_file', label: 'Material Safety Data Sheet (MSDS)', category: 'Safety' },
            { key: 'spec_sheet', label: 'Specification Sheet', category: 'Technical' },
          ].filter(f => formData[f.key as keyof typeof formData])
          
          const hasCertFiles = formData.certificate_files && Array.isArray(formData.certificate_files) && formData.certificate_files.length > 0
          const hasOtherFiles = formData.other_files && Array.isArray(formData.other_files) && formData.other_files.length > 0
          // Files should be visible in all modes, but only downloadable in after_rfq
          const hasUploadedFiles = formDataAny.uploaded_files && Array.isArray(formDataAny.uploaded_files) && formDataAny.uploaded_files.length > 0
          
          if (docFields.length === 0 && !hasCertFiles && !hasOtherFiles && !hasUploadedFiles) return null
          
          // Determine if documents can be downloaded based on permission
          // Only after RFQ can download, but files are visible in all modes
          const canDownload = viewMode === 'after_rfq' // Only after RFQ can download
          
          const handleDownload = async (fileId: string, filename: string) => {
            try {
              // Use hidden iframe to trigger download without navigating away
              // This preserves authentication cookies and Unicode filename from Content-Disposition header
              const iframe = document.createElement('iframe')
              iframe.style.display = 'none'
              iframe.src = `/api/documents/download?fileId=${fileId}`
              document.body.appendChild(iframe)
              
              // Clean up after download starts (browser will handle the rest)
              setTimeout(() => {
                document.body.removeChild(iframe)
              }, 5000) // Give enough time for download to start
            } catch (error) {
              console.error('Download error:', error)
              toast.error(error instanceof Error ? error.message : 'Failed to download file')
            }
          }
          
          return (
            <div>
              <h2 className="text-xl font-semibold mb-4">Documentation & Files</h2>
              {!canDownload && (
                <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground mb-1">Download Restricted</p>
                      <p className="text-xs text-muted-foreground">
                        Submit a Request for Quote (RFQ) to download these documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {docFields.map((field) => {
                  const value = formData[field.key as keyof typeof formData]
                  if (!value) return null
                  const filename = typeof value === 'string' ? (value.split('/').pop() || value.split('\\').pop() || value) : String(value)
                  const FileIcon = getFileIcon(undefined, filename)
                  const fieldAccessible = isFieldAccessible(field.key)
                  const requiredLevel = getRequiredAccessLevel(field.key)
                  
                  return (
                    <RestrictedFieldDisplay
                      key={field.key}
                      value={value}
                      isAccessible={fieldAccessible}
                      requiredLevel={requiredLevel}
                    >
                      <div className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-4 hover:border-primary/50 transition-all duration-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="rounded-lg bg-primary/10 p-3">
                              <FileIcon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground mb-1">{field.label}</p>
                                <p className="text-sm text-muted-foreground truncate">{filename}</p>
                                <div className="flex items-center gap-3 mt-2">
                                  <Badge variant="outline" className="text-xs">{field.category}</Badge>
                                </div>
                              </div>
                              {canDownload ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toast.info('Download functionality for legacy files coming soon')}
                                  className="flex-shrink-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      disabled
                                      className="flex-shrink-0 opacity-50"
                                    >
                                      <Lock className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Submit RFQ to download</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </RestrictedFieldDisplay>
                  )
                })}
                {hasUploadedFiles && (
                  <div className="space-y-3">
                    {formDataAny.uploaded_files.map((f: any, idx: number) => {
                      // Merge with full document metadata if available
                      const fullDoc = f.file_id ? documentMetadata[f.file_id] : null
                      const docData = fullDoc || f
                      
                      const FileIcon = getFileIcon(docData.mime_type, docData.filename)
                      const docType = getDocumentType(docData)
                      const pageCount = getPageCount(docData)
                      const fileSize = docData.file_size ? formatFileSize(docData.file_size) : null
                      
                      return (
                        <div key={idx} className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-4 hover:border-primary/50 transition-all duration-200">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="rounded-lg bg-primary/10 p-3">
                                <FileIcon className="h-5 w-5 text-primary" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground mb-1 truncate">
                                    {docData.filename || f.filename || f.file_id || `Document ${idx + 1}`}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {docType && (
                                      <Badge variant="outline" className="text-xs">{docType}</Badge>
                                    )}
                                    {pageCount && (
                                      <span className="text-xs text-muted-foreground">{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
                                    )}
                                    {fileSize && (
                                      <span className="text-xs text-muted-foreground">{fileSize}</span>
                                    )}
                                    {docData.mime_type && (
                                      <span className="text-xs text-muted-foreground">{docData.mime_type.split('/')[1]?.toUpperCase()}</span>
                                    )}
                                  </div>
                                </div>
                                {canDownload && f.file_id ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(f.file_id, docData.filename || f.filename || 'document')}
                                    className="flex-shrink-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled
                                        className="flex-shrink-0 opacity-50"
                                      >
                                        <Lock className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="text-xs">Submit RFQ to download</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {hasCertFiles && formData.certificate_files && (
                  <div className="p-4 rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20">
                    <p className="font-semibold mb-2">Certificate Files ({formData.certificate_files.length})</p>
                    {canDownload && (
                      <Badge variant="outline" className="text-xs">Download available</Badge>
                    )}
                  </div>
                )}
                {hasOtherFiles && formData.other_files && (
                  <div className="p-4 rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20">
                    <p className="font-semibold mb-2">Other Files ({formData.other_files.length})</p>
                    {canDownload && (
                      <Badge variant="outline" className="text-xs">Download available</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
    </TooltipProvider>
  )
}

/**
 * Get description for file/document fields based on permission level
 */
function getFilePermissionDescription(permission: AccessLevel): string {
  switch (permission) {
    case 'public':
      return 'File is viewable but not downloadable'
    case 'after_click':
      return 'File becomes downloadable when user clicks through email link'
    case 'after_rfq':
      return 'File becomes downloadable when user submits RFQ'
    default:
      return 'File is viewable but not downloadable'
  }
}

/**
 * Field Display Component
 * Shows a product field with its permission widget and visibility indicator
 */
function FieldDisplay({
  label,
  value,
  fieldName,
  permission,
  onPermissionChange,
  viewMode = 'none',
  description,
}: {
  label: string
  value: any
  fieldName: string
  permission: AccessLevel
  onPermissionChange: (fieldName: string, level: AccessLevel) => void
  viewMode?: 'none' | 'public' | 'after_click' | 'after_rfq'
  description?: string
}) {
  // For file fields, generate description dynamically based on current permission
  const dynamicDescription = useMemo(() => {
    // If it's a file field, generate description based on current permission
    if (fieldName.includes('_file') || fieldName.includes('files')) {
      return getFilePermissionDescription(permission)
    }
    // For non-file fields, use provided description if any
    return description
  }, [description, fieldName, permission])
  // Determine if field should be visible based on view mode
  const isVisible = useMemo(() => {
    if (viewMode === 'none') return true // Show all in edit mode
    if (viewMode === 'public') {
      return permission === 'public'
    }
    if (viewMode === 'after_click') {
      // After click sees public and after_click fields
      return permission === 'public' || permission === 'after_click'
    }
    if (viewMode === 'after_rfq') {
      // After RFQ sees everything (inclusive model)
      return true
    }
    return false
  }, [viewMode, permission])

  // Display value with proper formatting
  const displayValue = useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '-'
    
    // Handle product_images - show as image count, not URLs
    if (fieldName === 'product_images' && Array.isArray(value)) {
      return `${value.length} image(s)`
    }
    
    // Handle price_lead_time array of objects
    if (fieldName === 'price_lead_time' && Array.isArray(value)) {
      return value.map((tier: any) => {
        const parts = []
        if (tier.moq) parts.push(`MOQ: ${tier.moq}`)
        if (tier.price) parts.push(`Price: ${tier.price}`)
        if (tier.lead_time) parts.push(`Lead Time: ${tier.lead_time}`)
        return parts.length > 0 ? parts.join(', ') : '-'
      }).join(' | ') || '-'
    }
    
    // Handle samples array of objects
    if (fieldName === 'samples' && Array.isArray(value)) {
      return value.map((sample: any) => {
        const parts = []
        if (sample.sample_type) parts.push(`Type: ${sample.sample_type}`)
        if (sample.price) parts.push(`Price: ${sample.price}`)
        if (sample.quantity) parts.push(`Qty: ${sample.quantity}`)
        if (sample.lead_time) parts.push(`Lead Time: ${sample.lead_time}`)
        if (sample.availability) parts.push(`Available: ${sample.availability}`)
        return parts.length > 0 ? parts.join(', ') : '-'
      }).join(' | ') || '-'
    }
    
    // Handle inventory_locations array of objects
    if (fieldName === 'inventory_locations' && Array.isArray(value)) {
      return value.map((loc: any) => {
        const parts = []
        if (loc.country) parts.push(loc.country)
        if (loc.city) parts.push(loc.city)
        if (loc.quantity) parts.push(`Qty: ${loc.quantity}`)
        return parts.length > 0 ? parts.join(', ') : '-'
      }).join(' | ') || '-'
    }
    
    // Handle file fields - show filename or count
    if (fieldName.includes('_file') || fieldName.includes('files')) {
      if (Array.isArray(value)) {
        return `${value.length} file(s)`
      }
      if (typeof value === 'string' && value.length > 0) {
        // Extract filename from URL or path
        const filename = value.split('/').pop() || value.split('\\').pop() || value
        return filename.length > 50 ? filename.substring(0, 50) + '...' : filename
      }
    }
    
    // Handle regular arrays
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    
    // Handle objects (but not File objects)
    if (typeof value === 'object' && value !== null && !(value instanceof File)) {
      // Try to format as key-value pairs
      const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '')
      if (entries.length > 0) {
        return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
      }
      return '-'
    }
    
    // Handle long URLs - truncate them
    if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:'))) {
      if (value.startsWith('data:image')) {
        return 'Image (base64)'
      }
      if (value.length > 60) {
        return value.substring(0, 60) + '...'
      }
    }
    
    return String(value)
  }, [value, fieldName])

  // Hide field completely if not visible in current view mode (except edit mode)
  if (viewMode !== 'none' && !isVisible) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border/30'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
        </div>
        {dynamicDescription && viewMode === 'none' && (
          <p className="text-xs text-muted-foreground mb-1">{dynamicDescription}</p>
        )}
        <p className="text-sm text-foreground">
          {displayValue}
        </p>
      </div>
      <div className="flex-shrink-0">
        {viewMode === 'none' && (
          <PermissionWidget
            value={permission}
            onChange={(level) => onPermissionChange(fieldName, level)}
            disabled={false}
          />
        )}
      </div>
    </div>
  )
}

export default function PreviewPublishPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string

  const [isPublishing, setIsPublishing] = useState(false)
  const [viewMode, setViewMode] = useState<'none' | 'public' | 'after_click' | 'after_rfq'>('none')
  const [permissions, setPermissions] = useState<FieldPermission>({})
  const [documentMetadata, setDocumentMetadata] = useState<Record<string, any>>({})
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [selectedQrChannel, setSelectedQrChannel] = useState<ChannelLink | null>(null)
  
  // Note: Channel state moved to SharingLinksPanel component

  // Load product data
  const { data: productData, isLoading } = useProduct(productId)

  // Extract product form data
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // Fetch full document metadata for uploaded_files
  useEffect(() => {
    if (!formData) return
    
    const formDataAny = formData as any
    const uploadedFiles = formDataAny.uploaded_files || []
    
    if (uploadedFiles.length === 0) return

    // Get file IDs that need metadata
    const fileIds = uploadedFiles
      .map((f: any) => f.file_id)
      .filter((id: string) => id && !documentMetadata[id])

    if (fileIds.length === 0) return

    // Fetch document metadata
    fetch(`/api/documents/list?fileIds=${fileIds.join(',')}`)
      .then(res => res.json())
      .then(data => {
        if (data.documents && data.documents.length > 0) {
          const metadata: Record<string, any> = {}
          data.documents.forEach((doc: any) => {
            metadata[doc.id] = doc
          })
          setDocumentMetadata(prev => ({ ...prev, ...metadata }))
        }
      })
      .catch(error => {
        console.error('Error fetching document metadata:', error)
      })
  }, [formData, documentMetadata])

  // Load saved permissions and channels or initialize defaults
  useEffect(() => {
    if (formData) {
      const formDataAny = formData as any
      
      // Load saved permissions from product_data
      if (Object.keys(permissions).length === 0) {
        if (formDataAny.field_permissions && typeof formDataAny.field_permissions === 'object') {
          setPermissions(formDataAny.field_permissions)
        }
      }
      
      // Note: Channel management moved to SharingLinksPanel component
      // Channels are now loaded and managed within that component
      
      // If we loaded saved permissions, don't initialize defaults
      if (formDataAny.field_permissions && typeof formDataAny.field_permissions === 'object') {
        return
      }
      
      // If no saved permissions, initialize with defaults
      const defaultPermissions: FieldPermission = {}
      
      // Sensitive fields that should default to after_rfq (most restricted)
      const afterRfqFields = [
        'price_lead_time',
        'samples',
        'coa_file',
        'tds_file',
        'msds_file',
        'spec_sheet',
        'certificate_files',
        'other_files',
        'uploaded_files',
      ]
      
      // Fields that should default to after_click (moderately sensitive)
      const afterClickFields = [
        'cas_number',
        'assay',
        'certificates',
        'fda_number',
        'einecs',
        'manufacturer_name',
      ]
      
      // Set default permissions for all fields in formData
      Object.keys(formData).forEach((key) => {
        // Skip internal/metadata fields (but include uploaded_files)
        if (key.startsWith('_') || key === 'field_permissions' || key === 'channel_links') {
          return
        }
        
        // Note: uploaded_files is handled in afterRfqFields list above
        
        // Check if field has a meaningful value
        const value = formData[key as keyof typeof formData]
        const hasValue = value !== null && value !== undefined && value !== '' && 
          (!Array.isArray(value) || value.length > 0) &&
          (typeof value !== 'object' || Object.keys(value).length > 0)
        
        if (hasValue) {
          if (afterRfqFields.includes(key)) {
            defaultPermissions[key] = 'after_rfq'
          } else if (afterClickFields.includes(key)) {
            defaultPermissions[key] = 'after_click'
          } else {
            defaultPermissions[key] = 'public'
          }
        }
      })
      
      setPermissions(defaultPermissions)
    }
  }, [formData, permissions])

  // Calculate permission statistics
  const permissionStats = useMemo(() => {
    const stats = { public: 0, after_click: 0, after_rfq: 0 }
    Object.values(permissions).forEach((level) => {
      stats[level]++
    })
    return stats
  }, [permissions])

  const handlePermissionChange = (fieldName: string, level: AccessLevel) => {
    setPermissions((prev) => ({ ...prev, [fieldName]: level }))
  }

  const handleSetAllPublic = () => {
    const newPermissions: FieldPermission = {}
    Object.keys(permissions).forEach((key) => {
      newPermissions[key] = 'public'
    })
    setPermissions(newPermissions)
    toast.success('👀 All fields set to Browse Mode (public)')
  }

  const handleSetAllRFQ = () => {
    const newPermissions: FieldPermission = {}
    Object.keys(permissions).forEach((key) => {
      newPermissions[key] = 'after_rfq'
    })
    setPermissions(newPermissions)
    toast.success('✅ All fields set to Full Access (after RFQ)')
  }

  // Note: Channel management moved to SharingLinksPanel component
  // Old functions (handleAddChannel, generateSecureUrl, handleCopyUrl, handleShowQrCode) removed
  // SharingLinksPanel now handles all channel and token generation logic

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // Save permissions to product
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
        const errorData = await response.json().catch(() => ({ error: 'Publish failed' }))
        throw new Error(errorData.error || 'Failed to publish product')
      }

      toast.success('Product published successfully! Links and QR codes generated.')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error publishing product:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to publish product')
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
          <p className="text-destructive">Product not found</p>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/products')}
            className="mt-4"
          >
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

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
                onClick={() => {
                  // Force refresh when navigating back to form with cache-busting
                  router.push(`/dashboard/products/create?productId=${productId}&_refresh=${Date.now()}`)
                }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                  {formData.product_name || 'Product Preview'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  Configure visibility & publish
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              Ready to Publish
            </Badge>
          </div>
        </div>
      </header>

      {/* Permission Level Descriptions - Improved Visual Design */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 bg-muted/30 border-b border-border/30">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground mb-1">Access Control Levels</h3>
          <p className="text-xs text-muted-foreground font-normal">Set visibility for each field. Generate channel links below to grant Link Access.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">👀 Browse Mode</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">Anyone can view basic product information without restrictions</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">🔗 Link Access</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">People with your channel links (email, social, QR codes) see more details like pricing and MOQ</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border/50 hover:border-primary/30 transition-colors">
            <div className="flex-shrink-0 rounded-lg bg-primary/10 p-2">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">✅ Full Access</p>
              <p className="text-xs text-muted-foreground leading-relaxed font-normal">Complete information + file downloads after submitting a Request for Quote (RFQ)</p>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
          {/* Left: Product Preview (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            {viewMode === 'none' ? (
              <>
                {/* Edit Mode: Show fields with access control */}
                {/* Product Images */}
            {formData.product_images && Array.isArray(formData.product_images) && formData.product_images.length > 0 && (
              <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
                <h2 className="text-lg font-semibold mb-4">Product Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {formData.product_images.map((img: any, index: number) => {
                    let imgSrc: string
                    if (typeof img === 'string') {
                      imgSrc = img
                    } else if (img instanceof File) {
                      imgSrc = URL.createObjectURL(img as Blob)
                    } else {
                      return null
                    }
                    if (!imgSrc) return null
                    return (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border/30">
                        <img
                          src={imgSrc}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide broken images
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
                <FieldDisplay
                  label="Product Images"
                  value={formData.product_images}
                  fieldName="product_images"
                  permission={permissions.product_images || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
              </section>
            )}

            {/* Basic Information */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg font-semibold mb-4">Product Information</h2>
              <div className="space-y-1">
                <FieldDisplay
                  label="Product Name"
                  value={formData.product_name}
                  fieldName="product_name"
                  permission={permissions.product_name || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Category"
                  value={formData.category}
                  fieldName="category"
                  permission={permissions.category || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="CAS Number"
                  value={formData.cas_number}
                  fieldName="cas_number"
                  permission={permissions.cas_number || 'after_click'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Origin Country"
                  value={formData.origin_country}
                  fieldName="origin_country"
                  permission={permissions.origin_country || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Manufacturer"
                  value={formData.manufacturer_name}
                  fieldName="manufacturer_name"
                  permission={permissions.manufacturer_name || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Form"
                  value={formData.form}
                  fieldName="form"
                  permission={permissions.form || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Grade"
                  value={formData.grade}
                  fieldName="grade"
                  permission={permissions.grade || 'public'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Assay"
                  value={formData.assay}
                  fieldName="assay"
                  permission={permissions.assay || 'after_click'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
              </div>
            </section>

            {/* Technical Specifications */}
            {(formData.appearance || formData.odor || formData.taste || formData.ph) && (
              <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
                <h2 className="text-lg font-semibold mb-4">Technical Specifications</h2>
                <div className="space-y-1">
                  {formData.appearance && (
                    <FieldDisplay
                      label="Appearance"
                      value={formData.appearance}
                      fieldName="appearance"
                      permission={permissions.appearance || 'public'}
                      onPermissionChange={handlePermissionChange}
                      viewMode={viewMode}
                    />
                  )}
                  {formData.odor && (
                    <FieldDisplay
                      label="Odor"
                      value={formData.odor}
                      fieldName="odor"
                      permission={permissions.odor || 'public'}
                      onPermissionChange={handlePermissionChange}
                      viewMode={viewMode}
                    />
                  )}
                  {formData.taste && (
                    <FieldDisplay
                      label="Taste"
                      value={formData.taste}
                      fieldName="taste"
                      permission={permissions.taste || 'public'}
                      onPermissionChange={handlePermissionChange}
                      viewMode={viewMode}
                    />
                  )}
                  {formData.ph && (
                    <FieldDisplay
                      label="pH"
                      value={formData.ph}
                      fieldName="ph"
                      permission={permissions.ph || 'public'}
                      onPermissionChange={handlePermissionChange}
                      viewMode={viewMode}
                    />
                  )}
                </div>
              </section>
            )}

            {/* Pricing & MOQ */}
            {(() => {
              const hasPriceLeadTime = formData.price_lead_time && (
                Array.isArray(formData.price_lead_time) ? formData.price_lead_time.length > 0 : true
              )
              const hasSamplesArray = formData.samples && (
                Array.isArray(formData.samples) ? formData.samples.length > 0 : true
              )
              const formDataAny = formData as any
              const hasIndividualSamples = formDataAny.provide_sample && 
                (formDataAny.provide_sample.toLowerCase() === 'yes' || formDataAny.provide_sample.toLowerCase() === 'true')
              const hasSamples = hasSamplesArray || hasIndividualSamples
              
              if (!hasPriceLeadTime && !hasSamples) return null
              
              // Format samples value for display
              let samplesValue: any = formData.samples
              if (!hasSamplesArray && hasIndividualSamples) {
                // Create a formatted string from individual sample fields
                const parts = []
                if (formDataAny.sample_type) parts.push(`Type: ${formDataAny.sample_type}`)
                if (formDataAny.sample_price) parts.push(`Price: ${formDataAny.sample_price}`)
                if (formDataAny.sample_quantity) parts.push(`Quantity: ${formDataAny.sample_quantity}`)
                if (formDataAny.sample_lead_time) parts.push(`Lead Time: ${formDataAny.sample_lead_time}`)
                if (formDataAny.sample_availability) parts.push(`Availability: ${formDataAny.sample_availability}`)
                samplesValue = parts.length > 0 ? parts.join(', ') : 'Samples available'
              }
              
              return (
                <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
                  <h2 className="text-lg font-semibold mb-4">Pricing & MOQ</h2>
                  <div className="space-y-1">
                    {hasPriceLeadTime && (
                      <FieldDisplay
                        label="Price & Lead Time"
                        value={formData.price_lead_time}
                        fieldName="price_lead_time"
                        permission={permissions.price_lead_time || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                      />
                    )}
                    {hasSamples && (
                      <FieldDisplay
                        label="Samples Available"
                        value={samplesValue}
                        fieldName="samples"
                        permission={permissions.samples || permissions.provide_sample || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                      />
                    )}
                  </div>
                </section>
              )
            })()}

            {/* Documentation Files */}
            {(() => {
              // Check for files in various locations
              const formDataAny = formData as any
              const hasCoa = formData.coa_file
              const hasTds = formData.tds_file
              const hasMsds = formData.msds_file
              const hasSpec = formData.spec_sheet
              const hasCertFiles = formData.certificate_files && Array.isArray(formData.certificate_files) && formData.certificate_files.length > 0
              const hasOtherFiles = formData.other_files && Array.isArray(formData.other_files) && formData.other_files.length > 0
              
              // Check uploaded_files more carefully
              const uploadedFiles = formDataAny.uploaded_files
              const hasUploadedFiles = uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0
              
              // Debug log
              if (uploadedFiles) {
                console.log('[Preview] Uploaded files found:', {
                  isArray: Array.isArray(uploadedFiles),
                  length: Array.isArray(uploadedFiles) ? uploadedFiles.length : 'not array',
                  data: uploadedFiles
                })
              }
              
              if (!hasCoa && !hasTds && !hasMsds && !hasSpec && !hasCertFiles && !hasOtherFiles && !hasUploadedFiles) {
                return null
              }
              
              return (
                <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
                  <h2 className="text-lg font-semibold mb-4">Documentation & Files</h2>
                  <div className="space-y-1">
                    {hasCoa && (
                      <FieldDisplay
                        label="Certificate of Analysis (COA)"
                        value={formData.coa_file}
                        fieldName="coa_file"
                        permission={permissions.coa_file || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                        description={getFilePermissionDescription(permissions.coa_file || 'after_rfq')}
                      />
                    )}
                    {hasTds && (
                      <FieldDisplay
                        label="Technical Data Sheet (TDS)"
                        value={formData.tds_file}
                        fieldName="tds_file"
                        permission={permissions.tds_file || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                        description={getFilePermissionDescription(permissions.tds_file || 'after_rfq')}
                      />
                    )}
                    {hasMsds && (
                      <FieldDisplay
                        label="Material Safety Data Sheet (MSDS)"
                        value={formData.msds_file}
                        fieldName="msds_file"
                        permission={permissions.msds_file || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                        description={getFilePermissionDescription(permissions.msds_file || 'after_rfq')}
                      />
                    )}
                    {hasSpec && (
                      <FieldDisplay
                        label="Specification Sheet"
                        value={formData.spec_sheet}
                        fieldName="spec_sheet"
                        permission={permissions.spec_sheet || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                        description={getFilePermissionDescription(permissions.spec_sheet || 'after_rfq')}
                      />
                    )}
                    {hasCertFiles && (
                      <FieldDisplay
                        label="Certificate Files"
                        value={formData.certificate_files}
                        fieldName="certificate_files"
                        permission={permissions.certificate_files || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                      />
                    )}
                    {hasOtherFiles && (
                      <FieldDisplay
                        label="Other Files"
                        value={formData.other_files}
                        fieldName="other_files"
                        permission={permissions.other_files || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                      />
                    )}
                    {hasUploadedFiles && (
                      <FieldDisplay
                        label="Uploaded Documents"
                        value={formDataAny.uploaded_files.map((f: any) => f.filename || f.file_id || 'Document').join(', ')}
                        fieldName="uploaded_files"
                        permission={permissions.uploaded_files || 'after_rfq'}
                        onPermissionChange={handlePermissionChange}
                        viewMode={viewMode}
                        description={getFilePermissionDescription(permissions.uploaded_files || 'after_rfq')}
                      />
                    )}
                  </div>
                </section>
              )
            })()}

            {/* Additional Fields - Show all remaining fields */}
            {(() => {
              const displayedFields = new Set([
                'product_name', 'category', 'cas_number', 'origin_country', 'manufacturer_name',
                'form', 'grade', 'assay', 'appearance', 'odor', 'taste', 'ph',
                'product_images', 'price_lead_time', 'samples',
                'coa_file', 'tds_file', 'msds_file', 'spec_sheet', 'certificate_files', 'other_files', 'uploaded_files'
              ])
              
              const additionalFields = Object.keys(formData).filter(key => {
                if (displayedFields.has(key)) return false
                if (key.startsWith('_')) return false
                if (key === 'uploaded_files' || key === 'field_permissions' || key === 'channel_links') return false
                const value = formData[key as keyof typeof formData]
                return value !== null && value !== undefined && value !== '' && 
                  (!Array.isArray(value) || value.length > 0) &&
                  (typeof value !== 'object' || Object.keys(value).length > 0)
              })
              
              if (additionalFields.length === 0) return null
              
              return (
                <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
                  <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
                  <div className="space-y-1">
                    {additionalFields.map((fieldName) => {
                      const value = formData[fieldName as keyof typeof formData]
                      // Get label from PRODUCT_FIELDS if available, otherwise format field name
                      const label = fieldName.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')
                      
                      return (
                        <FieldDisplay
                          key={fieldName}
                          label={label}
                          value={value}
                          fieldName={fieldName}
                          permission={permissions[fieldName] || 'public'}
                          onPermissionChange={handlePermissionChange}
                          viewMode={viewMode}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })()}
              </>
            ) : (
              /* Preview Mode: Show real page view */
              <RealPagePreview
                formData={formData}
                permissions={permissions}
                viewMode={viewMode}
                documentMetadata={documentMetadata}
              />
            )}
          </div>

          {/* Right: Permissions & Links Sidebar (1/3 width on desktop) */}
          <div className="lg:border-l border-border/30">
            {/* Preview Mode Selector - NEW DESIGN */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Preview & Access Levels</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 font-normal">
                Switch modes to see exactly how your product appears to different visitors
              </p>
              <PreviewModeSelector value={viewMode} onChange={setViewMode} />
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetAllPublic}
                  className="w-full text-xs"
                >
                  👀 Set All to Browse Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetAllRFQ}
                  className="w-full text-xs"
                >
                  ✅ Set All to Full Access
                </Button>
              </div>
            </section>

            {/* Sharing Links Panel - NEW DESIGN */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">📋 Sharing Links</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 font-normal">
                Generate secure links for different channels. Each link shows the appropriate level of detail.
              </p>
              <SharingLinksPanel 
                productId={productId}
                onShowQR={(url, name) => {
                  // Store the URL for QR generation
                  const tempChannel = { id: name, name, parameter: url, enabled: true }
                  setSelectedQrChannel(tempChannel as any)
                  setShowQrDialog(true)
                }}
              />
            </section>

            {/* Auto Optimization */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="auto-optimize"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-border/50"
                />
                <div className="flex-1">
                  <label
                    htmlFor="auto-optimize"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    Auto AIO Optimize
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 font-normal">
                    Automatically optimize for SEO & channel tracking
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Publish Button */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block font-normal">
              {permissionStats.public} public • {permissionStats.after_click} after click •{' '}
              {permissionStats.after_rfq} after RFQ
            </p>
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              size="lg"
              className="w-full sm:w-auto gap-2"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  🚀 Publish Product & Generate Links
                </>
              )}
            </Button>
          </div>
        </div>
      </footer>

      {/* QR Code Dialog */}
      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedQrChannel?.name || 'Channel'}</DialogTitle>
            <DialogDescription>
              Scan this QR code to open the product page with channel tracking
            </DialogDescription>
          </DialogHeader>
          {selectedQrChannel && (
            <div className="flex flex-col items-center gap-4 py-4 w-full">
              <div className="flex items-center justify-center w-full">
                <div className="p-4 bg-white rounded-lg inline-block">
                  <QRCode
                    value={selectedQrChannel.parameter || `${typeof window !== 'undefined' ? window.location.origin : ''}/products/${productId}`}
                    size={256}
                    style={{ display: 'block', margin: '0 auto' }}
                    viewBox="0 0 256 256"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-sm break-all">
                {selectedQrChannel.parameter}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

