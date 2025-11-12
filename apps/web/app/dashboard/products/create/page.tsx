'use client'

import { useState, useCallback, useEffect } from 'react'
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
  appearance: '',
  odor: '',
  taste: '',
  solubility: '',
  priceTiers: [
    { id: '1', moq: 0, price: 0, leadTime: 0 },
  ],
  packagingType: '',
  netWeight: '',
  paymentTerms: '',
  shelfLife: null,
  incoterm: '',
  storageConditions: [],
  provideSample: '',
  sampleType: '',
  samplePrice: null,
  sampleQuantity: null,
  sampleLeadTime: '',
  certificates: [],
  certificateFiles: [],
  certificateExpiryDate: '',
  allergenInfo: '',
  gmoStatus: '',
  irradiationStatus: '',
  bseStatement: '',
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
  totalPlateCount: null,
  yeastMold: null,
  eColiPresence: '',
  salmonellaPresence: '',
  staphylococcusPresence: '',
  pesticideResidue: '',
  ph: '',
  lossOnDrying: null,
}

export default function CreateProductPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FoodSupplementProductData>(initialFormData)
  const [uploadedFiles, setUploadedFiles] = useState<FileWithExtraction[]>([])
  const [showTechnicalData, setShowTechnicalData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [extractedGroupedData, setExtractedGroupedData] = useState<any>({})  

  const handleFormChange = useCallback((updates: Partial<FoodSupplementProductData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleFilesUpload = useCallback(async (files: File[]) => {
    for (const file of files) {
      try {
        // Create temporary file entry
        const tempFile: FileWithExtraction = {
          extraction: {
            id: `temp-${Date.now()}-${Math.random()}`,
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
          displayStatus: 'uploading',
          progress: 0,
        }

        setUploadedFiles((prev) => [...prev, tempFile])

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 150))
          setUploadedFiles((prev) =>
            prev.map((f) => (f.extraction.id === tempFile.extraction.id ? { ...f, progress } : f))
          )
        }

        // Upload file
        const formData = new FormData()
        formData.append('file', file)

        const uploadResponse = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }

        const uploadData = await uploadResponse.json()
        const extraction = uploadData.file

        // Update with real extraction data
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.id === tempFile.extraction.id
              ? { extraction, displayStatus: 'analyzing' as const }
              : f
          )
        )

        // If file already analyzed, skip extraction
        if (uploadData.isExisting && extraction.analysis_status === 'completed') {
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.extraction.id === tempFile.extraction.id
                ? { extraction, displayStatus: 'completed' as const }
                : f
            )
          )
          toast.success(`File already analyzed: ${file.name}`, { icon: '✨' })
          continue
        }

        // Trigger AI extraction
        const extractResponse = await fetch('/api/documents/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: extraction.id }),
        })

        if (!extractResponse.ok) {
          throw new Error('Extraction failed')
        }

        const extractData = await extractResponse.json()
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
              (k) => completedExtraction.extracted_values![k] !== null
            ).length
          : 0

        toast.success(`Extracted ${fieldCount} fields from ${file.name}`, { icon: '✨' })

        // Auto-show technical data if extracted
        if (
          completedExtraction.extracted_values?.assay ||
          completedExtraction.extracted_values?.moisture
        ) {
          setShowTechnicalData(true)
        }
      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.extraction.filename === file.name
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
        toast.error(`Failed to process ${file.name}`)
      }
    }
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
              f.extraction.id === fileId ? { ...f, extraction: reviewData.extraction } : f
            )
          )
        }

        // Apply fields to form
        const updates: Partial<FoodSupplementProductData> = {}

        Object.entries(fields).forEach(([key, value]) => {
          // Map API fields to form fields
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
                setShowTechnicalData(true)
              }
              break
            case 'totalPlateCount':
            case 'yeastMold':
              if (value) {
                updates[key] = parseInt(String(value))
              }
              break
            case 'shelfLife':
              if (value) {
                updates.shelfLife = parseInt(String(value))
              }
              break
            case 'particleSize':
            case 'ph':
            case 'allergenInfo':
            case 'bseStatement':
            case 'pesticideResidue':
            case 'packagingType':
            case 'netWeight':
              if (value) {
                updates[key] = String(value)
              }
              break
            case 'eColiPresence':
            case 'salmonellaPresence':
            case 'staphylococcusPresence':
            case 'gmoStatus':
            case 'irradiationStatus':
              if (value) {
                updates[key] = String(value)
              }
              break
            case 'storageConditions':
            case 'applications':
            case 'certificates':
              if (Array.isArray(value)) {
                updates[key] = value
              }
              break
          }
        })

        setFormData((prev) => ({ ...prev, ...updates }))
        
        // Store grouped data for additional fields display
        if (fields._grouped) {
          setExtractedGroupedData((prev: any) => ({
            ...prev,
            ...fields._grouped
          }))
        }
        
        toast.success('Fields applied to form successfully', { icon: '✨' })
      } catch (error) {
        console.error('Error applying fields:', error)
        toast.error('Failed to apply fields')
      }
    },
    [uploadedFiles]
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
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Right: File Upload Panel (first on mobile, second on desktop) */}
          <div className="order-1 lg:order-2 lg:border-l border-border/30 lg:pl-6">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)]">
              <FileUploadPanel
                files={uploadedFiles}
                onFilesUpload={handleFilesUpload}
                onFileDelete={handleFileDelete}
                onApplyFields={handleApplyFields}
                isProcessing={isSaving || isPublishing}
              />
            </div>
          </div>

          {/* Left: Product Form (second on mobile, first on desktop) */}
          <div className="order-2 lg:order-1">
            <div className="lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="px-1 pr-6">
                <FoodSupplementForm
                  formData={formData}
                  onChange={handleFormChange}
                  showTechnicalData={showTechnicalData}
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
      <div className="h-24" />
    </div>
  )
}
