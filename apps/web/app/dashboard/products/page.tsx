'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import { EmptyProductsIllustration, EmptySearchIllustration } from '@/components/ui/illustrations'
import { PageLoadingSkeleton } from '@/components/ui/skeleton-loading'
import QRCode from 'react-qr-code'
import { useQueryClient } from '@tanstack/react-query'

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
    return <PageLoadingSkeleton title subtitle cards={6} />
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
      <main className="min-h-screen bg-background">
        <div className="relative">
          <motion.section 
            id="products-empty-header-section" 
            className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Products</h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your product pages and catalog
                  </p>
                </div>
                <Link href="/dashboard/products/create">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="gap-2 h-10 rounded-md">
                      <Plus className="h-4 w-4" />
                      Add Product
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </div>
          </motion.section>

          <motion.section 
            id="products-empty-state-section" 
            className="px-4 sm:px-6 lg:px-8 py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="max-w-md mx-auto text-center">
              {/* Minimalist illustration with animation */}
              <motion.div 
                className="mb-8"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: 'spring', damping: 15 }}
              >
                <EmptyProductsIllustration size="lg" className="mx-auto" />
              </motion.div>
              <motion.h2 
                className="text-xl font-semibold mb-2 text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                No products yet
              </motion.h2>
              <motion.p 
                className="text-muted-foreground mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Create your first product page to start showcasing to buyers
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link href="/dashboard/products/create">
                  <Button id="products-create-first-product-button" aria-label="Create first product" className="gap-2 h-10 rounded-md">
                    <Plus className="h-4 w-4" />
                    Create Product
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Page Header */}
      <section id="products-header-section" className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Products</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {allProducts.length} {allProducts.length === 1 ? 'product' : 'products'} created
              </p>
            </div>
            <Link href="/dashboard/products/create">
              <Button className="gap-2 h-10 rounded-md">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10"
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
              <SelectTrigger className="w-full sm:w-[160px] h-10">
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
                <SelectTrigger className="w-full sm:w-[160px] h-10">
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
                className="gap-2 h-10"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {products.length} of {allProducts.length} product{allProducts.length !== 1 ? 's' : ''}
          </div>
        </div>
      </section>

      {/* Products List */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        {products.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            {/* Minimalist search illustration */}
            <div className="mb-6">
              <EmptySearchIllustration size="md" className="mx-auto" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">No products found</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="gap-2 h-10" size="sm">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="bg-background rounded-lg border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-secondary border-b border-border/30">
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
                        className="hover:bg-background-secondary transition-colors duration-200"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-accent-surface flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary-dark" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {product.product_name || 'Untitled Product'}
                              </div>
                              {product.manufacturer_name && (
                                <div className="text-xs text-muted-foreground">
                                  {product.manufacturer_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={product.status === 'published' ? 'default' : 'secondary'}
                            className="text-xs"
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
                          <div className="text-sm text-muted-foreground">
                            {product.category || '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {product.created_at
                              ? format(new Date(product.created_at), 'MMM d, yyyy')
                              : '-'}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/products/${product.product_id}/analytics`}>
                              <Button variant="ghost" size="sm" className="gap-2 h-9">
                                <BarChart3 className="h-4 w-4" />
                                <span className="hidden sm:inline">Analytics</span>
                              </Button>
                            </Link>
                            <Link href={`/dashboard/products/create?productId=${product.product_id}`}>
                              <Button variant="ghost" size="sm" className="gap-2 h-9">
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            </Link>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9">
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
          <div className="bg-background border border-border/50 rounded-lg p-6 max-w-md w-full mx-4 shadow-soft">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Delete Product</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to delete this product? This action cannot be undone and will remove all associated data including access logs and analytics.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setProductToDelete(null)
                }}
                className="h-10"
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
                className="h-10"
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
          <div className="bg-background border border-border/50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-soft flex flex-col">
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
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
                className="h-9 w-9"
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
                    <div className="rounded-md bg-accent-surface p-2 mt-0.5">
                      <Link2 className="h-4 w-4 text-primary-dark" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1 text-foreground">Public Product Link</h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Basic product information visible to everyone
                      </p>
                      <div className="p-3 rounded-md border border-border/50 bg-background-secondary">
                        <p className="text-xs text-muted-foreground truncate font-mono mb-2">
                          {typeof window !== 'undefined' && `${window.location.origin}/products/${selectedProduct.product_id}`}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs h-9"
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

                <div className="border-t border-border/30" />

                {/* Marketing Channels Section */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-purple-100 dark:bg-purple-900/30 p-2 mt-0.5">
                      <Share2 className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1 text-foreground">Marketing Channel Links</h4>
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
            <div className="px-6 py-4 border-t border-border/30 bg-background-secondary">
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    setShowLinksDialog(false)
                    setSelectedProduct(null)
                  }}
                  className="h-10"
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
          <div className="bg-background border border-border/50 rounded-lg max-w-md w-full overflow-hidden shadow-soft">
            <div className="px-6 py-4 border-b border-border/30">
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
            <div className="px-6 py-4 border-t border-border/30 bg-background-secondary flex justify-end">
              <Button
                onClick={() => {
                  setShowQrDialog(false)
                  setQrData(null)
                }}
                className="h-10"
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
