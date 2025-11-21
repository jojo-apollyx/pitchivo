'use client'

import { useState } from 'react'
import { BarChart3, List } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverallStatistics } from '@/components/admin/overall-statistics'
import { CampaignList } from '@/components/admin/campaign-list'

export default function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState('statistics')

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section id="admin-campaigns-header-section" className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight">
                  Campaign Management
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Admin overview - All campaigns use Smartlead
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content with Tabs */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 max-w-xl mx-auto">
                <TabsTrigger value="statistics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Overall Statistics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="gap-2">
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Campaign List</span>
                  <span className="sm:hidden">Campaigns</span>
                </TabsTrigger>
              </TabsList>

              {/* Statistics Tab */}
              <TabsContent value="statistics" className="space-y-6">
                <OverallStatistics />
              </TabsContent>

              {/* Campaign List Tab */}
              <TabsContent value="campaigns" className="space-y-6">
                <CampaignList />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  )
}
