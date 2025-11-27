import { getEffectiveUserAndProfile } from '@/lib/auth'
import { getOrganizationMembers } from '@/lib/emails/utils/organization'
import { SettingsTabs } from './settings-tabs'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings - Pitchivo',
  description: 'Manage your organization settings, team members, and preferences.',
}

export default async function SettingsPage() {
  const { organization, profile } = await getEffectiveUserAndProfile()
  
  // Fetch organization members
  const members = organization 
    ? await getOrganizationMembers(organization.id)
    : []

  if (!organization) {
    return (
      <main className="min-h-screen bg-background">
        <div className="relative">
          <section id="settings-header-section" className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your organization settings
              </p>
            </div>
          </section>
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <p className="text-sm text-muted-foreground">No organization found.</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="relative">
        {/* Page Header */}
        <section id="settings-header-section" className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your organization information and preferences
            </p>
          </div>
        </section>

        {/* Tabs Content */}
        <section id="settings-tabs-section" className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <SettingsTabs
              organization={organization}
              userRole={profile?.org_role || null}
              members={members}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
