'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload as UploadIcon, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileUploadPanel, type UploadedFile, type ExtractedField } from '@/components/products/FileUploadPanel'
import { FoodSupplementForm } from '@/components/products/industries/food-supplement/FoodSupplementForm'
import type { FoodSupplementProductData, PriceTier } from '@/components/products/industries/food-supplement/types'
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showTechnicalData, setShowTechnicalData] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [fieldSources, setFieldSources] = useState<Record<string, string>>({})

  const handleFormChange = useCallback((updates: Partial<FoodSupplementProductData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const handleFilesUpload = useCallback(async (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file) => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading' as const,
      progress: 0,
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])

    for (const newFile of newFiles) {
      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === newFile.id ? { ...f, progress } : f))
          )
        }

        // Change to analyzing status
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === newFile.id ? { ...f, status: 'analyzing' } : f))
        )

        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Simulate AI extraction
        const mockExtractedFields: ExtractedField[] = [
          { fieldName: 'productName', value: 'Ascorbic Acid 99%', confidence: 0.98, section: 'basic' },
          { fieldName: 'casNumber', value: '50-81-7', confidence: 0.95, section: 'basic' },
          { fieldName: 'assay', value: '99.5', confidence: 0.92, section: 'technical' },
          { fieldName: 'moisture', value: '0.5', confidence: 0.88, section: 'technical' },
          { fieldName: 'lead', value: '0.5', confidence: 0.85, section: 'technical' },
          { fieldName: 'originCountry', value: 'China', confidence: 0.93, section: 'basic' },
          { fieldName: 'manufacturerName', value: 'ABC Pharma', confidence: 0.90, section: 'basic' },
          { fieldName: 'shelfLife', value: '24', confidence: 0.87, section: 'packaging' },
        ]

        let documentType = 'Other'
        if (newFile.name.toLowerCase().includes('coa')) documentType = 'COA'
        else if (newFile.name.toLowerCase().includes('tds')) documentType = 'TDS'
        else if (newFile.name.toLowerCase().includes('msds')) documentType = 'MSDS'
        else if (newFile.name.toLowerCase().includes('spec')) documentType = 'Specification Sheet'

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? {
                  ...f,
                  status: 'completed',
                  extractedFields: mockExtractedFields,
                  documentType,
                }
              : f
          )
        )

        const hasTechnicalData = mockExtractedFields.some((field) => field.section === 'technical')
        if (hasTechnicalData) {
          setShowTechnicalData(true)
        }

        toast.success(`Extracted ${mockExtractedFields.length} fields from ${newFile.name}`, {
          icon: '✨',
        })
      } catch (error) {
        console.error('Error processing file:', error)
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === newFile.id
              ? { ...f, status: 'error', error: 'Failed to process file' }
              : f
          )
        )
        toast.error(`Failed to process ${newFile.name}`)
      }
    }
  }, [])

  const handleFileDelete = useCallback(
    (fileId: string) => {
      const file = uploadedFiles.find((f) => f.id === fileId)
      if (!file) return

      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))

      const fieldsToRemove = Object.entries(fieldSources)
        .filter(([_, source]) => source === fileId)
        .map(([field, _]) => field)

      if (fieldsToRemove.length > 0) {
        const updates: Partial<FoodSupplementProductData> = {}
        fieldsToRemove.forEach((field) => {
          ;(updates as any)[field] = null
        })
        setFormData((prev) => ({ ...prev, ...updates }))

        setFieldSources((prev) => {
          const newSources = { ...prev }
          fieldsToRemove.forEach((field) => delete newSources[field])
          return newSources
        })

        toast.info(`Removed ${fieldsToRemove.length} fields linked to deleted file`)
      }

      toast.success('File deleted')
    },
    [uploadedFiles, fieldSources]
  )

  const handleFileReanalyze = useCallback(async (fileId: string) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'analyzing' } : f))
    )

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: 'completed' } : f))
    )

    toast.success('File re-analyzed successfully')
  }, [])

  const handleApplyFields = useCallback(
    (fileId: string, fields: ExtractedField[]) => {
      const updates: Partial<FoodSupplementProductData> = {}
      const newSources: Record<string, string> = {}

      fields.forEach((field) => {
        const fieldName = field.fieldName as keyof FoodSupplementProductData
        switch (fieldName) {
          case 'productName':
          case 'casNumber':
          case 'originCountry':
          case 'manufacturerName':
            updates[fieldName] = String(field.value)
            newSources[fieldName] = fileId
            break
          case 'assay':
          case 'moisture':
          case 'lead':
          case 'arsenic':
          case 'cadmium':
          case 'mercury':
          case 'ashContent':
          case 'bulkDensity':
          case 'lossOnDrying':
            updates[fieldName] = parseFloat(String(field.value))
            newSources[fieldName] = fileId
            setShowTechnicalData(true)
            break
          case 'shelfLife':
          case 'totalPlateCount':
          case 'yeastMold':
            updates[fieldName] = parseInt(String(field.value))
            newSources[fieldName] = fileId
            break
        }
      })

      setFormData((prev) => ({ ...prev, ...updates }))
      setFieldSources((prev) => ({ ...prev, ...newSources }))
    },
    []
  )

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

  const handleUpdateFromFiles = () => {
    uploadedFiles
      .filter((f) => f.status === 'completed' && f.extractedFields)
      .forEach((file) => {
        if (file.extractedFields) {
          handleApplyFields(file.id, file.extractedFields)
        }
      })
    toast.success('Form updated from all uploaded files')
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
          {/* Left: Product Form */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
              <div className="px-1 pr-6">
                <FoodSupplementForm
                  formData={formData}
                  onChange={handleFormChange}
                  showTechnicalData={showTechnicalData}
                />
              </div>
            </div>
          </div>

          {/* Right: File Upload Panel */}
          <div className="lg:border-l border-border/30 lg:pl-6 order-1 lg:order-2">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <FileUploadPanel
                files={uploadedFiles}
                onFilesUpload={handleFilesUpload}
                onFileDelete={handleFileDelete}
                onFileReanalyze={handleFileReanalyze}
                onApplyFields={handleApplyFields}
                isProcessing={isSaving || isPublishing}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Fixed Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="text-sm text-muted-foreground">
              {uploadedFiles.filter((f) => f.status === 'completed').length > 0 && (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {uploadedFiles.filter((f) => f.status === 'completed').length} file(s) processed
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
              {uploadedFiles.some((f) => f.status === 'completed') && (
                <Button
                  variant="secondary"
                  onClick={handleUpdateFromFiles}
                  disabled={isSaving || isPublishing}
                  className="w-full sm:w-auto"
                >
                  <UploadIcon className="h-4 w-4 mr-2" />
                  Update from Files
                </Button>
              )}
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
