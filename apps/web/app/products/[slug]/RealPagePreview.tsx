'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, Package, MapPin, File, FileImage, FileSpreadsheet, FileCode, FileJson, FileText, Box, Sparkles } from 'lucide-react'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
 * Premium Real Page Preview Component
 * Shows product like a public-facing page with premium design
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
    if (fieldName === 'uploaded_files') {
      return true
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
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = `/api/documents/download?fileId=${fileId}`
      document.body.appendChild(iframe)
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 5000)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  }

  return (
    <motion.div
      className="bg-background relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Hero Section with Gradient */}
      <motion.section
        variants={itemVariants}
        className="relative bg-gradient-to-br from-background via-background to-primary/5 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 border-b border-border/30"
      >
        <div className="max-w-4xl mx-auto">
          {shouldShow('product_name') && formData.product_name && (
            <motion.h1
              variants={itemVariants}
              className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-3 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
            >
              {formData.product_name}
            </motion.h1>
          )}
          {shouldShow('category') && formData.category && (
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground font-medium"
            >
              {formData.category}
            </motion.p>
          )}
        </div>
      </motion.section>

      {/* Product Images Gallery */}
      {shouldShow('product_images') && formData.product_images && Array.isArray(formData.product_images) && formData.product_images.length > 0 && (
        <motion.section
          variants={itemVariants}
          className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 border-b border-border/30 bg-gradient-to-b from-background to-muted/20"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
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
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border/30 bg-gradient-to-br from-background to-muted/10 group cursor-pointer"
                  >
                    <img
                      src={imgSrc}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.section>
      )}

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Description */}
        {shouldShow('description') && formData.description && (
          <motion.section variants={itemVariants} className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">Description</h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {formData.description}
            </p>
          </motion.section>
        )}

        {/* Product Information */}
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
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Product Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {basicFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Applications */}
        {shouldShow('applications') && formData.applications && Array.isArray(formData.applications) && formData.applications.length > 0 && (
          <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">Applications</h2>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {formData.applications.map((app, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                    {app}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Technical Specifications */}
        {(() => {
          const techFields = [
            { key: 'appearance', label: 'Appearance' },
            { key: 'odor', label: 'Odor' },
            { key: 'taste', label: 'Taste' },
            { key: 'solubility', label: 'Solubility' },
            { key: 'particle_size', label: 'Particle Size' },
            { key: 'mesh_size', label: 'Mesh Size' },
            { key: 'bulk_density', label: 'Bulk Density' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (techFields.length === 0) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Physical & Sensory Properties</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {techFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Chemical Analysis */}
        {(() => {
          const chemFields = [
            { key: 'assay', label: 'Assay/Purity' },
            { key: 'ph', label: 'pH' },
            { key: 'moisture', label: 'Moisture' },
            { key: 'ash_content', label: 'Ash Content' },
            { key: 'loss_on_drying', label: 'Loss on Drying' },
            { key: 'residual_solvents', label: 'Residual Solvents' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (chemFields.length === 0) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Chemical Analysis</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {chemFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Heavy Metals */}
        {(() => {
          const metalFields = [
            { key: 'heavy_metals_total', label: 'Heavy Metals (Total)' },
            { key: 'lead', label: 'Lead (Pb)' },
            { key: 'arsenic', label: 'Arsenic (As)' },
            { key: 'cadmium', label: 'Cadmium (Cd)' },
            { key: 'mercury', label: 'Mercury (Hg)' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (metalFields.length === 0) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Heavy Metals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {metalFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Contaminants */}
        {(() => {
          const contamFields = [
            { key: 'pesticide_residue', label: 'Pesticide Residue' },
            { key: 'aflatoxins', label: 'Aflatoxins' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (contamFields.length === 0) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Contaminants</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {contamFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Microbiological */}
        {(() => {
          const microFields = [
            { key: 'total_plate_count', label: 'Total Plate Count' },
            { key: 'yeast_mold', label: 'Yeast & Mold' },
            { key: 'coliforms', label: 'Coliforms' },
            { key: 'e_coli_presence', label: 'E. Coli' },
            { key: 'salmonella_presence', label: 'Salmonella' },
            { key: 'staphylococcus_presence', label: 'Staphylococcus Aureus' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          if (microFields.length === 0) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Microbiological</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {microFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Packaging & Logistics */}
        {(() => {
          const packFields = [
            { key: 'packaging_type', label: 'Packaging Type' },
            { key: 'net_weight', label: 'Net Weight per Package' },
            { key: 'gross_weight', label: 'Gross Weight per Package' },
            { key: 'packages_per_pallet', label: 'Packages per Pallet' },
            { key: 'shelf_life', label: 'Shelf Life' },
            { key: 'storage_temperature', label: 'Storage Temperature' },
            { key: 'payment_terms', label: 'Payment Terms' },
            { key: 'incoterm', label: 'Incoterm' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          const hasStorageConditions = shouldShow('storage_conditions') && formData.storage_conditions && Array.isArray(formData.storage_conditions) && formData.storage_conditions.length > 0
          
          if (packFields.length === 0 && !hasStorageConditions) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Packaging & Logistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {packFields.map((field) => (
                  <motion.div
                    key={field.key}
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {String(formData[field.key as keyof typeof formData])}
                    </p>
                  </motion.div>
                ))}
                {hasStorageConditions && formData.storage_conditions && (
                  <motion.div
                    variants={itemVariants}
                    className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                  >
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                      Storage Conditions
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">
                      {formData.storage_conditions.join(', ')}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )
        })()}

        {/* Certificates & Compliance */}
        {(() => {
          const certFields = [
            { key: 'gmo_status', label: 'GMO Status' },
            { key: 'irradiation_status', label: 'Irradiation Status' },
            { key: 'bse_statement', label: 'BSE/TSE Free Statement' },
            { key: 'halal_certified', label: 'Halal Certified' },
            { key: 'kosher_certified', label: 'Kosher Certified' },
            { key: 'organic_certification_body', label: 'Organic Certification Body' },
          ].filter(f => {
            const value = formData[f.key as keyof typeof formData]
            return shouldShow(f.key) && value !== null && value !== undefined && value !== ''
          })
          
          const hasCertificates = shouldShow('certificates') && formData.certificates && Array.isArray(formData.certificates) && formData.certificates.length > 0
          const hasAllergenInfo = shouldShow('allergen_info') && formData.allergen_info && Array.isArray(formData.allergen_info) && formData.allergen_info.length > 0
          
          if (certFields.length === 0 && !hasCertificates && !hasAllergenInfo) return null
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Certificates & Compliance</h2>
              <div className="space-y-6">
                {hasCertificates && formData.certificates && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Certificates</p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {formData.certificates.map((cert, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                            {cert}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {hasAllergenInfo && formData.allergen_info && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">Allergen Information</p>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {formData.allergen_info.map((allergen, idx) => (
                        <motion.div
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
                            Free from: {allergen}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {certFields.map((field) => (
                    <motion.div
                      key={field.key}
                      variants={itemVariants}
                      className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-background to-muted/10 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                    >
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                        {field.label}
                      </p>
                      <p className="text-base sm:text-lg font-semibold text-foreground">
                        {String(formData[field.key as keyof typeof formData])}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          )
        })()}

        {/* Inventory Locations */}
        {shouldShow('inventory_locations') && formData.inventory_locations && Array.isArray(formData.inventory_locations) && formData.inventory_locations.length > 0 && (
          <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Inventory Locations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {formData.inventory_locations.map((loc: any, idx: number) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-5 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors duration-300">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 text-base sm:text-lg">
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
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Pricing & Lead Time */}
        {shouldShow('price_lead_time') && formData.price_lead_time && (
          <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">Pricing & Lead Time</h2>
            <div className="p-5 sm:p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
              <p className="text-base sm:text-lg text-foreground font-medium">
                {formatValue(formData.price_lead_time, 'price_lead_time')}
              </p>
            </div>
          </motion.section>
        )}

        {/* Samples */}
        {(() => {
          const hasSamplesArray = shouldShow('samples') && formData.samples && Array.isArray(formData.samples) && formData.samples.length > 0
          const formDataAny = formData as any
          const hasIndividualSamples = shouldShow('provide_sample') && formDataAny.provide_sample && 
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
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Samples</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {samples.map((sample: any, idx: number) => (
                  <motion.div
                    key={idx}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-5 sm:p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors duration-300">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        {sample.sample_type && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Type</p>
                            <p className="font-semibold text-foreground text-base sm:text-lg">{sample.sample_type}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-3">
                          {sample.price && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Price</p>
                              <p className="font-medium text-foreground text-sm sm:text-base">{sample.price}</p>
                            </div>
                          )}
                          {sample.quantity && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Quantity</p>
                              <p className="font-medium text-foreground text-sm sm:text-base">{sample.quantity}</p>
                            </div>
                          )}
                          {sample.lead_time && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Lead Time</p>
                              <p className="font-medium text-foreground text-sm sm:text-base">{sample.lead_time}</p>
                            </div>
                          )}
                          {sample.availability && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Availability</p>
                              <p className="font-medium text-foreground text-sm sm:text-base">{sample.availability}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )
        })()}

        {/* Documentation Files */}
        {(() => {
          const formDataAny = formData as any
          const hasUploadedFiles = shouldShow('uploaded_files') && formDataAny.uploaded_files && Array.isArray(formDataAny.uploaded_files) && formDataAny.uploaded_files.length > 0
          
          if (!hasUploadedFiles) return null
          
          const canDownload = viewMode === 'after_rfq'
          
          return (
            <motion.section variants={itemVariants} className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-foreground">Documentation & Files</h2>
              {!canDownload && (
                <p className="text-sm sm:text-base text-muted-foreground mb-6">
                  Documents are available for viewing. Download access requires RFQ submission.
                </p>
              )}
              <div className="space-y-3 sm:space-y-4">
                {formDataAny.uploaded_files.map((f: any, idx: number) => {
                  const fullDoc = f.file_id ? documentMetadata[f.file_id] : null
                  const docData = fullDoc || f
                  
                  const FileIcon = getFileIcon(docData.mime_type, docData.filename)
                  const docType = getDocumentType(docData)
                  const pageCount = getPageCount(docData)
                  const fileSize = docData.file_size ? formatFileSize(docData.file_size) : null
                  
                  return (
                    <motion.div
                      key={idx}
                      variants={itemVariants}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className="group relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-br from-background to-muted/20 p-4 sm:p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="rounded-lg bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors duration-300">
                            <FileIcon className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-foreground mb-1 truncate text-base sm:text-lg">
                                {docData.filename || f.filename || f.file_id || `Document ${idx + 1}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {docType && (
                                  <Badge variant="outline" className="text-xs">
                                    {docType}
                                  </Badge>
                                )}
                                {pageCount && (
                                  <span className="text-xs text-muted-foreground">
                                    {pageCount} page{pageCount !== 1 ? 's' : ''}
                                  </span>
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
                    </motion.div>
                  )
                })}
              </div>
            </motion.section>
          )
        })()}
      </div>
    </motion.div>
  )
}
