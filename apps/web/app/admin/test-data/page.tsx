'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { Loader2, Trash2, Eye, AlertTriangle, CheckCircle2, Database } from 'lucide-react'

interface TestDataPreview {
  tables: Record<string, { count: number; ids: string[] }>
  totalRecords: number
}

interface DeleteResult {
  tables: Record<string, number>
  totalDeleted: number
}

export default function TestDataManagementPage() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<TestDataPreview | null>(null)
  const [deleteResult, setDeleteResult] = useState<DeleteResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Load preview of test data
  const loadPreview = async () => {
    setLoading(true)
    setError(null)
    setDeleteResult(null)

    try {
      const response = await fetch('/api/admin/test-data')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load test data preview')
      }

      setPreview(data.preview)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview')
      console.error('Error loading preview:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete all test data
  const deleteTestData = async () => {
    setLoading(true)
    setError(null)
    setShowConfirmDialog(false)

    try {
      const response = await fetch('/api/admin/test-data', {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete test data')
      }

      setDeleteResult(data.deleted)
      setPreview(null) // Clear preview after successful deletion
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete test data')
      console.error('Error deleting test data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Table display name mapping
  const tableDisplayNames: Record<string, string> = {
    organizations: 'Organizations',
    products: 'Products',
    campaigns: 'Campaigns',
    product_rfqs: 'RFQs',
    scheduled_emails: 'Scheduled Emails',
    email_templates: 'Email Templates',
    campaign_activities: 'Campaign Activities',
    email_quality_scores: 'Email Quality Scores',
    document_extractions: 'Document Extractions',
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Data Management</h1>
        <p className="text-muted-foreground">
          Preview and clean up test data from the database. All related records will be deleted automatically.
        </p>
      </div>

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Preview test data before deletion to see what will be removed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={loadPreview}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Preview Test Data
            </Button>

            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={loading || !preview || preview.totalRecords === 0}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Test Data
            </Button>
          </div>

          {/* Info Alert */}
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This will permanently delete all records marked with{' '}
              <code className="bg-muted px-1 py-0.5 rounded">is_test = true</code> and all their
              related data. This action cannot be undone.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Display */}
      {deleteResult && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Successfully deleted {deleteResult.totalDeleted} test records!
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Results */}
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Test Data Preview</span>
              <Badge variant={preview.totalRecords > 0 ? 'destructive' : 'secondary'}>
                {preview.totalRecords} Total Records
              </Badge>
            </CardTitle>
            <CardDescription>
              Records that will be deleted when you click "Delete All Test Data"
            </CardDescription>
          </CardHeader>
          <CardContent>
            {preview.totalRecords === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No test data found</p>
                <p className="text-sm">Your database is clean!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(preview.tables)
                  .filter(([_, data]) => data.count > 0)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([tableName, data]) => (
                    <div
                      key={tableName}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {tableDisplayNames[tableName] || tableName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {data.count} record{data.count !== 1 ? 's' : ''} will be deleted
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        {data.count}
                      </Badge>
                    </div>
                  ))}

                <div className="pt-4 border-t">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> Deleting these {preview.totalRecords} records is
                      permanent and cannot be undone. Make sure you want to proceed before
                      confirming.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Delete Results */}
      {deleteResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              Deletion Summary
            </CardTitle>
            <CardDescription>Successfully removed test data from the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(deleteResult.tables)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([tableName, count]) => (
                  <div
                    key={tableName}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <span className="font-medium">
                      {tableDisplayNames[tableName] || tableName}
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {count} deleted
                    </Badge>
                  </div>
                ))}

              <div className="pt-4 border-t mt-4">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Records Deleted</span>
                  <Badge className="text-base px-4 py-1">{deleteResult.totalDeleted}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Test Data Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{preview?.totalRecords}</strong> test
                records?
              </p>
              <p className="text-destructive font-medium">
                This action is permanent and cannot be undone!
              </p>
              <p className="text-sm">
                All related data (emails, activities, documents, etc.) will also be deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTestData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete All Test Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

