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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
          <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your organization settings
            </p>
          </div>
        </section>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-muted-foreground text-sm">No organization found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      {/* Page Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold">Settings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your organization settings and preferences
          </p>
        </div>
      </section>

      {/* Tabs Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 bg-background/60 backdrop-blur-sm min-h-[500px]">
        <SettingsTabs
          organization={organization}
          userRole={profile?.org_role || null}
          members={members}
        />
      </section>
    </div>
  )
}
