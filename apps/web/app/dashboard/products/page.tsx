'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Package, Plus, Edit, Eye, FileText, Search, X, Trash2, BarChart3, MoreVertical } from 'lucide-react'
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
// AlertDialog will be created inline for now

export default function ProductsPage() {
  const { data, isLoading, error } = useProducts()
  const deleteProduct = useDeleteProduct()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Products</h1>
                  {!isLoading && (
                    <Badge variant="secondary" className="text-xs sm:text-sm font-medium px-2.5 py-1">
                      {allProducts.length} {allProducts.length === 1 ? 'Product' : 'Products'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  Manage your product pages and catalog
                </p>
              </div>
              <Link href="/dashboard/products/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Filters */}
        {!isLoading && allProducts.length > 0 && (
          <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-border/30 bg-background/50">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
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
        )}

        {/* Products List */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {isLoading ? (
            <div className="max-w-7xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 text-center">
                <div className="text-sm text-muted-foreground font-normal">Loading products...</div>
              </div>
            </div>
          ) : error ? (
            <div className="max-w-7xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-8 text-center">
                <div className="text-sm text-destructive font-normal">Error loading products. Please try again.</div>
              </div>
            </div>
          ) : allProducts.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl min-h-[400px] flex items-center justify-center p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <div className="text-center">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                    <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No products yet</h2>
                  <p className="text-sm text-muted-foreground mb-6 font-normal">
                    Create your first product page to start showcasing to buyers
                  </p>
                  <Link href="/dashboard/products/create">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Product
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl min-h-[300px] flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">No products found</h2>
                  <p className="text-sm text-muted-foreground mb-4 font-normal">
                    Try adjusting your filters or search query
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters} className="gap-2" size="sm">
                      <X className="h-4 w-4" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border/30 overflow-hidden">
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
      </div>

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
    </div>
  )
}
