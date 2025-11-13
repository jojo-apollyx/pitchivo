'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Eye, Globe, Mail, FileText, Plus, QrCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useProduct } from '@/lib/api/products'
import { cn } from '@/lib/utils'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'

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
    <div className="flex items-center gap-1 rounded-lg bg-muted/30 p-1">
      <button
        type="button"
        onClick={() => onChange('public')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
          'hover:bg-background/80 touch-manipulation',
          value === 'public'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Globe className="h-3 w-3" />
        <span className="hidden sm:inline">Public</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_click')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
          'hover:bg-background/80 touch-manipulation',
          value === 'after_click'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Mail className="h-3 w-3" />
        <span className="hidden sm:inline">After Click</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('after_rfq')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all',
          'hover:bg-background/80 touch-manipulation',
          value === 'after_rfq'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <FileText className="h-3 w-3" />
        <span className="hidden sm:inline">After RFQ</span>
      </button>
    </div>
  )
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
  viewMode = 'merchant',
}: {
  label: string
  value: any
  fieldName: string
  permission: AccessLevel
  onPermissionChange: (fieldName: string, level: AccessLevel) => void
  viewMode?: 'merchant' | 'email_visitor' | 'after_rfq'
}) {
  // Determine if field should be visible based on view mode
  const isVisible = useMemo(() => {
    if (viewMode === 'merchant') return true
    if (viewMode === 'email_visitor' && (permission === 'public' || permission === 'after_click')) return true
    if (viewMode === 'after_rfq') return true // All fields visible after RFQ
    return false
  }, [viewMode, permission])

  // Display value
  const displayValue = useMemo(() => {
    if (!value || (Array.isArray(value) && value.length === 0)) return '-'
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }, [value])

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start gap-3 py-3 border-b border-border/30',
        !isVisible && 'opacity-40'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          {!isVisible && viewMode !== 'merchant' && (
            <Badge variant="outline" className="text-xs">
              {permission === 'after_click' ? '✉️ Email access' : '🧾 RFQ required'}
            </Badge>
          )}
        </div>
        <p
          className={cn(
            'text-sm',
            isVisible ? 'text-foreground' : 'text-muted-foreground'
          )}
        >
          {displayValue}
        </p>
      </div>
      <div className="flex-shrink-0">
        <PermissionWidget
          value={permission}
          onChange={(level) => onPermissionChange(fieldName, level)}
          disabled={viewMode !== 'merchant'}
        />
      </div>
    </div>
  )
}

export default function PreviewPublishPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.productId as string

  const [isPublishing, setIsPublishing] = useState(false)
  const [viewMode, setViewMode] = useState<'merchant' | 'email_visitor' | 'after_rfq'>('merchant')
  const [permissions, setPermissions] = useState<FieldPermission>({})
  const [channels, setChannels] = useState<ChannelLink[]>(DEFAULT_CHANNELS)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')

  // Load product data
  const { data: productData, isLoading } = useProduct(productId)

  // Extract product form data
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // Initialize default permissions (all fields public by default)
  useEffect(() => {
    if (formData && Object.keys(permissions).length === 0) {
      const defaultPermissions: FieldPermission = {}
      
      // Set default permissions for all fields
      Object.keys(formData).forEach((key) => {
        // Sensitive fields default to after_click or after_rfq
        if (['price_lead_time', 'samples', 'moq'].includes(key)) {
          defaultPermissions[key] = 'after_rfq'
        } else if (['cas_number', 'assay', 'certificates'].includes(key)) {
          defaultPermissions[key] = 'after_click'
        } else {
          defaultPermissions[key] = 'public'
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
    toast.success('All fields set to Public')
  }

  const handleSetAllRFQ = () => {
    const newPermissions: FieldPermission = {}
    Object.keys(permissions).forEach((key) => {
      newPermissions[key] = 'after_rfq'
    })
    setPermissions(newPermissions)
    toast.success('All fields set to After RFQ')
  }

  const handleAddChannel = () => {
    if (!newChannelName.trim()) {
      toast.error('Please enter a channel name')
      return
    }

    const slug = newChannelName.toLowerCase().replace(/\s+/g, '_')
    const newChannel: ChannelLink = {
      id: slug,
      name: newChannelName,
      parameter: `ch=${slug}`,
      enabled: true,
    }

    setChannels((prev) => [...prev, newChannel])
    setNewChannelName('')
    setShowAddChannel(false)
    toast.success(`Channel "${newChannelName}" added`)
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    try {
      // Save permissions and channels to product
      const updatedProductData = {
        ...formData,
        field_permissions: permissions,
        channel_links: channels,
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

      toast.success('✅ Product published successfully! Links and QR codes generated.')
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
                onClick={() => router.push(`/dashboard/products/create?productId=${productId}`)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">
                  {formData.product_name || 'Product Preview'}
                </h1>
                <p className="text-sm text-muted-foreground">
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

      {/* View Mode Selector */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Preview as:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'merchant' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('merchant')}
            >
              Merchant View
            </Button>
            <Button
              variant={viewMode === 'email_visitor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('email_visitor')}
            >
              Email Visitor
            </Button>
            <Button
              variant={viewMode === 'after_rfq' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('after_rfq')}
            >
              After RFQ
            </Button>
          </div>
        </div>
      </section>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6">
          {/* Left: Product Preview (2/3 width on desktop) */}
          <div className="lg:col-span-2">
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
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg font-semibold mb-4">Pricing & MOQ</h2>
              <div className="space-y-1">
                <FieldDisplay
                  label="Price & Lead Time"
                  value={formData.price_lead_time}
                  fieldName="price_lead_time"
                  permission={permissions.price_lead_time || 'after_rfq'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
                <FieldDisplay
                  label="Samples Available"
                  value={formData.samples}
                  fieldName="samples"
                  permission={permissions.samples || 'after_rfq'}
                  onPermissionChange={handlePermissionChange}
                  viewMode={viewMode}
                />
              </div>
            </section>
          </div>

          {/* Right: Permissions & Links Sidebar (1/3 width on desktop) */}
          <div className="lg:border-l border-border/30">
            {/* Permission Overview */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg font-semibold mb-4">Permission Overview</h2>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Public</span>
                  </div>
                  <Badge variant="outline">{permissionStats.public} fields</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">After Click</span>
                  </div>
                  <Badge variant="outline">{permissionStats.after_click} fields</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">After RFQ</span>
                  </div>
                  <Badge variant="outline">{permissionStats.after_rfq} fields</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetAllPublic}
                  className="w-full"
                >
                  Set All to Public
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSetAllRFQ}
                  className="w-full"
                >
                  Set All to After RFQ
                </Button>
              </div>
            </section>

            {/* Channel Links */}
            <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
              <h2 className="text-lg font-semibold mb-4">Channel Links</h2>
              <div className="space-y-2 mb-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{channel.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        ?{channel.parameter}
                      </p>
                    </div>
                    <Badge variant={channel.enabled ? 'default' : 'outline'}>
                      {channel.enabled ? '✅' : '⏸️'}
                    </Badge>
                  </div>
                ))}
              </div>

              {showAddChannel ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Channel name (e.g., Twitter)"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddChannel} className="flex-1">
                      Add
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddChannel(false)
                        setNewChannelName('')
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddChannel(true)}
                    className="flex-1 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Channel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    QR Codes
                  </Button>
                </div>
              )}
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
                  <p className="text-xs text-muted-foreground mt-1">
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
            <p className="text-sm text-muted-foreground hidden sm:block">
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
    </div>
  )
}

