'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useProduct } from '@/lib/api/products'
import type { FoodSupplementProductData } from '@/components/products/industries/food-supplement/types'
import { RealPagePreview } from './RealPagePreview'

export default function PublicProductPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const isMerchant = searchParams.get('merchant') === 'true'
  
  // For now, we'll use slug as productId. In production, you'd query by slug
  // This assumes slug is the productId for simplicity
  const productId = slug

  const { data: productData, isLoading } = useProduct(productId)
  
  // Extract product form data
  const formData: FoodSupplementProductData | null = useMemo(() => {
    if (!productData?.product_data) return null
    return typeof productData.product_data === 'string'
      ? JSON.parse(productData.product_data)
      : productData.product_data
  }, [productData])

  // For merchant access, show everything (after_rfq mode)
  // For regular users, respect permissions
  const viewMode = isMerchant ? 'after_rfq' : 'public'
  
  // Get permissions from product data
  const permissions = useMemo(() => {
    if (!formData) return {}
    const formDataAny = formData as any
    return formDataAny.field_permissions || {}
  }, [formData])

  const [documentMetadata, setDocumentMetadata] = useState<Record<string, any>>({})

  // Fetch full document metadata for uploaded_files
  useEffect(() => {
    if (!formData) return
    
    const formDataAny = formData as any
    const uploadedFiles = formDataAny.uploaded_files || []
    
    if (uploadedFiles.length === 0) return

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
      />
    </div>
  )
}

