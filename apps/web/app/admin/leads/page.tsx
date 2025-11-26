'use client'

import { useState } from 'react'
import { Database, Settings, BarChart3 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EnrichmentSupplierTab } from './components/EnrichmentSupplierTab'
import { DataAnalysisTab } from './components/DataAnalysisTab'

export default function AdminLeadsPage() {
  const [activeTab, setActiveTab] = useState('suppliers')

  return (
    <main className="min-h-screen bg-background relative overflow-hidden">
      <div className="relative">
        {/* Header */}
        <section className="px-4 sm:px-6 lg:px-8 py-8 border-b border-border/30 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-accent-surface flex items-center justify-center">
                <Database className="h-6 w-6 text-primary-dark" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Leads Management</h1>
                <p className="text-muted-foreground mt-1">
                  Manage enrichment suppliers, API keys, and analyze lead data
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content with Tabs */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-2xl mx-auto">
                <TabsTrigger value="suppliers" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Enrichment Suppliers</span>
                  <span className="sm:hidden">Suppliers</span>
                </TabsTrigger>
                <TabsTrigger value="analysis" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Data Analysis</span>
                  <span className="sm:hidden">Analysis</span>
                </TabsTrigger>
              </TabsList>

              {/* Enrichment Suppliers Tab */}
              <TabsContent value="suppliers" className="space-y-6">
                <EnrichmentSupplierTab />
              </TabsContent>

              {/* Data Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                <DataAnalysisTab />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  )
}

