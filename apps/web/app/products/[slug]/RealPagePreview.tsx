'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Package, MapPin, File, FileImage, FileSpreadsheet, FileCode, FileJson, FileText, Box } from 'lucide-react'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'

type AccessLevel = 'public' | 'after_click' | 'after_rfq'
type FieldPermission = {
  [fieldName: string]: AccessLevel
}

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
 * Real Page Preview Component
 * Shows product like a public-facing page
 */
export function RealPagePreview({
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
  const shouldShow = (fieldName: string): boolean => {
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

  const handleDownload = async (fileId: string, filename: string) => {
    try {
      // Use hidden iframe to trigger download without navigating away
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = `/api/documents/download?fileId=${fileId}`
      document.body.appendChild(iframe)
      
      // Clean up after download starts
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 5000)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <div className="bg-background">
      {/* Product Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 border-b border-border/30">
        {shouldShow('product_name') && formData.product_name && (
          <h1 className="text-3xl font-bold mb-2">{formData.product_name}</h1>
        )}
        {shouldShow('category') && formData.category && (
          <p className="text-muted-foreground">{formData.category}</p>
        )}
      </div>

      {/* Product Images */}
      {shouldShow('product_images') && formData.product_images && Array.isArray(formData.product_images) && formData.product_images.length > 0 && (
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
      )}

      {/* Product Details */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {shouldShow('description') && formData.description && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{formData.description}</p>
          </div>
        )}

        {/* Basic Info */}
        {(() => {
          const basicFields = [
            { key: 'origin_country', label: 'Origin Country' },
            { key: 'manufacturer_name', label: 'Manufacturer' },
            { key: 'form', label: 'Form' },
            { key: 'grade', label: 'Grade' },
            { key: 'cas_number', label: 'CAS Number' },
            { key: 'fda_number', label: 'FDA Number' },
            { key: 'einecs', label: 'EINECS Number' },
            { key: 'botanical_name', label: 'Botanical Name' },
            { key: 'extraction_ratio', label: 'Extraction Ratio' },
            { key: 'carrier_material', label: 'Carrier Material' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (basicFields.length === 0) return null
          
          return (
            <div>
              <h2 className="text-xl font-semibold mb-4">Product Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {basicFields.map((field) => (
                  <div key={field.key}>
                    <p className="text-sm text-muted-foreground">{field.label}</p>
                    <p className="font-medium">{String(formData[field.key as keyof typeof formData])}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

        {/* Applications */}
        {shouldShow('applications') && formData.applications && Array.isArray(formData.applications) && formData.applications.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Applications</h2>
            <div className="flex flex-wrap gap-2">
              {formData.applications.map((app, idx) => (
                <Badge key={idx} variant="secondary">{app}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Documentation Files */}
        {(() => {
          const formDataAny = formData as any
          const docFields = [
            { key: 'coa_file', label: 'Certificate of Analysis (COA)', category: 'Certificate' },
            { key: 'tds_file', label: 'Technical Data Sheet (TDS)', category: 'Technical' },
            { key: 'msds_file', label: 'Material Safety Data Sheet (MSDS)', category: 'Safety' },
            { key: 'spec_sheet', label: 'Specification Sheet', category: 'Technical' },
          ].filter(f => shouldShow(f.key) && formData[f.key as keyof typeof formData])
          
          const hasUploadedFiles = shouldShow('uploaded_files') && formDataAny.uploaded_files && Array.isArray(formDataAny.uploaded_files) && formDataAny.uploaded_files.length > 0
          
          if (docFields.length === 0 && !hasUploadedFiles) return null
          
          // Determine if documents can be downloaded based on permission
          const canDownload = viewMode === 'after_rfq'
          
          return (
            <div>
              <h2 className="text-xl font-semibold mb-4">Documentation & Files</h2>
              {!canDownload && (
                <p className="text-sm text-muted-foreground mb-4">
                  Documents are available for viewing. Download access requires RFQ submission.
                </p>
              )}
              <div className="space-y-3">
                {hasUploadedFiles && (
                  <div className="space-y-3">
                    {formDataAny.uploaded_files.map((f: any, idx: number) => {
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
                                  </div>
                                </div>
                                {canDownload && f.file_id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(f.file_id, docData.filename || f.filename || 'document')}
                                    className="flex-shrink-0"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

