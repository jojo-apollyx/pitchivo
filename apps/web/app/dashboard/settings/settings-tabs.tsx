'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Sparkles, Users } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { OrganizationSettingsForm } from './organization-settings-form'
import { PersonalizationSettings } from '@/components/dashboard/personalization-settings'
import { TeamMembersList } from './team-members-list'
import { THEME_PRESETS } from '@/lib/stores/theme-store'

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

  // Find the current style ID based on organization colors
  const currentStyleId = useMemo(() => {
    if (!organization.primary_color) return 'minimalism'
    
    // Find matching theme preset by comparing colors
    const matchingPreset = THEME_PRESETS.find(preset => 
      preset.preview.primary.toLowerCase() === organization.primary_color?.toLowerCase()
    )
    
    return matchingPreset?.id || 'minimalism'
  }, [organization.primary_color])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="organization" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">Organization</span>
        </TabsTrigger>
        <TabsTrigger value="personalization" className="gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Personalization</span>
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Team</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="organization" className="mt-0">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <motion.h2 
              className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Building2 className="h-5 w-5 text-primary-dark" />
              Organization Information
            </motion.h2>
            <motion.p 
              className="text-sm text-muted-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              Basic information about your organization
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <OrganizationSettingsForm 
              organization={organization} 
              userRole={userRole} 
            />
          </motion.div>
        </motion.div>
      </TabsContent>

      <TabsContent value="personalization" className="mt-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <PersonalizationSettings
            organizationId={organization.id}
            currentStyleId={currentStyleId}
          />
        </motion.div>
      </TabsContent>

      <TabsContent value="team" className="mt-0">
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div>
            <motion.h2 
              className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Users className="h-5 w-5 text-primary-dark" />
              Team Members
            </motion.h2>
            <motion.p 
              className="text-sm text-muted-foreground mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              View all members of your organization
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TeamMembersList members={members} />
          </motion.div>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}

