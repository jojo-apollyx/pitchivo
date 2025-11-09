import { getEffectiveUserAndProfile } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save } from 'lucide-react'
import { ThemeColorSettings } from '@/components/dashboard/theme-color-settings'

export default async function SettingsPage() {
  const { organization } = await getEffectiveUserAndProfile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Organization Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your organization information and preferences
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl">
          {/* Organization Information */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Organization Information</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Basic information about your organization
            </p>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  defaultValue={organization?.company_name || ''} 
                  disabled
                  className="transition-all duration-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="domain">Domain</Label>
                <Input 
                  id="domain" 
                  defaultValue={organization?.domain || ''} 
                  disabled
                  className="transition-all duration-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Input 
                  id="industry" 
                  defaultValue={organization?.industry || ''} 
                  disabled
                  className="transition-all duration-300"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-size">Company Size</Label>
                <Input 
                  id="company-size" 
                  defaultValue={organization?.company_size || ''} 
                  disabled
                  className="transition-all duration-300"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20" disabled>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </section>

          {/* Team Members */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="text-center w-full">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Team Members</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage team members and their access
              </p>
              <p className="text-sm text-muted-foreground">
                Team management coming soon
              </p>
            </div>
          </section>

          {/* Brand Color Settings */}
          {organization?.id && (
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <ThemeColorSettings
                organizationId={organization.id}
                currentScheme={{
                  primary: organization.primary_color || '#10B981',
                  secondary: organization.secondary_color || '#059669',
                  accent: organization.accent_color || '#F87171',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

