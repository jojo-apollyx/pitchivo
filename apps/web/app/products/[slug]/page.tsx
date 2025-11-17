'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2, Package2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProduct } from '@/lib/api/products'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { RealPagePreview } from './RealPagePreview'
import { RfqFormDialog } from '@/components/products/RfqFormDialog'
import { ProductStructuredData } from '@/components/products/ProductStructuredData'

export default function PublicProductPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const token = searchParams.get('token') || undefined
  
  // For now, we'll use slug as productId. In production, you'd query by slug
  // This assumes slug is the productId for simplicity
  const productId = slug

  // Fetch from PUBLIC API endpoint that handles access control filtering
  const [productData, setProductData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessLevel, setAccessLevel] = useState<string>('public')
  const [organizationData, setOrganizationData] = useState<{ name: string | null; domain: string | null } | null>(null)
  const [isMerchant, setIsMerchant] = useState(false)
  
  // Fetch product data from public API with access control
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const url = new URL(`/api/products/public/${slug}`, window.location.origin)
        if (token) url.searchParams.set('token', token)
        
        const response = await fetch(url.toString())
        if (!response.ok) {
          console.error('Failed to fetch product:', response.statusText)
          return
        }
        
        const data = await response.json()
        setProductData(data) // API returns filtered product directly, not nested under .product
        const newAccessLevel = data._access_info?.level || 'public'
        setAccessLevel(newAccessLevel)
        
        // Check if user has merchant access (server determined this based on authentication)
        setIsMerchant(data._access_info?.source === 'merchant' || newAccessLevel === 'after_rfq')
        
        // Log access level for debugging
        if (token) {
          console.log('📧 Access level after token validation:', newAccessLevel)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProduct()
  }, [slug, token])
  
  // Fetch organization data for SEO
  useEffect(() => {
    if (!productData?.org_id) return
    
    const fetchOrg = async () => {
      try {
        const response = await fetch(`/api/organizations?id=${productData.org_id}`)
        if (response.ok) {
          const data = await response.json()
          setOrganizationData({
            name: data.name || null,
            domain: data.domain || null,
          })
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      }
    }
    
    fetchOrg()
  }, [productData?.org_id])
  
  // Extract product form data (already filtered by server)
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // Use the access level returned by the server
  const viewMode = accessLevel as 'public' | 'after_click' | 'after_rfq'
  
  // Get permissions from product data (for display purposes)
  const permissions = useMemo(() => {
    if (!formData) return {}
    const formDataAny = formData as any
    return formDataAny.field_permissions || {}
  }, [formData])

  const [documentMetadata, setDocumentMetadata] = useState<Record<string, any>>({})
  const [showRfqDialog, setShowRfqDialog] = useState(false)
  const [accessId, setAccessId] = useState<string | null>(null)
  const trackingInitialized = useRef(false)

  // Generate or retrieve session ID
  const getSessionId = (): string => {
    if (typeof window === 'undefined') return 'server'
    let sessionId = localStorage.getItem('product_session_id')
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('product_session_id', sessionId)
    }
    return sessionId
  }

  // Generate visitor ID (anonymized)
  const getVisitorId = (): string => {
    if (typeof window === 'undefined') return 'visitor_unknown'
    let visitorId = localStorage.getItem('product_visitor_id')
    if (!visitorId) {
      // Create a simple hash from available data
      const data = `${navigator.userAgent}_${new Date().getTimezoneOffset()}`
      visitorId = `vis_${btoa(data).substr(0, 16)}`
      localStorage.setItem('product_visitor_id', visitorId)
    }
    return visitorId
  }

  // Track page access
  useEffect(() => {
    if (!productData || trackingInitialized.current) return
    trackingInitialized.current = true

    const trackAccess = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search)
        const channelId = searchParams.get('ch') || null
        const isQrCode = searchParams.get('qr') === 'true' || searchParams.get('qr') === '1'
        const accessMethod = isQrCode ? 'qr_code' : 'url'

        // Get channel name from product data
        const formDataAny = formData as any
        const channelLinks = formDataAny?.channel_links || []
        const channel = channelLinks.find((c: any) => c.id === channelId || c.parameter?.includes(`ch=${channelId}`))
        const channelName = channel?.name || null

        const response = await fetch('/api/products/track-access', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            product_id: productId,
            access_method: accessMethod,
            channel_id: channelId,
            channel_name: channelName,
            session_id: getSessionId(),
            visitor_id: getVisitorId(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || null,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setAccessId(data.access_id)

          // Track page_view action
          if (data.access_id) {
            await fetch('/api/products/track-action', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_id: data.access_id,
                product_id: productId,
                action_type: 'page_view',
              }),
            })
          }
        }
      } catch (error) {
        console.error('Error tracking access:', error)
      }
    }

    trackAccess()
  }, [productData, productId, formData])

  // Track document downloads
  const trackDownload = async (fileId: string, filename: string) => {
    if (!accessId) return

    try {
      await fetch('/api/products/track-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_id: accessId,
          product_id: productId,
          action_type: 'document_download',
          action_target: fileId,
          action_metadata: { filename },
        }),
      })
    } catch (error) {
      console.error('Error tracking download:', error)
    }
  }

  // Fetch full document metadata for uploaded_files
  useEffect(() => {
    if (!formData) return
    
    const formDataAny = formData as any
    const uploadedFiles = formDataAny.uploaded_files
    
    // Check if uploaded_files is actually an array (might be locked field metadata object)
    if (!Array.isArray(uploadedFiles) || uploadedFiles.length === 0) return

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
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-accent/10 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="pointer-events-none absolute -right-12 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl">
            <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-8 sm:p-12 shadow-xl">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-6">
                  <Package2 className="h-16 w-16 text-amber-600 dark:text-amber-500" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-semibold text-center mb-3 text-foreground">
                Product Not Available
              </h2>

              {/* Description */}
              <div className="text-center space-y-3 mb-8">
                <p className="text-muted-foreground max-w-md mx-auto">
                  This product cannot be found or is not currently available for viewing.
                </p>
                
                {/* Possible reasons */}
                <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30 text-left">
                  <p className="text-sm font-medium text-foreground mb-3">Possible reasons:</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>The product hasn't been published yet (still in draft)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>The product link is incorrect or has been changed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>The product has been removed by the seller</span>
                    </li>
                  </ul>
                </div>

                {isMerchant && (
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">
                      👋 Product Owner?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      If this is your product and it's still in draft, publish it from your dashboard to make it accessible. 
                      Only published products are visible to others.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Go Back
                </Button>
                {isMerchant && (
                  <Button
                    onClick={() => window.location.href = '/dashboard/products'}
                    size="lg"
                    className="gap-2"
                  >
                    <Package2 className="h-5 w-5" />
                    My Products
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* SEO Structured Data */}
      {productData && formData && (
        <ProductStructuredData
          productId={productId}
          productName={productData.product_name || 'Product'}
          productData={formData}
          organizationName={organizationData?.name || null}
          organizationDomain={organizationData?.domain || null}
        />
      )}

      <div className="min-h-screen bg-background">
        {isMerchant && (
          <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center">
            <p className="text-xs text-primary font-medium">
              Merchant Preview Mode - Full Access Enabled
            </p>
          </div>
        )}
        <RealPagePreview
          formData={formData}
          permissions={permissions}
          viewMode={viewMode}
          documentMetadata={documentMetadata}
          onRfqClick={() => setShowRfqDialog(true)}
          onDownload={trackDownload}
        />

      {/* RFQ Form Dialog */}
      {productData && (
        <RfqFormDialog
          open={showRfqDialog}
          onOpenChange={setShowRfqDialog}
          productId={productId}
          productName={productData.product_name || 'Product'}
          onSuccess={() => {
            // Track RFQ submission
            if (accessId) {
              fetch('/api/products/track-action', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  access_id: accessId,
                  product_id: productId,
                  action_type: 'rfq_submit',
                  action_target: 'rfq_form',
                }),
              }).catch(console.error)
            }
          }}
        />
      )}
      </div>
    </>
  )
}

