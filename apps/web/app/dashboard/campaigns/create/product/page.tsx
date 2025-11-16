'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCampaignStore } from '@/lib/stores/campaign-store'
import { createClient } from '@/lib/supabase/client'

interface Product {
  product_id: string
  product_name: string
  industry_code: string
  status: string
  created_at: string
  product_data?: {
    category?: string
    tags?: string[]
    documents?: Array<{ name: string }>
  }
}

export default function ChooseProductPage() {
  const router = useRouter()
  const { draft, setDraft, nextStep } = useCampaignStore()
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(draft.productId)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Parse product_data if it's a string
      const productsWithParsedData = (data || []).map(product => ({
        ...product,
        product_data: typeof product.product_data === 'string' 
          ? JSON.parse(product.product_data) 
          : product.product_data
      }))
      
      setProducts(productsWithParsedData)

      // Auto-select if only one product
      if (productsWithParsedData.length === 1) {
        handleSelectProduct(productsWithParsedData[0])
      }
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleSelectProduct(product: Product) {
    setSelectedProductId(product.product_id)
    const productData = typeof product.product_data === 'string' 
      ? JSON.parse(product.product_data) 
      : product.product_data
    const filesCount = productData?.uploaded_files?.length || 0
    setDraft({
      productId: product.product_id,
      productName: product.product_name,
      productIndustry: product.industry_code,
      productTags: productData?.tags || [],
      attachedFilesCount: filesCount
    })
  }

  function handleNext() {
    if (selectedProductId) {
      nextStep()
      router.push('/dashboard/campaigns/create/buyers')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/campaigns')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-base sm:text-lg font-semibold">Campaign Setup</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Step 1 of 4</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold mb-2">Select a Product to Promote</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Pick one of your uploaded products below
            </p>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button onClick={() => router.push('/dashboard/products/create')}>
                Create Your First Product
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => {
                const isSelected = selectedProductId === product.product_id
                const productData = typeof product.product_data === 'string' 
                  ? JSON.parse(product.product_data) 
                  : product.product_data
                const tags = productData?.tags || []
                const filesCount = productData?.uploaded_files?.length || 0
                const productImages = productData?.product_images || []
                const firstImage = productImages.length > 0 ? productImages[0] : null

                return (
                  <button
                    key={product.product_id}
                    onClick={() => handleSelectProduct(product)}
                    className={`
                      relative p-4 rounded-xl text-left transition-all duration-300
                      hover:shadow-lg hover:shadow-primary-light/20 hover:-translate-y-1
                      active:scale-[0.98] touch-manipulation
                      ${
                        isSelected
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-card/50 border-2 border-border/30 hover:border-primary/50'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </div>
                    )}

                    {/* Product Thumbnail */}
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 mb-3 flex items-center justify-center overflow-hidden">
                      {firstImage ? (() => {
                        // Get public URL from Supabase storage
                        let imageUrl = firstImage
                        if (!firstImage.startsWith('http')) {
                          // It's a storage path, get public URL
                          const { data } = supabase.storage
                            .from('product-images')
                            .getPublicUrl(firstImage)
                          imageUrl = data.publicUrl
                        }
                        return (
                          <img 
                            src={imageUrl}
                            alt={product.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to first letter if image fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const fallback = target.nextElementSibling as HTMLElement
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        )
                      })() : null}
                      <div className={`text-4xl font-bold text-primary/30 ${firstImage ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                        {product.product_name.charAt(0)}
                      </div>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-base mb-2 line-clamp-2">
                      {product.product_name}
                    </h3>

                    {/* Identifying Information */}
                    <div className="space-y-1.5 mb-2">
                      {/* Category */}
                      {productData?.category && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">Category:</span>
                          <span>{productData.category}</span>
                        </div>
                      )}
                      
                      {/* Form & Grade */}
                      {(productData?.form || productData?.grade) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {productData?.form && productData?.grade ? (
                            <>
                              <span className="font-medium text-foreground/70">Form:</span>
                              <span>{productData.form}</span>
                              <span className="text-foreground/40">•</span>
                              <span className="font-medium text-foreground/70">Grade:</span>
                              <span>{productData.grade}</span>
                            </>
                          ) : (
                            <>
                              {productData?.form && (
                                <>
                                  <span className="font-medium text-foreground/70">Form:</span>
                                  <span>{productData.form}</span>
                                </>
                              )}
                              {productData?.grade && (
                                <>
                                  <span className="font-medium text-foreground/70">Grade:</span>
                                  <span>{productData.grade}</span>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Manufacturer */}
                      {productData?.manufacturer_name && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/70">Manufacturer:</span>
                          <span className="line-clamp-1">{productData.manufacturer_name}</span>
                        </div>
                      )}
                      
                      {/* CAS Number or Origin Country */}
                      {(productData?.cas_number || productData?.origin_country) && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          {productData?.cas_number && (
                            <span className="font-medium text-foreground/70">CAS:</span>
                          )}
                          <span>{productData?.cas_number || productData?.origin_country}</span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {tags.slice(0, 2).map((tag: string, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs px-2 py-0.5"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Files Count */}
                    {filesCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{filesCount} {filesCount === 1 ? 'file' : 'files'}</span>
                      </div>
                    )}

                    {/* Select Button */}
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <span className="text-sm font-medium text-primary">Selected</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Sticky Bar */}
      <section className="sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 border-t border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* Progress Indicator */}
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
              <div className="h-2 w-2 rounded-full bg-border"></div>
            </div>
            {/* Next Button */}
            <Button
              onClick={handleNext}
              disabled={!selectedProductId}
              className="gap-2 min-h-[44px]"
            >
              Next: Matched Buyers
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

