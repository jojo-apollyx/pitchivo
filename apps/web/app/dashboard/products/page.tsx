'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Edit, Eye, FileText, Search, X, Trash2, BarChart3, MoreVertical, Link2, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useProducts, useDeleteProduct, useUpdateProduct } from '@/lib/api/products'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SharingLinksPanel } from '@/components/products/SharingLinksPanel'
import QRCode from 'react-qr-code'
import { useQueryClient } from '@tanstack/react-query'
// AlertDialog will be created inline for now

export default function ProductsPage() {
  const { data, isLoading, error } = useProducts()
  const deleteProduct = useDeleteProduct()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)
  const [showLinksDialog, setShowLinksDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [qrData, setQrData] = useState<{ url: string; name: string } | null>(null)

  const allProducts = data?.products || []

  // Get unique categories for filter
  const categories = useMemo(() => {
    const cats = new Set<string>()
    allProducts.forEach((p) => {
      if (p.category) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [allProducts])

  // Filter products
  const products = useMemo(() => {
    return allProducts.filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = product.product_name?.toLowerCase().includes(query)
        const matchesManufacturer = product.manufacturer_name?.toLowerCase().includes(query)
        if (!matchesName && !matchesManufacturer) return false
      }

      // Status filter
      if (statusFilter !== 'all' && product.status !== statusFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false
      }

      return true
    })
  }, [allProducts, searchQuery, statusFilter, categoryFilter])

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setCategoryFilter('all')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive">Error loading products. Please try again.</p>
      </div>
    )
  }

  if (allProducts.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="relative">
          <section id="products-empty-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight">Products</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Manage your product pages and catalog
                  </p>
                </div>
                <Link href="/dashboard/products/create">
                  <Button className="gap-2 min-h-[44px]">
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <section id="products-empty-state-section" className="px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="max-w-2xl mx-auto text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Package className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-semibold mb-2">No products yet</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                Create your first product page to start showcasing to buyers
              </p>
              <Link href="/dashboard/products/create">
                <Button id="products-create-first-product-button" aria-label="Create first product" className="gap-2 min-h-[44px]">
                  <Plus className="h-4 w-4" />
                  Create Product
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Page Header */}
      <section id="products-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight">Products</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {allProducts.length} {allProducts.length === 1 ? 'product' : 'products'} created
              </p>
            </div>
            <Link href="/dashboard/products/create">
              <Button className="gap-2 min-h-[44px]">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-card/50 border-border/50 focus:bg-card transition-all duration-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            {categories.length > 0 && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-3 text-xs sm:text-sm text-muted-foreground font-normal">
            Showing {products.length} of {allProducts.length} product{allProducts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Products List */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        {products.length === 0 ? (
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2">No products found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2" size="sm">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border/30">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Product Name
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {products.map((product) => (
                      <tr
                        key={product.product_id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm sm:text-base font-medium text-foreground">
                                {product.product_name || 'Untitled Product'}
                              </div>
                              {product.manufacturer_name && (
                                <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                                  {product.manufacturer_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={product.status === 'published' ? 'default' : 'secondary'}
                            className="text-xs sm:text-sm"
                          >
                            {product.status === 'draft' ? (
                              <FileText className="h-3 w-3 mr-1" />
                            ) : (
                              <Eye className="h-3 w-3 mr-1" />
                            )}
                            {product.status}
                          </Badge>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground font-normal">
                            {product.category || '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground font-normal">
                            {product.created_at
                              ? format(new Date(product.created_at), 'MMM d, yyyy')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/products/${product.product_id}/analytics`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Analytics</span>
                              </Button>
                            </Link>
                            <Link href={`/dashboard/products/create?productId=${product.product_id}`}>
                              <Button variant="ghost" size="sm" className="gap-2">
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Link href={`/dashboard/products/${product.product_id}/preview-publish`}>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview & Publish
                                  </DropdownMenuItem>
                                </Link>
                                {product.status === 'published' && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                                        const publicUrl = `${baseUrl}/products/${product.product_id}`
                                        navigator.clipboard.writeText(publicUrl)
                                        toast.success('Public link copied to clipboard!')
                                      }}
                                    >
                                      <Link2 className="h-4 w-4 mr-2" />
                                      Copy Public Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedProduct(product)
                                        setShowLinksDialog(true)
                                      }}
                                    >
                                      <Share2 className="h-4 w-4 mr-2" />
                                      Manage Marketing Links
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setProductToDelete(product.product_id)
                                    setDeleteConfirmOpen(true)
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Delete Product</h3>
            <p className="text-sm text-muted-foreground mb-6 font-normal">
              Are you sure you want to delete this product? This action cannot be undone and will remove all associated data including access logs and analytics.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setProductToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!productToDelete) return
                  try {
                    await deleteProduct.mutateAsync(productToDelete)
                    toast.success('Product deleted successfully')
                    setDeleteConfirmOpen(false)
                    setProductToDelete(null)
                  } catch (error) {
                    toast.error('Failed to delete product')
                    console.error('Delete error:', error)
                  }
                }}
                disabled={deleteProduct.isPending}
              >
                {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Marketing Links Dialog */}
      {showLinksDialog && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between bg-gradient-to-r from-primary/5 to-accent/5">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Marketing Links</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedProduct.product_name || 'Product'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowLinksDialog(false)
                  setSelectedProduct(null)
                }}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Dialog Content - Scrollable */}
            <div className="px-6 py-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Public Link Section */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 mt-0.5">
                      <Link2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Public Product Link</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Basic product information visible to everyone
                      </p>
                      <div className="p-3 rounded-lg border bg-card">
                        <p className="text-xs text-muted-foreground truncate font-mono mb-2">
                          {typeof window !== 'undefined' && `${window.location.origin}/products/${selectedProduct.product_id}`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => {
                            const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
                            const publicUrl = `${baseUrl}/products/${selectedProduct.product_id}`
                            navigator.clipboard.writeText(publicUrl)
                            toast.success('Public link copied!')
                          }}
                        >
                          <Link2 className="h-3 w-3 mr-1" />
                          Copy Public Link
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Marketing Channels Section */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-accent/10 p-2 mt-0.5">
                      <Share2 className="h-4 w-4 text-accent-dark" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">Marketing Channel Links</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Create and manage secure links for different marketing channels
                      </p>
                    </div>
                  </div>
                  
                  {/* Embed the SharingLinksPanel */}
                  <div className="pl-11">
                    <SharingLinksPanel 
                      productId={selectedProduct.product_id}
                      initialChannels={(() => {
                        try {
                          const productData = typeof selectedProduct.product_data === 'string' 
                            ? JSON.parse(selectedProduct.product_data)
                            : selectedProduct.product_data
                          return productData?.channel_links || []
                        } catch {
                          return []
                        }
                      })()}
                      onChannelsChange={async (channels) => {
                        try {
                          const currentProductData = typeof selectedProduct.product_data === 'string'
                            ? JSON.parse(selectedProduct.product_data)
                            : selectedProduct.product_data || {}
                          
                          const updatedProductData = {
                            ...currentProductData,
                            channel_links: channels,
                          }

                          await fetch('/api/products', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              product_id: selectedProduct.product_id,
                              product_data: updatedProductData,
                            }),
                          })
                          
                          // Refresh products list to show updated data
                          await queryClient.invalidateQueries({ queryKey: ['products'] })
                        } catch (error) {
                          console.error('Error saving channels:', error)
                        }
                      }}
                      onShowQR={(url, name) => {
                        setQrData({ url, name })
                        setShowQrDialog(true)
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-border/30 bg-muted/30">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setShowLinksDialog(false)
                    setSelectedProduct(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      {showQrDialog && qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background border border-border rounded-xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-accent/5">
              <h3 className="text-lg font-semibold text-foreground">QR Code - {qrData.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Scan this QR code to open the product page
              </p>
            </div>
            <div className="px-6 py-6 flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg inline-block">
                <QRCode
                  value={qrData.url}
                  size={256}
                  style={{ display: 'block', margin: '0 auto' }}
                  viewBox="0 0 256 256"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-sm break-all">
                {qrData.url}
              </p>
            </div>
            <div className="px-6 py-4 border-t border-border/30 bg-muted/30 flex justify-end">
              <Button
                onClick={() => {
                  setShowQrDialog(false)
                  setQrData(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
