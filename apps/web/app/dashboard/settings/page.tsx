import { getEffectiveUserAndProfile } from '@/lib/auth'
import { getOrganizationMembers } from '@/lib/emails/utils/organization'
import { SettingsTabs } from './settings-tabs'

export default async function SettingsPage() {
  const { organization, profile } = await getEffectiveUserAndProfile()
  
  // Fetch organization members
  const members = organization 
    ? await getOrganizationMembers(organization.id)
    : []

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your organization settings
            </p>
          </div>
        </section>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-muted-foreground">No organization found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage your organization information and preferences
          </p>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <SettingsTabs
          organization={organization}
          userRole={profile?.org_role || null}
          members={members}
        />
      </section>
    </div>
  )
}
