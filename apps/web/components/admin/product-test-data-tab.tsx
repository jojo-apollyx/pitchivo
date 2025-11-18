'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Trash2, Loader2, AlertTriangle, Package, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  product_id: string
  product_name: string
  status: string
  is_test: boolean
  org_id: string
  organization_name: string
  industry_code: string
  created_at: string
}

interface DeletePreview {
  product: Product
  relatedData: {
    campaigns: number
    rfqs: number
    tracking: number
    documents: number
  }
  totalRecords: number
}

export function ProductTestDataTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [testDataFilter, setTestDataFilter] = useState<string>('all')
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch all products
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'products', 'test-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          product_id,
          product_name,
          status,
          is_test,
          org_id,
          industry_code,
          created_at,
          organizations!inner(name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map((p: any) => ({
        ...p,
        organization_name: p.organizations?.name || 'Unknown'
      }))
    },
  })

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      const matchesSearch = search === '' || 
        product.product_name.toLowerCase().includes(search.toLowerCase()) ||
        product.organization_name.toLowerCase().includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      const matchesTestData = testDataFilter === 'all' || 
        (testDataFilter === 'test' && product.is_test) ||
        (testDataFilter === 'production' && !product.is_test)

      return matchesSearch && matchesStatus && matchesTestData
    })
  }, [products, search, statusFilter, testDataFilter])

  // Mark as test mutation
  const markAsTestMutation = useMutation({
    mutationFn: async ({ productId, isTest }: { productId: string; isTest: boolean }) => {
      const response = await fetch('/api/admin/test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'products',
          id: productId,
          isTest,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update test flag')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'test-data'] })
      toast.success(`Product marked as ${variables.isTest ? 'test' : 'production'} data`)
    },
    onError: (error: Error) => {
      toast.error('Failed to update', { description: error.message })
    },
  })

  // Load delete preview
  const loadDeletePreview = async (product: Product) => {
    try {
      const response = await fetch(`/api/admin/test-data/preview?type=product&id=${product.product_id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load preview')
      }

      setDeletePreview({
        product,
        relatedData: data.relatedData,
        totalRecords: data.totalRecords,
      })
      setShowDeleteDialog(true)
    } catch (error) {
      toast.error('Failed to load preview', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/admin/test-data/delete?type=product&id=${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', 'test-data'] })
      setShowDeleteDialog(false)
      setDeletePreview(null)
      toast.success('Product deleted successfully', {
        description: `Deleted ${data.totalDeleted} total records`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete product', { description: error.message })
    },
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <Select value={testDataFilter} onValueChange={setTestDataFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by test data" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Data</SelectItem>
            <SelectItem value="test">Test Data Only</SelectItem>
            <SelectItem value="production">Production Data Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
        </span>
        <span>•</span>
        <span>
          <strong>{products.filter((p: Product) => p.is_test).length}</strong> marked as test data
        </span>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error instanceof Error ? error.message : 'Failed to load products'}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Products List */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <Package className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">No products found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {!isLoading && filteredProducts.length > 0 && (
        <div className="space-y-3">
          {filteredProducts.map((product: Product) => (
            <div
              key={product.product_id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium truncate">{product.product_name}</h4>
                  <Badge variant={product.status === 'published' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                  {product.is_test && (
                    <Badge variant="destructive" className="text-xs">
                      TEST
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{product.organization_name}</span>
                  <span>•</span>
                  <span>{product.industry_code}</span>
                  <span>•</span>
                  <span>{new Date(product.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                {/* Test Data Toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id={`test-${product.product_id}`}
                    checked={product.is_test}
                    onCheckedChange={(checked) =>
                      markAsTestMutation.mutate({
                        productId: product.product_id,
                        isTest: checked,
                      })
                    }
                    disabled={markAsTestMutation.isPending}
                  />
                  <Label
                    htmlFor={`test-${product.product_id}`}
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    Test Data
                  </Label>
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadDeletePreview(product)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Product Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{deletePreview?.product.product_name}</strong>?
                </p>

                {deletePreview && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Eye className="w-4 h-4" />
                      Related Data Preview
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Campaigns:</span>
                        <Badge variant="outline">{deletePreview.relatedData.campaigns}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>RFQs:</span>
                        <Badge variant="outline">{deletePreview.relatedData.rfqs}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Tracking Records:</span>
                        <Badge variant="outline">{deletePreview.relatedData.tracking}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Documents:</span>
                        <Badge variant="outline">{deletePreview.relatedData.documents}</Badge>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Records to Delete:</span>
                        <Badge variant="destructive" className="text-base px-3 py-1">
                          {deletePreview.totalRecords}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This action is permanent and cannot be undone. All
                    related campaigns, RFQs, tracking data, and documents will be permanently
                    deleted.
                  </AlertDescription>
                </Alert>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePreview) {
                  deleteProductMutation.mutate(deletePreview.product.product_id)
                }
              }}
              disabled={deleteProductMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

