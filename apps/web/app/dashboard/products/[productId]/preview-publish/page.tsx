'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Eye, Globe, Mail, CheckCircle2, Loader2, FileText, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useProduct } from '@/lib/api/products'
import { cn } from '@/lib/utils'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { ACCESS_LEVEL_CONFIG } from '@/lib/constants/access-levels'
import { PRODUCT_FIELDS } from '@/lib/industries/food-supplement/extraction-schema'
import { RealPagePreview } from '@/app/products/[slug]/RealPagePreview'
import { useQueryClient } from '@tanstack/react-query'

// Permission levels
type AccessLevel = 'public' | 'after_click' | 'after_rfq'
type FieldPermission = {
  [fieldName: string]: AccessLevel
}

// Permission Widget Component
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
          value === 'public'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">👀</span>
        <span className="hidden sm:inline">Basic</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_click')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          value === 'after_click'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">🔗</span>
        <span className="hidden sm:inline">More</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_rfq')}
        disabled={disabled}
        className={cn(
          'flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 sm:flex-initial',
          value === 'after_rfq'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="flex-shrink-0">✅</span>
        <span className="hidden sm:inline">All</span>
      </button>
    </div>
  )
}

// Field Display Component
function FieldDisplay({
  label,
  value,
  fieldName,
  permission,
  onPermissionChange,
}: {
  label: string
  value: any
  fieldName: string
  permission: AccessLevel
  onPermissionChange: (fieldName: string, level: AccessLevel) => void
}) {
  const displayValue = useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '-'
    if (Array.isArray(value)) return `${value.length} item(s)`
    if (typeof value === 'object') return 'Complex data'
    return String(value).slice(0, 100)
  }, [value])

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border/30">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-foreground mb-1">{label}</h3>
        <p className="text-sm text-muted-foreground truncate">{displayValue}</p>
      </div>
      <div className="flex-shrink-0">
        <PermissionWidget
          value={permission}
          onChange={(level) => onPermissionChange(fieldName, level)}
        />
      </div>
    </div>
  )
}

export default function PreviewPublishPageNew() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const [permissions, setPermissions] = useState<FieldPermission>({})
  const [previewStage, setPreviewStage] = useState<'public' | 'after_click' | 'after_rfq'>('public')
  const [isPublishing, setIsPublishing] = useState(false)
  const [documentMetadata, setDocumentMetadata] = useState<Record<string, any>>({})

  const permissionsInitialized = useRef(false)

  // Load product data
  const { data: productData, isLoading } = useProduct(productId)

  // Extract product form data
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // Initialize permissions and document metadata
  useEffect(() => {
    if (!formData || permissionsInitialized.current) return

    const formDataAny = formData as any

    if (formDataAny.field_permissions && typeof formDataAny.field_permissions === 'object') {
      setPermissions(formDataAny.field_permissions)
      permissionsInitialized.current = true
      return
    }

    // Default permissions
    const defaultPermissions: FieldPermission = {}
    const sensitiveFields = ['price_lead_time', 'samples', 'coa_file', 'tds_file', 'uploaded_files']
    // Core fields that must ALWAYS be public (not lockable)
    const alwaysPublicFields = ['product_name', 'category', 'description', 'product_images']

    Object.keys(formData).forEach((key) => {
      if (key.startsWith('_') || key === 'field_permissions' || key === 'channel_links') return

      const value = formData[key as keyof typeof formData]
      const hasValue = value !== null && value !== undefined && value !== '' &&
        (!Array.isArray(value) || value.length > 0)

      if (hasValue) {
        // Force core identity fields to always be public
        if (alwaysPublicFields.includes(key)) {
          defaultPermissions[key] = 'public'
        } else {
          defaultPermissions[key] = sensitiveFields.includes(key) ? 'after_rfq' : 'public'
        }
      }
    })

    setPermissions(defaultPermissions)
    permissionsInitialized.current = true
  }, [formData])

  // Fetch document metadata for uploaded files
  useEffect(() => {
    if (!formData) return
    
    const formDataAny = formData as any
    const uploadedFiles = formDataAny.uploaded_files || []
    
    if (uploadedFiles.length === 0) return

    const fileIds = uploadedFiles
      .map((f: any) => f.file_id)
      .filter((id: string) => id && !documentMetadata[id])

    if (fileIds.length === 0) return

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
  }, [formData])

  const handlePermissionChange = (fieldName: string, level: AccessLevel) => {
    // Prevent changing permissions on core identity fields
    const alwaysPublicFields = ['product_name', 'category', 'description', 'product_images']
    if (alwaysPublicFields.includes(fieldName)) {
      toast.error(`${fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} must always be public`)
      return
    }

    setPermissions((prev) => {
      const newPermissions = { ...prev, [fieldName]: level }
      // Auto-save permissions to database
      saveDraftWithPermissions(newPermissions)
      return newPermissions
    })
  }

  const saveDraftWithPermissions = async (updatedPermissions: FieldPermission) => {
    try {
      const updatedProductData = {
        ...formData,
        field_permissions: updatedPermissions,
      }

      await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          status: productData?.status || 'draft',
          product_data: updatedProductData,
        }),
      })
    } catch (error) {
      console.error('Error auto-saving permissions:', error)
    }
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
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
        throw new Error('Failed to publish product')
      }

      toast.success('Product published successfully!')
      // Invalidate and refetch products list
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      router.push('/dashboard/products')
    } catch (error) {
      console.error('Error publishing product:', error)
      toast.error('Failed to publish product')
    } finally {
      setIsPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!formData) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Product not found</p>
          <Button variant="outline" onClick={() => router.push('/dashboard/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  // Field order based on importance (matches form structure)
  const FIELD_ORDER = [
    // Core Product Information
    'product_name', 'origin_country', 'manufacturer_name', 'cas_number', 'fda_number',
    'einecs', 'category', 'form', 'grade', 'applications', 'description',
    // Origin & Source
    'botanical_name', 'extraction_ratio', 'carrier_material',
    // Physical & Sensory Properties
    'appearance', 'odor', 'taste', 'solubility', 'particle_size', 'mesh_size', 'bulk_density',
    // Chemical Analysis
    'assay', 'ph', 'moisture', 'ash_content', 'loss_on_drying', 'residual_solvents',
    // Heavy Metals
    'heavy_metals_total', 'lead', 'arsenic', 'cadmium', 'mercury',
    // Contaminants
    'pesticide_residue', 'aflatoxins',
    // Microbiological
    'total_plate_count', 'yeast_mold', 'coliforms', 'e_coli_presence',
    'salmonella_presence', 'staphylococcus_presence',
    // Pricing & MOQ
    'price_lead_time',
    // Packaging & Logistics
    'packaging_type', 'net_weight', 'gross_weight', 'packages_per_pallet',
    'shelf_life', 'storage_conditions', 'storage_temperature', 'payment_terms', 'incoterm',
    // Sample Options
    'samples',
    // Certifications & Compliance
    'certificates', 'allergen_info', 'gmo_status', 'irradiation_status',
    'bse_statement', 'halal_certified', 'kosher_certified', 'organic_certification_body',
    // Files
    'uploaded_files', 'coa_file', 'tds_file', 'msds_file', 'spec_sheet',
    // Product Images
    'product_images',
    // Inventory
    'inventory_locations',
  ]

  const fieldsWithValues = FIELD_ORDER.filter((key) => {
    if (key.startsWith('_') || key === 'field_permissions' || key === 'channel_links') return false
    const value = formData[key as keyof typeof formData]
    return value !== null && value !== undefined && value !== '' &&
      (!Array.isArray(value) || value.length > 0)
  })

  return (
    <main className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/dashboard/products/create?productId=${productId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-semibold">
                  {formData.product_name || 'Product'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Review & Publish
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
              Ready to Publish
            </Badge>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border/30 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setViewMode('edit')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                viewMode === 'edit'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Edit Permissions
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                viewMode === 'preview'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'edit' && (
          <div className="space-y-6">
            {/* Explanation Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h2 className="text-lg font-semibold mb-3">Control What Visitors See</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set the visibility level for each field. You can always change these later.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">👀 Basic Info</p>
                  <p className="text-xs text-muted-foreground">Visible to everyone</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">🔗 More Details</p>
                  <p className="text-xs text-muted-foreground">For marketing link visitors</p>
                </div>
                <div className="p-3 rounded-lg bg-background/60 border border-border/30">
                  <p className="text-sm font-medium mb-1">✅ Complete Access</p>
                  <p className="text-xs text-muted-foreground">After quote request</p>
                </div>
              </div>
            </div>

            {/* Fields List */}
            <div className="rounded-xl border border-border/30 bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Product Fields ({fieldsWithValues.length})</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPerms: FieldPermission = {}
                      Object.keys(permissions).forEach((k) => { newPerms[k] = 'public' })
                      setPermissions(newPerms)
                      toast.success('All fields set to Basic Info')
                    }}
                  >
                    Set All Basic
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newPerms: FieldPermission = {}
                      Object.keys(permissions).forEach((k) => { newPerms[k] = 'after_rfq' })
                      setPermissions(newPerms)
                      toast.success('All fields set to Complete')
                    }}
                  >
                    Set All Complete
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                {fieldsWithValues.map((fieldName) => {
                  const value = formData[fieldName as keyof typeof formData]
                  const label = fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  const alwaysPublicFields = ['product_name', 'category', 'description', 'product_images']
                  const isAlwaysPublic = alwaysPublicFields.includes(fieldName)

                  return (
                    <div key={fieldName} className={cn(isAlwaysPublic && "opacity-60 pointer-events-none")}>
                      <FieldDisplay
                        label={label}
                        value={value}
                        fieldName={fieldName}
                        permission={permissions[fieldName] || 'public'}
                        onPermissionChange={handlePermissionChange}
                      />
                      {isAlwaysPublic && (
                        <p className="text-[10px] text-muted-foreground ml-2">Always public</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard/products')}
              >
                Save as Draft
              </Button>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" onClick={() => setViewMode('preview')} className="gap-2">
                  Continue to Preview
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Publish Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'preview' && (
          <div className="space-y-6">
            {/* Explanation Banner */}
            <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
              <h2 className="text-lg font-semibold mb-3">Preview Your Product Page</h2>
              <p className="text-sm text-muted-foreground mb-4">
                See exactly how your product appears to different visitors. Switch between stages below.
              </p>
            </div>

            {/* Stage Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPreviewStage('public')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'public'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-5 w-5" />
                  <span className="text-sm font-semibold">Guest Visitor</span>
                </div>
                <p className={cn('text-xs', previewStage === 'public' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  Anyone browsing without a special link sees only basic information
                </p>
              </button>

              <button
                onClick={() => setPreviewStage('after_click')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'after_click'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-5 w-5" />
                  <span className="text-sm font-semibold">Marketing Link</span>
                </div>
                <p className={cn('text-xs', previewStage === 'after_click' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  People who click your email, social, or QR code links see more details
                </p>
              </button>

              <button
                onClick={() => setPreviewStage('after_rfq')}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all',
                  previewStage === 'after_rfq'
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                    : 'bg-card hover:bg-muted/50 border-border/30'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">After Quote</span>
                </div>
                <p className={cn('text-xs', previewStage === 'after_rfq' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                  After submitting a quote request, visitors see everything including downloads
                </p>
              </button>
            </div>

            {/* Preview Content - Real Product Page */}
            <div className="rounded-xl border-2 border-primary/20 overflow-hidden shadow-lg">
              <div className="bg-muted/50 border-b border-border/30 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Preview as {previewStage === 'public' ? 'Guest' : previewStage === 'after_click' ? 'Marketing Link Visitor' : 'Quote Requester'}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {previewStage === 'public' ? '👀 Basic Info' : previewStage === 'after_click' ? '🔗 More Details' : '✅ Complete Access'}
                </Badge>
              </div>
              <div className="bg-background">
                <RealPagePreview
                  formData={formData}
                  permissions={permissions}
                  viewMode={previewStage}
                  documentMetadata={documentMetadata}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button variant="outline" size="lg" onClick={() => setViewMode('edit')} className="gap-2">
                <ArrowLeft className="h-5 w-5" />
                Back to Permissions
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/dashboard/products')}
                >
                  Skip & Save as Draft
                </Button>
                <Button
                  size="lg"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="gap-2"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Publish Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

