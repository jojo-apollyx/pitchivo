'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, Package, Building2 } from 'lucide-react'
import { ProductTestDataTab } from '@/components/admin/product-test-data-tab'
import { OrganizationTestDataTab } from '@/components/admin/organization-test-data-tab'
import { BulkTestDataTab } from '@/components/admin/bulk-test-data-tab'

export default function TestDataManagementPage() {
  const [activeTab, setActiveTab] = useState('products')

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test Data Management</h1>
        <p className="text-muted-foreground">
          Manage test data across products, organizations, and bulk operations. Mark items as test data and preview related records before deletion.
        </p>
      </main>

      {/* Info Alert */}
      <Alert className="mb-6">
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Data Workflow:</strong>
          <ol className="list-decimal ml-4 mt-2 space-y-1">
            <li>Browse and search products or organizations</li>
            <li>Mark items as test data using the toggle</li>
            <li>Preview related data that will be deleted</li>
            <li>Confirm deletion to remove test data and all dependencies</li>
          </ol>
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="organizations" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Bulk Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Test Data</CardTitle>
              <CardDescription>
                Browse all products, mark as test data, and delete with preview of related campaigns, RFQs, and tracking data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTestDataTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Test Data</CardTitle>
              <CardDescription>
                Browse all organizations, mark as test data, and delete with preview of related products, users, campaigns, and subscriptions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationTestDataTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Test Data Operations</CardTitle>
              <CardDescription>
                Preview and delete all test data at once with cascade deletion of all related records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkTestDataTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
