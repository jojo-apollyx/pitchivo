import { getEffectiveUserAndProfile } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Save } from 'lucide-react'
import { ThemeColorSettings } from '@/components/dashboard/theme-color-settings'

export default async function SettingsPage() {
  const { organization } = await getEffectiveUserAndProfile()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your organization information and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>
              Basic information about your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input 
                id="company-name" 
                defaultValue={organization?.company_name || ''} 
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <Input 
                id="domain" 
                defaultValue={organization?.domain || ''} 
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="industry">Industry</Label>
              <Input 
                id="industry" 
                defaultValue={organization?.industry || ''} 
                disabled
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company-size">Company Size</Label>
              <Input 
                id="company-size" 
                defaultValue={organization?.company_size || ''} 
                disabled
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button className="gap-2" disabled>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage team members and their access
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Team management coming soon
            </p>
          </CardContent>
        </Card>

        {/* Brand Color Settings */}
        {organization?.id && (
          <ThemeColorSettings
            organizationId={organization.id}
            currentScheme={{
              primary: organization.primary_color || '#10B981',
              secondary: organization.secondary_color || '#059669',
              accent: organization.accent_color || '#F87171',
            }}
          />
        )}
      </div>
    </div>
  )
}

