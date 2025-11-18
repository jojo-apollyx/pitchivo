'use client'

import { useState, useMemo } from 'react'
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
import { Search, Trash2, Loader2, AlertTriangle, Building2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Organization {
  id: string
  name: string
  domain: string
  slug: string
  is_test: boolean
  created_at: string
  product_count?: number
  user_count?: number
}

interface DeletePreview {
  organization: Organization
  relatedData: {
    products: number
    users: number
    campaigns: number
    rfqs: number
    subscriptions: number
    documents: number
  }
  totalRecords: number
}

export function OrganizationTestDataTab() {
  const [search, setSearch] = useState('')
  const [testDataFilter, setTestDataFilter] = useState<string>('all')
  const [deletePreview, setDeletePreview] = useState<DeletePreview | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const queryClient = useQueryClient()
  const supabase = createClient()

  // Fetch all organizations with counts
  const { data: organizations = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'organizations', 'test-data'],
    queryFn: async () => {
      // Fetch organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Fetch counts for each org
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const [{ count: productCount }, { count: userCount }] = await Promise.all([
            supabase
              .from('products')
              .select('*', { count: 'exact', head: true })
              .eq('org_id', org.id),
            supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true })
              .eq('organization_id', org.id),
          ])

          return {
            ...org,
            product_count: productCount || 0,
            user_count: userCount || 0,
          }
        })
      )

      return orgsWithCounts
    },
  })

  // Filter organizations
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org: Organization) => {
      const matchesSearch = search === '' || 
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.domain.toLowerCase().includes(search.toLowerCase())
      
      const matchesTestData = testDataFilter === 'all' || 
        (testDataFilter === 'test' && org.is_test) ||
        (testDataFilter === 'production' && !org.is_test)

      return matchesSearch && matchesTestData
    })
  }, [organizations, search, testDataFilter])

  // Mark as test mutation
  const markAsTestMutation = useMutation({
    mutationFn: async ({ orgId, isTest }: { orgId: string; isTest: boolean }) => {
      const response = await fetch('/api/admin/test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'organizations',
          id: orgId,
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
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', 'test-data'] })
      toast.success(`Organization marked as ${variables.isTest ? 'test' : 'production'} data`)
    },
    onError: (error: Error) => {
      toast.error('Failed to update', { description: error.message })
    },
  })

  // Load delete preview
  const loadDeletePreview = async (org: Organization) => {
    try {
      const response = await fetch(`/api/admin/test-data/preview?type=organization&id=${org.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load preview')
      }

      setDeletePreview({
        organization: org,
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

  // Delete organization mutation
  const deleteOrganizationMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`/api/admin/test-data/delete?type=organization&id=${orgId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete organization')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations', 'test-data'] })
      setShowDeleteDialog(false)
      setDeletePreview(null)
      toast.success('Organization deleted successfully', {
        description: `Deleted ${data.totalDeleted} total records`,
      })
    },
    onError: (error: Error) => {
      toast.error('Failed to delete organization', { description: error.message })
    },
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations or domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
          Showing <strong>{filteredOrganizations.length}</strong> of <strong>{organizations.length}</strong> organizations
        </span>
        <span>•</span>
        <span>
          <strong>{organizations.filter((o: Organization) => o.is_test).length}</strong> marked as test data
        </span>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error instanceof Error ? error.message : 'Failed to load organizations'}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Organizations List */}
      {!isLoading && filteredOrganizations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-lg">
          <Building2 className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium">No organizations found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {!isLoading && filteredOrganizations.length > 0 && (
        <div className="space-y-3">
          {filteredOrganizations.map((org: Organization) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-medium truncate">{org.name}</h4>
                  {org.is_test && (
                    <Badge variant="destructive" className="text-xs">
                      TEST
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{org.domain}</span>
                  <span>•</span>
                  <span>{org.product_count} products</span>
                  <span>•</span>
                  <span>{org.user_count} users</span>
                  <span>•</span>
                  <span>{new Date(org.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-4">
                {/* Test Data Toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id={`test-${org.id}`}
                    checked={org.is_test}
                    onCheckedChange={(checked) =>
                      markAsTestMutation.mutate({
                        orgId: org.id,
                        isTest: checked,
                      })
                    }
                    disabled={markAsTestMutation.isPending}
                  />
                  <Label
                    htmlFor={`test-${org.id}`}
                    className="text-sm cursor-pointer whitespace-nowrap"
                  >
                    Test Data
                  </Label>
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadDeletePreview(org)}
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
              Confirm Organization Deletion
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to delete{' '}
                  <strong>{deletePreview?.organization.name}</strong>?
                </p>

                {deletePreview && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Eye className="w-4 h-4" />
                      Related Data Preview
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Products:</span>
                        <Badge variant="outline">{deletePreview.relatedData.products}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Users:</span>
                        <Badge variant="outline">{deletePreview.relatedData.users}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Campaigns:</span>
                        <Badge variant="outline">{deletePreview.relatedData.campaigns}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>RFQs:</span>
                        <Badge variant="outline">{deletePreview.relatedData.rfqs}</Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-background rounded">
                        <span>Subscriptions:</span>
                        <Badge variant="outline">{deletePreview.relatedData.subscriptions}</Badge>
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
                    related products, users, campaigns, RFQs, subscriptions, and documents will be
                    permanently deleted.
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
                  deleteOrganizationMutation.mutate(deletePreview.organization.id)
                }
              }}
              disabled={deleteOrganizationMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrganizationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Organization'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

