'use client'

/**
 * LEGACY: Product Creation Page (Food Supplement)
 * 
 * This page is maintained for backward compatibility.
 * API calls to /api/documents/* automatically delegate to industry-specific routes.
 * 
 * NEW STRUCTURE: /dashboard/[industry_code]/products/create
 * Future: This page will redirect to /dashboard/food_supplement/products/create
 * 
 * Current behavior: Works seamlessly with new industry-specific API architecture
 * - /api/documents/extract → /api/food_supplement/documents/extract
 * - /api/documents/merge → /api/food_supplement/documents/merge
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileUploadPanel, type FileWithExtraction } from '@/components/products/FileUploadPanel'
import { FoodSupplementForm } from '@/components/products/industries/food-supplement/FoodSupplementForm'
import { ExtractedFieldsDisplay } from '@/components/products/ExtractedFieldsDisplay'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { cn } from '@/lib/utils'

const initialFormData: FoodSupplementProductData = {
  productImages: [],
  productName: '',
  originCountry: '',
  manufacturerName: '',
  casNumber: '',
  fdaNumber: '',
  einecs: '',
  description: '',
  category: '',
  applications: [],
  form: '',
  grade: '',
  botanicalName: '',
  extractionRatio: '',
  carrierMaterial: '',
  appearance: '',
  odor: '',
  taste: '',
  solubility: '',
  meshSize: '',
  priceTiers: [
    { id: '1', moq: 0, price: 0, leadTime: 0 },
  ],
  packagingType: '',
  netWeight: '',
  grossWeight: '',
  packagesPerPallet: null,
  paymentTerms: '',
  shelfLife: null,
  incoterm: '',
  storageConditions: [],
  storageTemperature: '',
  provideSample: '',
  sampleType: '',
  samplePrice: null,
  sampleQuantity: null,
  sampleLeadTime: '',
  sampleAvailability: '',
  moq: null,
  certificates: [],
  certificateFiles: [],
  allergenInfo: '',
  gmoStatus: '',
  irradiationStatus: '',
  bseStatement: '',
  halalCertified: '',
  kosherCertified: '',
  organicCertificationBody: '',
  warehouseLocations: [],
  coaFile: null,
  tdsFile: null,
  msdsFile: null,
  specSheet: null,
  otherFiles: [],
  assay: null,
  moisture: null,
  ashContent: null,
  bulkDensity: null,
  particleSize: '',
  lead: null,
  arsenic: null,
  cadmium: null,
  mercury: null,
  aflatoxins: null,
  totalPlateCount: null,
  yeastMold: null,
  eColiPresence: '',
  salmonellaPresence: '',
  staphylococcusPresence: '',
  pesticideResidue: '',
  residualSolvents: '',
  ph: '',
  lossOnDrying: null,
}

export default function CreateProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FoodSupplementProductData>(initialFormData)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithExtraction[]>([])
  const [visibleTechnicalFields, setVisibleTechnicalFields] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [extractedGroupedData, setExtractedGroupedData] = useState<any>({})

  // Helper to check if a value is meaningful (not empty, null, undefined, or "Unknown")
  const hasMeaningfulValue = (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (typeof value === 'string' && value.trim().toLowerCase() === 'unknown') return false
    return true
  }

  // Clean up visibleFields based on current form data values
  // Remove fields that have empty/unknown values
  const cleanedVisibleFields = useMemo(() => {
    const cleaned = new Set<string>()
    visibleTechnicalFields.forEach((fieldName) => {
      const fieldValue = formData[fieldName as keyof FoodSupplementProductData]
      if (hasMeaningfulValue(fieldValue)) {
        // Additional check for status fields
        if (fieldName === 'gmoStatus' || fieldName === 'irradiationStatus') {
          const strValue = String(fieldValue).trim().toLowerCase()
          if (strValue !== 'unknown') {
            cleaned.add(fieldName)
          }
        } else {
          cleaned.add(fieldName)
        }
      }
    })
    return cleaned
  }, [formData, visibleTechnicalFields])

  const handleFormChange = useCallback((updates: Partial<FoodSupplementProductData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleFilesUpload = useCallback(async (files: File[]) => {
    // Create temporary entries for all files immediately
    const tempFiles: FileWithExtraction[] = files.map((file) => ({
      extraction: {
        id: `temp-${Date.now()}-${Math.random()}-${file.name}`,
        content_hash: '',
        filename: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: '',
        organization_id: '',
        uploaded_by: '',
        raw_extracted_data: null,
        file_summary: null,
        extracted_values: null,
        reviewed_values: null,
        user_corrections: null,
        analysis_status: 'pending',
        review_status: 'pending_review',
        error_message: null,
        reviewed_by: null,
        reviewed_at: null,
        reference_count: 0,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      displayStatus: 'uploading' as const,
      progress: 0,
    }))

    // Add all files to UI at once
    setUploadedFiles((prev) => [...prev, ...tempFiles])

    // Process all files in parallel
    const uploadPromises = files.map(async (file, index) => {
      const tempFile = tempFiles[index]
      
      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadedFiles((prev) =>
            prev.map((f) => {
              if (f.extraction.id === tempFile.extraction.id && f.progress !== undefined) {
                const newProgress = Math.min((f.progress || 0) + 10, 90)
                return { ...f, progress: newProgress }
              }
              return f
            })
          )
        }, 200)

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }))
          const errorMessage = errorData.error || `Upload failed with status ${uploadResponse.status}`
          throw new Error(errorMessage)
        }

        const uploadData = await uploadResponse.json()
        const extraction = uploadData.file

        // Set progress to 100% after upload
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.id === tempFile.extraction.id ? { ...f, progress: 100 } : f
          )
        )

        // Check if file already exists and is completed - show results immediately
        if (uploadData.isExisting && extraction.analysis_status === 'completed') {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === tempFile.extraction.id
                ? { extraction, displayStatus: 'completed' as const }
                : f
            )
          )
          toast.success(`File already analyzed: ${file.name}`, { icon: '✨' })
          return
        }

        // Check if file already exists but not completed yet - show current status
        if (uploadData.isExisting) {
          const displayStatus = extraction.analysis_status === 'failed' 
            ? 'error' as const
            : extraction.analysis_status === 'analyzing'
            ? 'analyzing' as const
            : extraction.analysis_status === 'completed'
            ? 'completed' as const
            : 'analyzing' as const // pending or other statuses show as analyzing
          
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === tempFile.extraction.id
                ? { extraction, displayStatus }
                : f
            )
          )
          
          // If it's already completed, skip
          if (extraction.analysis_status === 'completed') {
            toast.success(`File already analyzed: ${file.name}`)
            return
          }
          
          // If it's already analyzing, check if it's stuck
          if (extraction.analysis_status === 'analyzing') {
            const analyzingTime = new Date().getTime() - new Date(extraction.updated_at).getTime()
            const twoMinutes = 2 * 60 * 1000
            
            if (analyzingTime < twoMinutes) {
              toast.info(`File is already being analyzed: ${file.name}`)
              return
            } else {
              toast.warning(`File has been analyzing for a while, retrying: ${file.name}`)
              setUploadedFiles((prev) =>
                prev.map((f) =>
                  f.extraction.id === extraction.id
                    ? { extraction, displayStatus: 'analyzing' as const }
                    : f
                )
              )
            }
          } else if (extraction.analysis_status === 'pending' || extraction.analysis_status === 'failed') {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.extraction.id === extraction.id
                  ? { extraction, displayStatus: 'analyzing' as const }
                  : f
              )
            )
          } else {
            return
          }
        } else {
          // New file - set to analyzing
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === tempFile.extraction.id
                ? { extraction, displayStatus: 'analyzing' as const }
                : f
            )
          )
        }

        // Trigger AI extraction
        const extractResponse = await fetch('/api/documents/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: extraction.id }),
        })

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json().catch(() => ({ error: 'Extraction failed' }))
          const errorMessage = errorData.error || `Extraction failed with status ${extractResponse.status}`
          throw new Error(errorMessage)
        }

        // Parse response with better error handling
        let extractData
        try {
          const responseText = await extractResponse.text()
          extractData = JSON.parse(responseText)
        } catch (parseError) {
          console.error('Failed to parse extract response:', parseError)
          throw new Error(`Failed to parse extraction response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`)
        }
        
        if (!extractData.extraction) {
          throw new Error('Extraction response missing extraction data')
        }
        
        const completedExtraction = extractData.extraction

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.id === extraction.id
              ? { extraction: completedExtraction, displayStatus: 'completed' as const }
              : f
          )
        )

        const fieldCount = completedExtraction.extracted_values
          ? Object.keys(completedExtraction.extracted_values).filter(
              (k) => completedExtraction.extracted_values![k] !== null && k !== '_grouped'
            ).length
          : 0

        toast.success(`Extracted ${fieldCount} fields from ${file.name}`, { icon: '✨' })

        // Store grouped data for display
        if (completedExtraction.extracted_values?._grouped) {
          setExtractedGroupedData((prev: any) => ({
            ...prev,
            ...completedExtraction.extracted_values._grouped
          }))
        }

        // Auto-fill priority fields: category, applications, description
        const extractedValues = completedExtraction.extracted_values || {}
        const grouped = extractedValues._grouped || {}
        const basic = grouped.basic || {}
        
        // Auto-fill fields only if they don't already have values
        setFormData((currentFormData) => {
          const updates: Partial<FoodSupplementProductData> = {}
          
          // Auto-fill category
          if (basic.category && !currentFormData.category) {
            updates.category = String(basic.category)
          }
          
          // Auto-fill applications
          if (basic.application && !currentFormData.applications?.length) {
            if (Array.isArray(basic.application)) {
              updates.applications = basic.application
            } else {
              updates.applications = [String(basic.application)]
            }
          }
          
          // Auto-fill description
          if (basic.description && !currentFormData.description) {
            updates.description = String(basic.description)
          }
          
          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            toast.info('Auto-filled category, applications, and description', { icon: '🤖' })
            return { ...currentFormData, ...updates }
          }
          
          return currentFormData
        })
      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.id === tempFile.extraction.id
              ? {
                  ...f,
                  displayStatus: 'error' as const,
                  extraction: {
                    ...f.extraction,
                    error_message: error instanceof Error ? error.message : 'Failed to process',
                  },
                }
              : f
          )
        )
        const errorMessage = error instanceof Error ? error.message : 'Failed to process'
        toast.error(`Failed to process ${file.name}: ${errorMessage}`)
      }
    })

    // Wait for all uploads to complete
    await Promise.allSettled(uploadPromises)
  }, [])

  const handleFileDelete = useCallback(async (fileId: string) => {
    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setUploadedFiles((prev) => prev.filter((f) => f.extraction.id !== fileId))
      toast.success('File deleted')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }, [])

  const handleApplyFields = useCallback(
    async (fileId: string, fields: Record<string, any>) => {
      try {
        // First, save reviewed values if not already reviewed
        const file = uploadedFiles.find((f) => f.extraction.id === fileId)
        if (file?.extraction.review_status !== 'reviewed') {
          const reviewResponse = await fetch('/api/documents/review', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, reviewedValues: fields }),
          })

          if (!reviewResponse.ok) {
            throw new Error('Failed to save review')
          }

          const reviewData = await reviewResponse.json()
          
          // Update local state with reviewed extraction
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === fileId 
                ? { 
                    ...f, 
                    extraction: {
                      ...f.extraction,
                      ...reviewData.extraction,
                      review_status: 'reviewed' as const
                    }
                  } 
                : f
            )
          )
        }

        // Use AI to merge new fields with existing form data
        toast.info('Merging data intelligently...', { icon: '🤖' })
        
        const mergeResponse = await fetch('/api/documents/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentData: formData,
            newFields: fields,
          }),
        })

        if (!mergeResponse.ok) {
          throw new Error('Failed to merge data')
        }

        const mergeData = await mergeResponse.json()
        const mergedFields = mergeData.mergedData

        // Apply merged fields to form
        const updates: Partial<FoodSupplementProductData> = {}
        const newVisibleFields = new Set<string>(visibleTechnicalFields)

        // Priority fields to auto-fill: category, applications, description
        const priorityFields: Record<string, string> = {}
        
        Object.entries(mergedFields).forEach(([key, value]) => {
          // Handle grouped keys (e.g., "basic.product_name", "chemical.assay_min")
          if (key.includes('.')) {
            const [group, fieldKey] = key.split('.')
            
            // Map grouped fields to form fields
            switch (group) {
              case 'basic':
                switch (fieldKey) {
                  case 'product_name':
                    updates.productName = String(value)
                    break
                  case 'category':
                    updates.category = String(value)
                    break
                  case 'description':
                    updates.description = String(value)
                    break
                  case 'appearance':
                    updates.appearance = String(value)
                    newVisibleFields.add('appearance')
                    break
                  case 'origin_country':
                    updates.originCountry = String(value)
                    break
                  case 'cas_number':
                    updates.casNumber = String(value)
                    break
                  case 'einecs_number':
                    updates.einecs = String(value)
                    newVisibleFields.add('einecs')
                    break
                  case 'application':
                    if (Array.isArray(value)) {
                      updates.applications = value
                    }
                    break
                }
                break
              case 'origin':
                switch (fieldKey) {
                  case 'botanical_name':
                    updates.botanicalName = String(value)
                    newVisibleFields.add('botanicalName')
                    break
                  case 'extraction_ratio':
                    updates.extractionRatio = String(value)
                    newVisibleFields.add('extractionRatio')
                    break
                  case 'carrier_material':
                    updates.carrierMaterial = String(value)
                    newVisibleFields.add('carrierMaterial')
                    break
                }
                break
              case 'physical':
                switch (fieldKey) {
                  case 'form':
                    updates.form = String(value)
                    break
                  case 'mesh_size':
                    updates.meshSize = String(value)
                    newVisibleFields.add('meshSize')
                    break
                  // Note: color field doesn't exist in form, skip it
                  // case 'color':
                  //   updates.color = String(value)
                  //   break
                  case 'odor':
                    updates.odor = String(value)
                    newVisibleFields.add('odor')
                    break
                  case 'taste':
                    updates.taste = String(value)
                    newVisibleFields.add('taste')
                    break
                  case 'solubility_water':
                    updates.solubility = String(value)
                    newVisibleFields.add('solubility')
                    break
                  case 'particle_size_range':
                    updates.particleSize = String(value)
                    newVisibleFields.add('particleSize')
                    break
                  case 'bulk_density':
                    if (value) {
                      updates.bulkDensity = parseFloat(String(value))
                      newVisibleFields.add('bulkDensity')
                    }
                    break
                }
                break
              case 'chemical':
                switch (fieldKey) {
                  case 'assay_min':
                    if (value) {
                      updates.assay = parseFloat(String(value))
                      newVisibleFields.add('assay')
                    }
                    break
                  case 'moisture_max':
                    if (value) {
                      updates.moisture = parseFloat(String(value))
                      newVisibleFields.add('moisture')
                    }
                    break
                  case 'ash_max':
                    if (value) {
                      updates.ashContent = parseFloat(String(value))
                      newVisibleFields.add('ashContent')
                    }
                    break
                  case 'ph_value':
                    updates.ph = String(value)
                    newVisibleFields.add('ph')
                    break
                  case 'lead_max':
                    if (value) {
                      updates.lead = parseFloat(String(value))
                      newVisibleFields.add('lead')
                    }
                    break
                  case 'arsenic_max':
                    if (value) {
                      updates.arsenic = parseFloat(String(value))
                      newVisibleFields.add('arsenic')
                    }
                    break
                  case 'cadmium_max':
                    if (value) {
                      updates.cadmium = parseFloat(String(value))
                      newVisibleFields.add('cadmium')
                    }
                    break
                  case 'mercury_max':
                    if (value) {
                      updates.mercury = parseFloat(String(value))
                      newVisibleFields.add('mercury')
                    }
                    break
                  case 'pesticide_residue':
                    updates.pesticideResidue = String(value)
                    newVisibleFields.add('pesticideResidue')
                    break
                  case 'aflatoxins_max':
                    if (value) {
                      updates.aflatoxins = parseFloat(String(value))
                      newVisibleFields.add('aflatoxins')
                    }
                    break
                  case 'residual_solvents':
                    updates.residualSolvents = String(value)
                    newVisibleFields.add('residualSolvents')
                    break
                }
                break
              case 'microbial':
                switch (fieldKey) {
                  case 'total_plate_count_max':
                    if (value) {
                      updates.totalPlateCount = parseInt(String(value))
                      newVisibleFields.add('totalPlateCount')
                    }
                    break
                  case 'yeast_mold_max':
                    if (value) {
                      updates.yeastMold = parseInt(String(value))
                      newVisibleFields.add('yeastMold')
                    }
                    break
                  case 'e_coli':
                    if (hasMeaningfulValue(value)) {
                      updates.eColiPresence = String(value)
                      newVisibleFields.add('eColiPresence')
                    }
                    break
                  case 'salmonella':
                    if (hasMeaningfulValue(value)) {
                      updates.salmonellaPresence = String(value)
                      newVisibleFields.add('salmonellaPresence')
                    }
                    break
                  case 'staphylococcus_aureus':
                    if (hasMeaningfulValue(value)) {
                      updates.staphylococcusPresence = String(value)
                      newVisibleFields.add('staphylococcusPresence')
                    }
                    break
                }
                break
              case 'supplier':
                switch (fieldKey) {
                  case 'manufacturer_name':
                    updates.manufacturerName = String(value)
                    break
                }
                break
              case 'commercial':
                switch (fieldKey) {
                  case 'shelf_life_months':
                    if (value) {
                      updates.shelfLife = parseInt(String(value))
                      newVisibleFields.add('shelfLife')
                    }
                    break
                  case 'storage_temperature':
                    updates.storageTemperature = String(value)
                    newVisibleFields.add('storageTemperature')
                    break
                  case 'sample_availability':
                    updates.sampleAvailability = String(value)
                    newVisibleFields.add('sampleAvailability')
                    break
                  case 'moq':
                    if (value) {
                      updates.moq = parseInt(String(value))
                      newVisibleFields.add('moq')
                    }
                    break
                }
                break
              case 'packaging':
                switch (fieldKey) {
                  case 'packaging_type':
                    if (Array.isArray(value) && value.length > 0) {
                      updates.packagingType = value[0]
                    }
                    break
                  case 'net_weight_per_package':
                    updates.netWeight = String(value)
                    break
                  case 'gross_weight_per_package':
                    updates.grossWeight = String(value)
                    newVisibleFields.add('grossWeight')
                    break
                  case 'packages_per_pallet':
                    if (value) {
                      updates.packagesPerPallet = parseInt(String(value))
                      newVisibleFields.add('packagesPerPallet')
                    }
                    break
                }
                break
              case 'allergen':
                switch (fieldKey) {
                  case 'allergen_statement':
                    updates.allergenInfo = String(value)
                    newVisibleFields.add('allergenInfo')
                    break
                }
                break
              case 'compliance':
                switch (fieldKey) {
                  case 'is_gmo':
                    const gmoValue = value === 'Yes' ? 'Non-GMO' : value === 'No' ? 'GMO' : 'Unknown'
                    if (hasMeaningfulValue(gmoValue) && gmoValue !== 'Unknown') {
                      updates.gmoStatus = gmoValue
                      newVisibleFields.add('gmoStatus')
                    }
                    break
                  case 'halal_certified':
                    updates.halalCertified = String(value)
                    newVisibleFields.add('halalCertified')
                    break
                  case 'kosher_certified':
                    updates.kosherCertified = String(value)
                    newVisibleFields.add('kosherCertified')
                    break
                  case 'organic_certification_body':
                    updates.organicCertificationBody = String(value)
                    newVisibleFields.add('organicCertificationBody')
                    break
                  case 'specification_standard':
                    if (Array.isArray(value)) {
                      updates.certificates = value
                    }
                    break
                }
                break
            }
            return // Skip the flat key processing below
          }
          
          // Map flat API fields to form fields (for backward compatibility)
          switch (key) {
            case 'productName':
              updates.productName = String(value)
              break
            case 'casNumber':
              updates.casNumber = String(value)
              break
            case 'originCountry':
              updates.originCountry = String(value)
              break
            case 'manufacturerName':
              updates.manufacturerName = String(value)
              break
            case 'einecs':
              updates.einecs = String(value)
              break
            case 'fdaNumber':
              updates.fdaNumber = String(value)
              break
            case 'description':
              updates.description = String(value)
              break
            case 'category':
              updates.category = String(value)
              break
            case 'appearance':
              updates.appearance = String(value)
              break
            case 'odor':
              updates.odor = String(value)
              break
            case 'taste':
              updates.taste = String(value)
              break
            case 'form':
              updates.form = String(value)
              break
            case 'grade':
              updates.grade = String(value)
              break
            case 'solubility':
              updates.solubility = String(value)
              break
            case 'assay':
            case 'moisture':
            case 'ashContent':
            case 'bulkDensity':
            case 'lead':
            case 'arsenic':
            case 'cadmium':
            case 'mercury':
            case 'lossOnDrying':
              if (value) {
                updates[key] = parseFloat(String(value))
                newVisibleFields.add(key)
              }
              break
            case 'totalPlateCount':
            case 'yeastMold':
              if (value) {
                updates[key] = parseInt(String(value))
                newVisibleFields.add(key)
              }
              break
            case 'shelfLife':
              if (value) {
                updates.shelfLife = parseInt(String(value))
                newVisibleFields.add('shelfLife')
              }
              break
            case 'particleSize':
            case 'ph':
            case 'pesticideResidue':
              if (value) {
                updates[key] = String(value)
                newVisibleFields.add(key)
              }
              break
            case 'allergenInfo':
            case 'bseStatement':
              if (value) {
                updates[key] = String(value)
                newVisibleFields.add(key)
              }
              break
            case 'eColiPresence':
            case 'salmonellaPresence':
            case 'staphylococcusPresence':
              if (hasMeaningfulValue(value)) {
                updates[key] = String(value)
                newVisibleFields.add(key)
              }
              break
            case 'gmoStatus':
            case 'irradiationStatus':
              const statusValue = String(value)
              if (hasMeaningfulValue(statusValue) && statusValue.trim().toLowerCase() !== 'unknown') {
                updates[key] = statusValue
                newVisibleFields.add(key)
              }
              break
            case 'storageConditions':
              if (Array.isArray(value) && value.length > 0) {
                updates.storageConditions = value
                newVisibleFields.add('storageConditions')
              }
              break
            case 'applications':
            case 'certificates':
              if (Array.isArray(value)) {
                updates[key] = value
              }
              break
          }
        })

        setFormData((prev) => {
          const updatedData = { ...prev, ...updates }
          
          // Clean up visibleFields: remove fields that have empty/unknown values
          const cleanedVisibleFields = new Set<string>()
          newVisibleFields.forEach((fieldName) => {
            const fieldValue = updatedData[fieldName as keyof FoodSupplementProductData]
            if (hasMeaningfulValue(fieldValue)) {
              // Additional check for status fields
              if (fieldName === 'gmoStatus' || fieldName === 'irradiationStatus') {
                const strValue = String(fieldValue).trim().toLowerCase()
                if (strValue !== 'unknown') {
                  cleanedVisibleFields.add(fieldName)
                }
              } else {
                cleanedVisibleFields.add(fieldName)
              }
            }
          })
          
          setVisibleTechnicalFields(cleanedVisibleFields)
          return updatedData
        })
        
        // Store grouped data for additional fields display
        if (mergedFields._grouped) {
          setExtractedGroupedData((prev: any) => ({
            ...prev,
            ...mergedFields._grouped
          }))
        }
        
        toast.success('Fields merged and applied successfully', { icon: '✨' })
      } catch (error) {
        console.error('Error applying fields:', error)
        toast.error('Failed to apply fields')
      }
    },
    [uploadedFiles, formData, visibleTechnicalFields]
  )
  
  const handleGroupedFieldUpdate = useCallback((group: string, field: string, value: any) => {
    setExtractedGroupedData((prev: any) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value
      }
    }))
  }, [])

  const handleAddFields = useCallback((fields: string[]) => {
    setVisibleTechnicalFields((prev) => {
      const newSet = new Set(prev)
      fields.forEach((field) => newSet.add(field))
      return newSet
    })
  }, [])

  const handleApplyAll = useCallback(async () => {
    try {
      // Get all completed files
      const completedFiles = uploadedFiles.filter(f => f.displayStatus === 'completed')
      
      if (completedFiles.length === 0) {
        toast.error('No completed files to apply')
        return
      }

      // Collect all extracted values from all completed files
      const allFields: Record<string, any> = {}
      
      completedFiles.forEach((file) => {
        const fields = (file.extraction.reviewed_values || file.extraction.extracted_values || {}) as Record<string, any>
        
        // Merge fields from this file into allFields
        Object.entries(fields).forEach(([key, value]) => {
          // Skip _grouped metadata key - we'll handle it separately
          if (key === '_grouped') {
            // Merge grouped data
            if (value && typeof value === 'object') {
              if (!allFields._grouped) {
                allFields._grouped = {}
              }
              Object.entries(value as Record<string, any>).forEach(([groupKey, groupData]) => {
                if (!allFields._grouped[groupKey]) {
                  allFields._grouped[groupKey] = {}
                }
                Object.entries(groupData as Record<string, any>).forEach(([fieldKey, fieldValue]) => {
                  // For arrays, merge them
                  if (Array.isArray(fieldValue) && Array.isArray(allFields._grouped[groupKey][fieldKey])) {
                    allFields._grouped[groupKey][fieldKey] = [...new Set([...allFields._grouped[groupKey][fieldKey], ...fieldValue])]
                  } else if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
                    // Prefer non-empty values, or keep existing if new is empty
                    if (!allFields._grouped[groupKey][fieldKey] || allFields._grouped[groupKey][fieldKey] === '') {
                      allFields._grouped[groupKey][fieldKey] = fieldValue
                    }
                  }
                })
              })
            }
          } else {
            // Handle flat fields
            if (Array.isArray(value) && Array.isArray(allFields[key])) {
              // Merge arrays and remove duplicates
              allFields[key] = [...new Set([...allFields[key], ...value])]
            } else if (value !== null && value !== undefined && value !== '') {
              // Prefer non-empty values, or keep existing if new is empty
              if (!allFields[key] || allFields[key] === '') {
                allFields[key] = value
              }
            }
          }
        })
      })

      if (Object.keys(allFields).length === 0 || (Object.keys(allFields).length === 1 && allFields._grouped && Object.keys(allFields._grouped).length === 0)) {
        toast.error('No extracted fields found in completed files')
        return
      }

      // Use AI to merge all fields with existing form data
      toast.info(`Merging data from ${completedFiles.length} file(s) intelligently...`, { icon: '🤖' })
      
      const mergeResponse = await fetch('/api/documents/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentData: formData,
          newFields: allFields,
        }),
      })

      if (!mergeResponse.ok) {
        throw new Error('Failed to merge data')
      }

      const mergeData = await mergeResponse.json()
      const mergedFields = mergeData.mergedData

      // Apply merged fields to form (reuse the same logic from handleApplyFields)
      const updates: Partial<FoodSupplementProductData> = {}
      const newVisibleFields = new Set<string>(visibleTechnicalFields)

      Object.entries(mergedFields).forEach(([key, value]) => {
        // Handle grouped keys (e.g., "basic.product_name", "chemical.assay_min")
        if (key.includes('.')) {
          const [group, fieldKey] = key.split('.')
          
          // Map grouped fields to form fields
          switch (group) {
            case 'basic':
              switch (fieldKey) {
                case 'product_name':
                  updates.productName = String(value)
                  break
                case 'category':
                  updates.category = String(value)
                  break
                case 'description':
                  updates.description = String(value)
                  break
                case 'appearance':
                  updates.appearance = String(value)
                  newVisibleFields.add('appearance')
                  break
                case 'origin_country':
                  updates.originCountry = String(value)
                  break
                case 'cas_number':
                  updates.casNumber = String(value)
                  break
                case 'einecs_number':
                  updates.einecs = String(value)
                  newVisibleFields.add('einecs')
                  break
                case 'application':
                  if (Array.isArray(value)) {
                    updates.applications = value
                  }
                  break
              }
              break
            case 'origin':
              switch (fieldKey) {
                case 'botanical_name':
                  updates.botanicalName = String(value)
                  newVisibleFields.add('botanicalName')
                  break
                case 'extraction_ratio':
                  updates.extractionRatio = String(value)
                  newVisibleFields.add('extractionRatio')
                  break
                case 'carrier_material':
                  updates.carrierMaterial = String(value)
                  newVisibleFields.add('carrierMaterial')
                  break
              }
              break
            case 'physical':
              switch (fieldKey) {
                case 'form':
                  updates.form = String(value)
                  break
                case 'mesh_size':
                  updates.meshSize = String(value)
                  newVisibleFields.add('meshSize')
                  break
                case 'odor':
                  updates.odor = String(value)
                  newVisibleFields.add('odor')
                  break
                case 'taste':
                  updates.taste = String(value)
                  newVisibleFields.add('taste')
                  break
                case 'solubility_water':
                  updates.solubility = String(value)
                  newVisibleFields.add('solubility')
                  break
                case 'particle_size_range':
                  updates.particleSize = String(value)
                  newVisibleFields.add('particleSize')
                  break
                case 'bulk_density':
                  if (value) {
                    updates.bulkDensity = parseFloat(String(value))
                    newVisibleFields.add('bulkDensity')
                  }
                  break
              }
              break
            case 'chemical':
              switch (fieldKey) {
                case 'assay_min':
                  if (value) {
                    updates.assay = parseFloat(String(value))
                    newVisibleFields.add('assay')
                  }
                  break
                case 'moisture_max':
                  if (value) {
                    updates.moisture = parseFloat(String(value))
                    newVisibleFields.add('moisture')
                  }
                  break
                case 'ash_max':
                  if (value) {
                    updates.ashContent = parseFloat(String(value))
                    newVisibleFields.add('ashContent')
                  }
                  break
                case 'ph_value':
                  updates.ph = String(value)
                  newVisibleFields.add('ph')
                  break
                case 'lead_max':
                  if (value) {
                    updates.lead = parseFloat(String(value))
                    newVisibleFields.add('lead')
                  }
                  break
                case 'arsenic_max':
                  if (value) {
                    updates.arsenic = parseFloat(String(value))
                    newVisibleFields.add('arsenic')
                  }
                  break
                case 'cadmium_max':
                  if (value) {
                    updates.cadmium = parseFloat(String(value))
                    newVisibleFields.add('cadmium')
                  }
                  break
                case 'mercury_max':
                  if (value) {
                    updates.mercury = parseFloat(String(value))
                    newVisibleFields.add('mercury')
                  }
                  break
                case 'pesticide_residue':
                  updates.pesticideResidue = String(value)
                  newVisibleFields.add('pesticideResidue')
                  break
                case 'aflatoxins_max':
                  if (value) {
                    updates.aflatoxins = parseFloat(String(value))
                    newVisibleFields.add('aflatoxins')
                  }
                  break
                case 'residual_solvents':
                  updates.residualSolvents = String(value)
                  newVisibleFields.add('residualSolvents')
                  break
              }
              break
            case 'microbial':
              switch (fieldKey) {
                case 'total_plate_count_max':
                  if (value) {
                    updates.totalPlateCount = parseInt(String(value))
                    newVisibleFields.add('totalPlateCount')
                  }
                  break
                case 'yeast_mold_max':
                  if (value) {
                    updates.yeastMold = parseInt(String(value))
                    newVisibleFields.add('yeastMold')
                  }
                  break
                case 'e_coli':
                  updates.eColiPresence = String(value)
                  newVisibleFields.add('eColiPresence')
                  break
                case 'salmonella':
                  updates.salmonellaPresence = String(value)
                  newVisibleFields.add('salmonellaPresence')
                  break
                case 'staphylococcus_aureus':
                  updates.staphylococcusPresence = String(value)
                  newVisibleFields.add('staphylococcusPresence')
                  break
              }
              break
            case 'supplier':
              switch (fieldKey) {
                case 'manufacturer_name':
                  updates.manufacturerName = String(value)
                  break
              }
              break
            case 'commercial':
              switch (fieldKey) {
                case 'shelf_life_months':
                  if (value) {
                    updates.shelfLife = parseInt(String(value))
                    newVisibleFields.add('shelfLife')
                  }
                  break
                case 'storage_temperature':
                  updates.storageTemperature = String(value)
                  newVisibleFields.add('storageTemperature')
                  break
                case 'sample_availability':
                  updates.sampleAvailability = String(value)
                  newVisibleFields.add('sampleAvailability')
                  break
                case 'moq':
                  if (value) {
                    updates.moq = parseInt(String(value))
                    newVisibleFields.add('moq')
                  }
                  break
              }
              break
            case 'packaging':
              switch (fieldKey) {
                case 'packaging_type':
                  if (Array.isArray(value) && value.length > 0) {
                    updates.packagingType = value[0]
                  }
                  break
                case 'net_weight_per_package':
                  updates.netWeight = String(value)
                  break
                case 'gross_weight_per_package':
                  updates.grossWeight = String(value)
                  newVisibleFields.add('grossWeight')
                  break
                case 'packages_per_pallet':
                  if (value) {
                    updates.packagesPerPallet = parseInt(String(value))
                    newVisibleFields.add('packagesPerPallet')
                  }
                  break
              }
              break
            case 'allergen':
              switch (fieldKey) {
                case 'allergen_statement':
                  updates.allergenInfo = String(value)
                  newVisibleFields.add('allergenInfo')
                  break
              }
              break
            case 'compliance':
              switch (fieldKey) {
                case 'is_gmo':
                  updates.gmoStatus = value === 'Yes' ? 'Non-GMO' : value === 'No' ? 'GMO' : 'Unknown'
                  newVisibleFields.add('gmoStatus')
                  break
                case 'halal_certified':
                  updates.halalCertified = String(value)
                  newVisibleFields.add('halalCertified')
                  break
                case 'kosher_certified':
                  updates.kosherCertified = String(value)
                  newVisibleFields.add('kosherCertified')
                  break
                case 'organic_certification_body':
                  updates.organicCertificationBody = String(value)
                  newVisibleFields.add('organicCertificationBody')
                  break
                case 'specification_standard':
                  if (Array.isArray(value)) {
                    updates.certificates = value
                  }
                  break
              }
              break
          }
          return // Skip the flat key processing below
        }
        
        // Map flat API fields to form fields (for backward compatibility)
        switch (key) {
          case 'productName':
            updates.productName = String(value)
            break
          case 'casNumber':
            updates.casNumber = String(value)
            break
          case 'originCountry':
            updates.originCountry = String(value)
            break
          case 'manufacturerName':
            updates.manufacturerName = String(value)
            break
          case 'einecs':
            updates.einecs = String(value)
            break
          case 'fdaNumber':
            updates.fdaNumber = String(value)
            break
          case 'description':
            updates.description = String(value)
            break
          case 'category':
            updates.category = String(value)
            break
          case 'appearance':
            updates.appearance = String(value)
            break
          case 'odor':
            updates.odor = String(value)
            break
          case 'taste':
            updates.taste = String(value)
            break
          case 'form':
            updates.form = String(value)
            break
          case 'grade':
            updates.grade = String(value)
            break
          case 'solubility':
            updates.solubility = String(value)
            break
          case 'assay':
          case 'moisture':
          case 'ashContent':
          case 'bulkDensity':
          case 'lead':
          case 'arsenic':
          case 'cadmium':
          case 'mercury':
          case 'lossOnDrying':
            if (value) {
              updates[key] = parseFloat(String(value))
              newVisibleFields.add(key)
            }
            break
          case 'totalPlateCount':
          case 'yeastMold':
            if (value) {
              updates[key] = parseInt(String(value))
              newVisibleFields.add(key)
            }
            break
          case 'shelfLife':
            if (value) {
              updates.shelfLife = parseInt(String(value))
              newVisibleFields.add('shelfLife')
            }
            break
          case 'particleSize':
          case 'ph':
          case 'pesticideResidue':
            if (value) {
              updates[key] = String(value)
              newVisibleFields.add(key)
            }
            break
          case 'allergenInfo':
          case 'bseStatement':
            if (value) {
              updates[key] = String(value)
              newVisibleFields.add(key)
            }
            break
          case 'eColiPresence':
          case 'salmonellaPresence':
          case 'staphylococcusPresence':
            if (hasMeaningfulValue(value)) {
              updates[key] = String(value)
              newVisibleFields.add(key)
            }
            break
          case 'gmoStatus':
          case 'irradiationStatus':
            const statusValue = String(value)
            if (hasMeaningfulValue(statusValue) && statusValue.trim().toLowerCase() !== 'unknown') {
              updates[key] = statusValue
              newVisibleFields.add(key)
            }
            break
          case 'storageConditions':
            if (Array.isArray(value) && value.length > 0) {
              updates.storageConditions = value
              newVisibleFields.add('storageConditions')
            }
            break
          case 'applications':
          case 'certificates':
            if (Array.isArray(value)) {
              updates[key] = value
            }
            break
        }
      })

      setFormData((prev) => {
        const updatedData = { ...prev, ...updates }
        
        // Clean up visibleFields: remove fields that have empty/unknown values
        const cleanedVisibleFields = new Set<string>()
        newVisibleFields.forEach((fieldName) => {
          const fieldValue = updatedData[fieldName as keyof FoodSupplementProductData]
          if (hasMeaningfulValue(fieldValue)) {
            // Additional check for status fields
            if (fieldName === 'gmoStatus' || fieldName === 'irradiationStatus') {
              const strValue = String(fieldValue).trim().toLowerCase()
              if (strValue !== 'unknown') {
                cleanedVisibleFields.add(fieldName)
              }
            } else {
              cleanedVisibleFields.add(fieldName)
            }
          }
        })
        
        setVisibleTechnicalFields(cleanedVisibleFields)
        return updatedData
      })
      
      // Store grouped data for additional fields display
      if (mergedFields._grouped) {
        setExtractedGroupedData((prev: any) => ({
          ...prev,
          ...mergedFields._grouped
        }))
      }
      
      toast.success(`Successfully merged data from ${completedFiles.length} file(s)`, { icon: '✨' })
    } catch (error) {
      console.error('Error applying all fields:', error)
      toast.error('Failed to apply all fields')
    }
  }, [uploadedFiles, formData, visibleTechnicalFields])

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success('Product saved as draft')
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.productName.trim()) {
      toast.error('Product name is required')
      return
    }
    if (!formData.originCountry) {
      toast.error('Origin country is required')
      return
    }
    if (formData.priceTiers.length === 0 || formData.priceTiers[0].moq === 0) {
      toast.error('At least one pricing tier is required')
      return
    }

    setIsPublishing(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success('Product published successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error publishing product:', error)
      toast.error('Failed to publish product')
    } finally {
      setIsPublishing(false)
    }
  }

  const completedFilesCount = uploadedFiles.filter((f) => f.displayStatus === 'completed').length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/dashboard/products')}
                disabled={isSaving || isPublishing}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">Upload Product</h1>
                <p className="text-sm text-muted-foreground">
                  Food Supplement & Ingredients
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary hidden sm:inline">
                AI Assisted
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Right: File Upload Panel (first on mobile, second on desktop) */}
          <div className="order-1 lg:order-2 lg:border-l border-border/30 lg:pl-6">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:flex lg:flex-col lg:overflow-hidden">
              <FileUploadPanel
                files={uploadedFiles}
                onFilesUpload={handleFilesUpload}
                onFileDelete={handleFileDelete}
                onApplyFields={handleApplyFields}
                onApplyAll={handleApplyAll}
                isProcessing={isSaving || isPublishing}
              />
            </div>
          </div>

          {/* Left: Product Form (second on mobile, first on desktop) */}
          <div className="order-2 lg:order-1">
            <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="px-1 pr-6 pb-4">
                <FoodSupplementForm
                  formData={formData}
                  onChange={handleFormChange}
                  visibleTechnicalFields={cleanedVisibleFields}
                  onAddFields={handleAddFields}
                />
                
                {/* Additional Extracted Fields */}
                {Object.keys(extractedGroupedData).length > 0 && (
                  <ExtractedFieldsDisplay
                    groupedData={extractedGroupedData}
                    onFieldUpdate={handleGroupedFieldUpdate}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Fixed Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="text-sm text-muted-foreground">
              {completedFilesCount > 0 && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {completedFilesCount} file(s) processed
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSaving || isPublishing}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isSaving || isPublishing || !formData.productName}
                className={cn(
                  'w-full sm:w-auto',
                  'bg-primary hover:bg-primary-dark text-primary-foreground'
                )}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Publish Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>

      {/* Spacer for fixed footer */}
      <div className="h-20" />
    </div>
  )
}
