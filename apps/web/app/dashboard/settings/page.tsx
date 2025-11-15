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
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

        <div className="relative">
          <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
            <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
                Manage your organization settings
              </p>
            </div>
          </section>
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <p className="text-sm text-muted-foreground font-normal">No organization found.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2 font-normal">
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
    </div>
  )
}
