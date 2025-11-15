'use client'

import { useState } from 'react'
import { Building2, Palette, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrganizationSettingsForm } from './organization-settings-form'
import { ThemeColorSettings } from '@/components/dashboard/theme-color-settings'
import { TeamMembersList } from './team-members-list'

interface TeamMember {
  email: string
  fullName: string | null
  orgRole: string | null
  userId: string
}

interface SettingsTabsProps {
  organization: {
    id: string
    name: string
    domain: string
    industry: string | null
    company_size: string | null
    description: string | null
    pitchivo_domain: string | null
    primary_color: string | null
    secondary_color: string | null
    accent_color: string | null
  }
  userRole: string | null
  members: TeamMember[]
}

export function SettingsTabs({ organization, userRole, members }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState('organization')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="organization" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Organization</span>
        </TabsTrigger>
        <TabsTrigger value="theme" className="gap-2">
          <Palette className="h-4 w-4" />
          <span className="hidden sm:inline">Theme</span>
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Team</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="organization" className="mt-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Organization Information
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Basic information about your organization
            </p>
          </div>
          <OrganizationSettingsForm 
            organization={organization} 
            userRole={userRole} 
          />
        </div>
      </TabsContent>

      <TabsContent value="theme" className="mt-0">
        <div className="space-y-6">
          <ThemeColorSettings
            organizationId={organization.id}
            currentScheme={{
              primary: organization.primary_color || '#10B981',
              secondary: organization.secondary_color || '#059669',
              accent: organization.accent_color || '#F87171',
            }}
          />
        </div>
      </TabsContent>

      <TabsContent value="team" className="mt-0">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              View all members of your organization
            </p>
          </div>
          <TeamMembersList members={members} />
        </div>
      </TabsContent>
    </Tabs>
  )
}

