'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useProduct } from '@/lib/api/products'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { RealPagePreview } from './RealPagePreview'
import { RfqFormDialog } from '@/components/products/RfqFormDialog'
import { ProductStructuredData } from '@/components/products/ProductStructuredData'

export default function PublicProductPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const isMerchant = searchParams.get('merchant') === 'true'
  const token = searchParams.get('token') || undefined
  
  // For now, we'll use slug as productId. In production, you'd query by slug
  // This assumes slug is the productId for simplicity
  const productId = slug

  // Fetch from PUBLIC API endpoint that handles access control filtering
  const [productData, setProductData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessLevel, setAccessLevel] = useState<string>('public')
  const [organizationData, setOrganizationData] = useState<{ name: string | null; domain: string | null } | null>(null)
  
  // Fetch product data from public API with access control
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true)
        const url = new URL(`/api/products/public/${slug}`, window.location.origin)
        if (token) url.searchParams.set('token', token)
        if (isMerchant) url.searchParams.set('merchant', 'true')
        
        const response = await fetch(url.toString())
        if (!response.ok) {
          console.error('Failed to fetch product:', response.statusText)
          return
        }
        
        const data = await response.json()
        setProductData(data) // API returns filtered product directly, not nested under .product
        setAccessLevel(data._access_info?.level || 'public')
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProduct()
  }, [slug, token, isMerchant])
  
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Product not found</p>
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

