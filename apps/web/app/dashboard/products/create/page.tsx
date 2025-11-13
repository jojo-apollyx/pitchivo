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
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Save, Sparkles, Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileUploadPanel, type FileWithExtraction } from '@/components/products/FileUploadPanel'
import { FoodSupplementForm } from '@/components/products/industries/food-supplement/FoodSupplementForm'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { cn } from '@/lib/utils'
import { useProduct } from '@/lib/api/products'
import { productPublishSchema, validateProductForPublish } from './validation'

const initialFormData: FoodSupplementProductData & { inventoryLocation?: any[] } = {
  // Core Product Information
  product_images: [],
  product_name: '',
  origin_country: '',
  manufacturer_name: '',
  cas_number: '',
  fda_number: '',
  einecs: '',
  description: '',
  category: '',
  applications: [],
  form: '',
  grade: '',
  
  // Origin & Source
  botanical_name: '',
  extraction_ratio: '',
  carrier_material: '',
  
  // Physical & Sensory Properties
  appearance: '',
  odor: '',
  taste: '',
  solubility: '',
  particle_size: '',
  mesh_size: '',
  bulk_density: '',
  
  // Chemical Analysis
  assay: '',
  ph: '',
  moisture: '',
  ash_content: '',
  loss_on_drying: '',
  residual_solvents: '',
  
  // Heavy Metals
  lead: '',
  arsenic: '',
  cadmium: '',
  mercury: '',
  
  // Contaminants
  pesticide_residue: '',
  aflatoxins: '',
  
  // Microbiological
  total_plate_count: '',
  yeast_mold: '',
  e_coli_presence: '',
  salmonella_presence: '',
  staphylococcus_presence: '',
  
  // Pricing & MOQ
  price_lead_time: [],
  
  // Packaging & Logistics
  packaging_type: '',
  net_weight: '',
  gross_weight: '',
  packages_per_pallet: '',
  shelf_life: '',
  storage_conditions: [],
  storage_temperature: '',
  payment_terms: '',
  incoterm: '',
  
  // Sample Options
  samples: [],
  
  // Certificates & Compliance
  certificates: [],
  allergen_info: [],
  gmo_status: '',
  irradiation_status: '',
  bse_statement: '',
  halal_certified: '',
  kosher_certified: '',
  organic_certification_body: '',
  
  // Inventory Locations (use camelCase in frontend, map to snake_case when saving)
  inventoryLocation: [] as any,
  
  // File Attachments
  certificate_files: [],
  coa_file: '',
  tds_file: '',
  msds_file: '',
  spec_sheet: '',
  other_files: [],
}

export default function CreateProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlProductId = searchParams.get('productId')
  const [formData, setFormData] = useState<FoodSupplementProductData>(initialFormData)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithExtraction[]>([])
  const [productId, setProductId] = useState<string | null>(urlProductId) // Track product ID for updates
  
  // Load product data if editing
  const { data: productData, isLoading: isLoadingProduct } = useProduct(urlProductId || '')
  
  // Helper to check if a value is meaningful (not empty, null, undefined, or "Unknown")
  const hasMeaningfulValue = (value: any): boolean => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string' && value.trim() === '') return false
    if (typeof value === 'string' && value.trim().toLowerCase() === 'unknown') return false
    return true
  }

  // Load product data into form when product is fetched
  useEffect(() => {
    if (productData && productData.product_data) {
      const productDataObj = typeof productData.product_data === 'string' 
        ? JSON.parse(productData.product_data) 
        : productData.product_data
      
      // Merge product data into form
      setFormData((prev) => ({
        ...prev,
        ...productDataObj,
        // Override with extracted columns if they exist
        product_name: productData.product_name || prev.product_name,
        origin_country: productData.origin_country || prev.origin_country,
        manufacturer_name: productData.manufacturer_name || prev.manufacturer_name,
        category: productData.category || prev.category,
        form: productData.form || prev.form,
        grade: productData.grade || prev.grade,
        applications: productData.applications || prev.applications,
        // Map inventory_locations (snake_case from DB) to inventoryLocation (camelCase for frontend)
        inventoryLocation: (productDataObj.inventory_locations || productDataObj.inventoryLocation || []) as any,
      }))
      
      setProductId(productData.product_id)
      
      // Show visible technical fields that have values
      const newVisibleFields = new Set<string>()
      const technicalFields = [
        'appearance', 'odor', 'taste', 'solubility', 'mesh_size', 'bulk_density',
        'assay', 'ph', 'moisture', 'ash_content', 'loss_on_drying', 'residual_solvents',
        'lead', 'arsenic', 'cadmium', 'mercury', 'pesticide_residue', 'aflatoxins',
        'total_plate_count', 'yeast_mold', 'e_coli_presence', 'salmonella_presence',
        'staphylococcus_presence', 'botanical_name', 'extraction_ratio', 'carrier_material',
        'particle_size', 'einecs', 'fda_number', 'allergen_info',
        'gmo_status', 'irradiation_status', 'bse_statement'
      ]
      
      technicalFields.forEach((field) => {
        const value = productDataObj[field]
        if (hasMeaningfulValue(value)) {
          newVisibleFields.add(field)
        }
      })
      
      setVisibleTechnicalFields(newVisibleFields)
    }
  }, [productData])

  // Helper to deduplicate files by extraction.id
  const deduplicateFiles = (files: FileWithExtraction[]): FileWithExtraction[] => {
    const seen = new Map<string, FileWithExtraction>()
    for (const file of files) {
      const id = file.extraction.id
      if (!seen.has(id)) {
        seen.set(id, file)
      }
    }
    return Array.from(seen.values())
  }
  const [visibleTechnicalFields, setVisibleTechnicalFields] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [extractedGroupedData, setExtractedGroupedData] = useState<any>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // React Hook Form for validation
  const {
    trigger,
    setValue,
    formState: { errors: rhfErrors },
  } = useForm<FoodSupplementProductData>({
    resolver: zodResolver(productPublishSchema),
    mode: 'onChange',
    defaultValues: formData,
  })

  // Sync formData with React Hook Form when it changes
  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      setValue(key as keyof FoodSupplementProductData, value as any, { shouldValidate: false })
    })
  }, [formData, setValue])

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
    // Filter out duplicates before adding (by extraction.id)
    setUploadedFiles((prev) => {
      const existingIds = new Set(prev.map(f => f.extraction.id))
      const newFiles = tempFiles.filter(f => !existingIds.has(f.extraction.id))
      const combined = [...prev, ...newFiles]
      // Safety check: deduplicate in case of any edge cases
      return deduplicateFiles(combined)
    })

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
          // Check if a file with this extraction.id already exists (duplicate upload)
          setUploadedFiles((prev) => {
            const existingFile = prev.find(f => f.extraction.id === extraction.id && f.extraction.id !== tempFile.extraction.id)
            if (existingFile) {
              // File already exists with this ID, remove the temp entry
              return prev.filter(f => f.extraction.id !== tempFile.extraction.id)
            }
            // Update temp entry with real extraction
            return prev.map((f) =>
              f.extraction.id === tempFile.extraction.id
                ? { extraction, displayStatus: 'analyzing' as const }
                : f
            )
          })
        }

        // Trigger AI extraction
        const extractResponse = await fetch('/api/documents/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: extraction.id }),
        })

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json().catch(() => ({ error: 'Extraction failed' }))
          const errorMessage = errorData.error || errorData.details || `Extraction failed with status ${extractResponse.status}`
          
          // Update UI with error state immediately
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === extraction.id
                ? {
                    ...f,
                    displayStatus: 'error' as const,
                    extraction: {
                      ...f.extraction,
                      analysis_status: 'failed',
                      error_message: errorMessage,
                    },
                  }
                : f
            )
          )
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

        // Update file when extraction completes - handle duplicates
        setUploadedFiles((prev) => {
          // Find all entries with this extraction ID (could be duplicates from multiple uploads)
          const matchingFiles = prev.filter(f => f.extraction.id === extraction.id)
          
          if (matchingFiles.length > 1) {
            // Remove duplicates, keep only the first one and update it
            const firstMatch = matchingFiles[0]
            return prev
              .filter(f => f.extraction.id !== extraction.id || f === firstMatch)
              .map((f) =>
                f.extraction.id === extraction.id && f === firstMatch
                  ? { extraction: completedExtraction, displayStatus: 'completed' as const }
                  : f
              )
          }
          
          // Single match, just update it
          return prev.map((f) =>
            f.extraction.id === extraction.id
              ? { extraction: completedExtraction, displayStatus: 'completed' as const }
              : f
          )
        })

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
    // Cache the file before deletion so we can restore it if deletion fails
    const fileToDelete = uploadedFiles.find((f) => f.extraction.id === fileId)
    if (!fileToDelete) {
      toast.error('File not found')
      return
    }

    try {
      // Optimistically remove from UI immediately for better UX
      setUploadedFiles((prev) => prev.filter((f) => f.extraction.id !== fileId))
      
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.details || 'Delete failed'
        
        // Restore the file to UI if deletion failed
        setUploadedFiles((prev) => {
          // Check if file is already in the list (avoid duplicates)
          if (prev.find((f) => f.extraction.id === fileId)) {
            return prev
          }
          return [...prev, fileToDelete]
        })
        
        throw new Error(errorMessage)
      }

      // Success - show appropriate message
      const successMessage = responseData.message || 'File deleted successfully'
      toast.success(successMessage)
    } catch (error) {
      console.error('Error deleting file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file'
      toast.error(errorMessage)
    }
  }, [uploadedFiles])

  const handleRetryExtraction = useCallback(async (fileId: string) => {
    const file = uploadedFiles.find((f) => f.extraction.id === fileId)
    if (!file) return

    try {
      // Update UI to show retrying
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.extraction.id === fileId
            ? {
                ...f,
                displayStatus: 'analyzing' as const,
                extraction: {
                  ...f.extraction,
                  analysis_status: 'analyzing' as const,
                  error_message: null,
                },
              }
            : f
        )
      )

      // Trigger extraction again
      const extractResponse = await fetch('/api/documents/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json().catch(() => ({ error: 'Extraction failed' }))
        const errorMessage = errorData.error || errorData.details || `Extraction failed with status ${extractResponse.status}`
        
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.id === fileId
              ? {
                  ...f,
                  displayStatus: 'error' as const,
                  extraction: {
                    ...f.extraction,
                    analysis_status: 'failed',
                    error_message: errorMessage,
                  },
                }
              : f
          )
        )
        toast.error(`Retry failed: ${errorMessage}`)
        return
      }

      // Parse response
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
          f.extraction.id === fileId
            ? { extraction: completedExtraction, displayStatus: 'completed' as const }
            : f
        )
      )

      const fieldCount = completedExtraction.extracted_values
        ? Object.keys(completedExtraction.extracted_values).filter(
            (k) => completedExtraction.extracted_values![k] !== null && k !== '_grouped'
          ).length
        : 0

      toast.success(`Extracted ${fieldCount} fields (retry successful)`, { icon: '✨' })
    } catch (error) {
      console.error('Error retrying extraction:', error)
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.extraction.id === fileId
            ? {
                ...f,
                displayStatus: 'error' as const,
                extraction: {
                  ...f.extraction,
                  error_message: error instanceof Error ? error.message : 'Retry failed',
                },
              }
            : f
        )
      )
      toast.error(`Retry failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [uploadedFiles])

  const handleApplyFields = useCallback(
    async (fileId: string, fields: Record<string, any>) => {
      try {
        // Get the file and its extracted values
        const file = uploadedFiles.find((f) => f.extraction.id === fileId)
        if (!file) {
          throw new Error('File not found')
        }

        // Parse extracted values
        let extractedData: any = {}
        try {
          const extracted = file.extraction.extracted_values || {}
          extractedData = typeof extracted === 'string' ? JSON.parse(extracted) : extracted
        } catch (e) {
          // Ignore parse errors
        }

        // Merge user-selected/modified fields with all extracted values
        // This ensures we save ALL extracted values as reviewed, with user modifications applied
        const reviewedValues = { ...extractedData, ...fields }

        // Always save reviewed values when applying (mark as reviewed)
        const reviewResponse = await fetch('/api/documents/review', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId, reviewedValues }),
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

        // Use AI to merge new fields with existing form data
        toast.info('Merging data intelligently...', { icon: '🤖' })
        
        // Always include document_type and summary from original extraction for merge inference
        // This is needed for the AI to infer certificates (e.g., Prop65_Statement → California Prop 65 Compliant)
        const fieldsForMerge = { ...fields }
        if (file?.extraction.extracted_values) {
          try {
            const extractedData = typeof file.extraction.extracted_values === 'string'
              ? JSON.parse(file.extraction.extracted_values)
              : file.extraction.extracted_values
            if (extractedData.document_type && !fieldsForMerge.document_type) {
              fieldsForMerge.document_type = extractedData.document_type
            }
            if (extractedData.summary && !fieldsForMerge.summary) {
              fieldsForMerge.summary = extractedData.summary
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
        
        const mergeResponse = await fetch('/api/documents/merge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentData: formData,
            newFields: fieldsForMerge,
          }),
        })

        if (!mergeResponse.ok) {
          throw new Error('Failed to merge data')
        }

        const mergeData = await mergeResponse.json()
        const mergedFields = mergeData.mergedData

        // Apply merged fields to form (snake_case data from merge API)
        const updates: Partial<FoodSupplementProductData> = {}
        const newVisibleFields = new Set<string>(visibleTechnicalFields)

        // Directly apply snake_case merged data
        // The merge API now returns snake_case fields matching PRODUCT_FIELDS
        Object.entries(mergedFields).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            // Apply the field directly (already in snake_case)
            (updates as any)[key] = value
            
            // Add technical fields to visible set
            const technicalFields = [
              'appearance', 'odor', 'taste', 'solubility', 'mesh_size', 'bulk_density',
              'assay', 'ph', 'moisture', 'ash_content', 'loss_on_drying', 'residual_solvents',
              'lead', 'arsenic', 'cadmium', 'mercury', 'pesticide_residue', 'aflatoxins',
              'total_plate_count', 'yeast_mold', 'e_coli_presence', 'salmonella_presence',
              'staphylococcus_presence', 'botanical_name', 'extraction_ratio', 'carrier_material',
              'particle_size', 'einecs', 'fda_number', 'allergen_info',
              'gmo_status', 'irradiation_status', 'bse_statement'
            ]
            
            if (technicalFields.includes(key)) {
              newVisibleFields.add(key)
            }
          }
        })

        // Apply updates to form data
        setFormData((prev) => {
          const updatedData = { ...prev, ...updates }
          
          // Clean up visibleFields: remove fields that have empty/unknown values
          const cleanedVisibleFields = new Set<string>()
          newVisibleFields.forEach((fieldName) => {
            const fieldValue = updatedData[fieldName as keyof FoodSupplementProductData]
            if (hasMeaningfulValue(fieldValue)) {
              cleanedVisibleFields.add(fieldName)
            }
          })
          
          setVisibleTechnicalFields(cleanedVisibleFields)
          return updatedData
        })
        
        toast.success('Fields merged and applied successfully', { icon: '✨' })
      } catch (error) {
        console.error('Error applying fields:', error)
        toast.error('Failed to apply fields')
      }
    },
    [formData, uploadedFiles, visibleTechnicalFields, hasMeaningfulValue]
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

      toast.info('Merging data from all documents...', { icon: '🤖' })

      // First, mark all files as reviewed by saving their extracted values to reviewed_values
      const reviewResults = await Promise.allSettled(
        completedFiles.map(async (f) => {
          // Skip if already reviewed
          if (f.extraction.review_status === 'reviewed') {
            return { fileId: f.extraction.id, extraction: f.extraction }
          }

          const extracted = f.extraction.extracted_values || {}
          let extractedData: any = {}
          try {
            extractedData = typeof extracted === 'string' ? JSON.parse(extracted) : extracted
          } catch (e) {
            // Ignore parse errors
          }

          // Save all extracted values as reviewed values
          const reviewResponse = await fetch('/api/documents/review', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: f.extraction.id, reviewedValues: extractedData }),
          })

          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json()
            return { fileId: f.extraction.id, extraction: reviewData.extraction }
          }
          return { fileId: f.extraction.id, extraction: f.extraction }
        })
      )

      // Update local state with all reviewed files in one batch and collect updated files
      const updatedFilesMap = new Map<string, any>()
      reviewResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          updatedFilesMap.set(result.value.fileId, result.value.extraction)
        }
      })

      setUploadedFiles((prev) => {
        return prev.map((file) => {
          const update = updatedFilesMap.get(file.extraction.id)
          if (update) {
            return {
              ...file,
              extraction: {
                ...file.extraction,
                ...update,
                review_status: 'reviewed' as const
              }
            }
          }
          return file
        })
      })

      // Collect all extracted data and merge into single object
      // Use updated reviewed_values if available, otherwise use extracted_values
      const allExtractedData = completedFiles.map((f) => {
        // Check if we have updated reviewed values from the save operation
        const updatedExtraction = updatedFilesMap.get(f.extraction.id)
        const reviewed = updatedExtraction?.reviewed_values || f.extraction.reviewed_values || {}
        const extracted = f.extraction.extracted_values || {}
        
        // Parse if strings
        let reviewedData: any = {}
        let extractedData: any = {}
        try {
          reviewedData = typeof reviewed === 'string' ? JSON.parse(reviewed) : reviewed
          extractedData = typeof extracted === 'string' ? JSON.parse(extracted) : extracted
        } catch (e) {
          // Ignore parse errors
        }
        
        // Use reviewed values if available, otherwise use extracted values
        // Always ensure document_type and summary are included
        const hasReviewedData = reviewedData && Object.keys(reviewedData).length > 0
        const combined = hasReviewedData ? { ...reviewedData } : { ...extractedData }
        
        // Always ensure document_type and summary are included from extracted data
        if (extractedData.document_type && !combined.document_type) {
          combined.document_type = extractedData.document_type
        }
        if (extractedData.summary && !combined.summary) {
          combined.summary = extractedData.summary
        }
        
        return combined
      })

      // Combine all extracted data into a single object for merging
      // Use intelligent merging: prefer more complete values, merge arrays, combine strings
      const combinedFields: Record<string, any> = {}
      allExtractedData.forEach((data: any) => {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
              // Merge arrays and deduplicate
              if (!combinedFields[key]) {
                combinedFields[key] = []
              }
              if (Array.isArray(combinedFields[key])) {
                combinedFields[key] = [...new Set([...combinedFields[key], ...value])]
              } else {
                combinedFields[key] = value
              }
            } else if (typeof value === 'string' && typeof combinedFields[key] === 'string') {
              // If both are strings, prefer the longer/more complete one
              if (value.length > combinedFields[key].length) {
                combinedFields[key] = value
              }
            } else if (!combinedFields[key]) {
              // Set value if not already present
              combinedFields[key] = value
            } else if (typeof value === 'object' && typeof combinedFields[key] === 'object') {
              // For objects, merge them (though this shouldn't happen often)
              combinedFields[key] = { ...combinedFields[key], ...value }
            }
          }
        })
      })

      // Use merge API to intelligently combine with current form data
      const mergeResponse = await fetch('/api/documents/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentData: formData,
          newFields: combinedFields,
        }),
      })

      if (!mergeResponse.ok) {
        throw new Error('Failed to merge documents')
      }

      const mergeData = await mergeResponse.json()
      const mergedFields = mergeData.mergedData

      // Apply merged fields (snake_case from API)
      const updates: Partial<FoodSupplementProductData> = {}
      const newVisibleFields = new Set<string>(visibleTechnicalFields)

      Object.entries(mergedFields).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          (updates as any)[key] = value
          
          // Add technical fields to visible set
          const technicalFields = [
            'appearance', 'odor', 'taste', 'solubility', 'mesh_size', 'bulk_density',
            'assay', 'ph', 'moisture', 'ash_content', 'loss_on_drying', 'residual_solvents',
            'lead', 'arsenic', 'cadmium', 'mercury', 'pesticide_residue', 'aflatoxins',
            'total_plate_count', 'yeast_mold', 'e_coli_presence', 'salmonella_presence',
            'staphylococcus_presence', 'botanical_name', 'extraction_ratio', 'carrier_material',
            'particle_size', 'einecs', 'fda_number', 'allergen_info',
            'gmo_status', 'irradiation_status', 'bse_statement'
          ]
          
          if (technicalFields.includes(key)) {
            newVisibleFields.add(key)
          }
        }
      })

      // Apply updates
      setFormData((prev) => {
        const updatedData = { ...prev, ...updates }
        
        const cleanedVisibleFields = new Set<string>()
        newVisibleFields.forEach((fieldName) => {
          const fieldValue = updatedData[fieldName as keyof FoodSupplementProductData]
          if (hasMeaningfulValue(fieldValue)) {
            cleanedVisibleFields.add(fieldName)
          }
        })
        
        setVisibleTechnicalFields(cleanedVisibleFields)
        return updatedData
      })
      
      toast.success(`Successfully merged data from ${completedFiles.length} file(s)`, { icon: '✨' })
    } catch (error) {
      console.error('Error applying all fields:', error)
      toast.error('Failed to apply all fields')
    }
  }, [uploadedFiles, formData, visibleTechnicalFields, hasMeaningfulValue])

  const handleSaveDraft = async () => {
    setIsSaving(true)
    try {
      // Prepare product data for save - map camelCase to snake_case for database
      const productDataForSave = {
        ...formData,
        // Map inventoryLocation (camelCase) to inventory_locations (snake_case)
        inventory_locations: (formData as any).inventoryLocation || formData.inventory_locations || [],
      }
      // Remove camelCase version if it exists
      if ((productDataForSave as any).inventoryLocation) {
        delete (productDataForSave as any).inventoryLocation
      }
      
      const productData = {
        product_name: formData.product_name || 'Untitled Product',
        origin_country: formData.origin_country || null,
        manufacturer_name: formData.manufacturer_name || null,
        category: formData.category || null,
        form: formData.form || null,
        grade: formData.grade || null,
        applications: formData.applications || null,
        product_data: productDataForSave, // Full data in JSONB (with snake_case)
        status: 'draft' as const,
        industry_code: 'food_supplement',
      }

      let response
      if (productId) {
        // Update existing product
        response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            ...productData,
          }),
        })
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Save failed' }))
        const errorMessage = errorData.error || errorData.details || `Save failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Store product_id for future updates
      if (result.product?.product_id) {
        setProductId(result.product.product_id)
      }

      toast.success('Product saved as draft')
    } catch (error) {
      console.error('Error saving draft:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save draft'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    // Validate using Zod schema (pass uploadedFiles for document validation)
    const validation = validateProductForPublish(formData, uploadedFiles)
    
    if (!validation.isValid) {
      setFormErrors(validation.errors)
      
      // Show first error in toast
      const firstError = Object.values(validation.errors)[0]
      if (firstError) {
        toast.error(firstError)
      }
      
      // Trigger React Hook Form validation to show field errors
      await trigger()
      
      // Scroll to first error field
      const firstErrorField = Object.keys(validation.errors)[0]
      if (firstErrorField) {
        // Try multiple selectors to find the field
        const selectors = [
          `[name="${firstErrorField}"]`,
          `[id="${firstErrorField}"]`,
          `#${firstErrorField}`,
        ]
        
        let element: Element | null = null
        for (const selector of selectors) {
          element = document.querySelector(selector)
          if (element) break
        }
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Focus the element if it's an input
          if (element instanceof HTMLElement && 'focus' in element) {
            setTimeout(() => (element as HTMLElement).focus(), 300)
          }
        }
      }
      
      return
    }

    // Clear errors if validation passes
    setFormErrors({})

    setIsPublishing(true)
    try {
      // Prepare product data for save - map camelCase to snake_case for database
      const productDataForSave = {
        ...formData,
        // Map inventoryLocation (camelCase) to inventory_locations (snake_case)
        inventory_locations: (formData as any).inventoryLocation || formData.inventory_locations || [],
      }
      // Remove camelCase version if it exists
      if ((productDataForSave as any).inventoryLocation) {
        delete (productDataForSave as any).inventoryLocation
      }
      
      // Prepare product data for save
      const productData = {
        product_name: formData.product_name,
        origin_country: formData.origin_country,
        manufacturer_name: formData.manufacturer_name,
        category: formData.category,
        form: formData.form,
        grade: formData.grade,
        applications: formData.applications,
        product_data: productDataForSave, // Full data in JSONB (with snake_case)
        status: 'published' as const,
        industry_code: 'food_supplement',
      }

      let response
      if (productId) {
        // Update existing product
        response = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: productId,
            ...productData,
          }),
        })
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Publish failed' }))
        const errorMessage = errorData.error || errorData.details || `Publish failed with status ${response.status}`
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      // Store product_id if this was a new product
      if (result.product?.product_id) {
        setProductId(result.product.product_id)
      }

      toast.success('Product published successfully!')
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error publishing product:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish product'
      toast.error(errorMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  const completedFilesCount = uploadedFiles.filter((f) => f.displayStatus === 'completed').length

  // Show loading state when loading product data
  if (isLoadingProduct && urlProductId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading product data...</p>
        </div>
      </div>
    )
  }

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
                onRetryExtraction={handleRetryExtraction}
                onApplyFields={handleApplyFields}
                onApplyAll={handleApplyAll}
                isProcessing={isSaving || isPublishing}
              />
              {formErrors.documents && (
                <p className="text-xs text-destructive mt-2 px-2">{formErrors.documents}</p>
              )}
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
                  errors={formErrors}
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
                className="w-full sm:w-auto">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!formData.product_name || isSaving || isPublishing}
                className="w-full sm:w-auto">
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Publish Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Placeholder component for additional extracted fields
function ExtractedFieldsDisplay({
  groupedData,
  onFieldUpdate,
}: {
  groupedData: any
  onFieldUpdate: (group: string, field: string, value: any) => void
}) {
  return null // Currently not displaying additional fields
}
