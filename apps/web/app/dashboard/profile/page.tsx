import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Save, Upload } from 'lucide-react'

export default async function ProfilePage() {
  const user = await requireAuth()

  const fullName = user.user_metadata?.full_name || ''
  const avatarUrl = user.user_metadata?.avatar_url
  const initials = (fullName || user.email?.split('@')[0] || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold">My Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Update your profile details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" className="gap-2" disabled>
                  <Upload className="h-4 w-4" />
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max size 2MB
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input 
                  id="full-name" 
                  defaultValue={fullName} 
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  defaultValue={user.email || ''} 
                  disabled
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input 
                  id="role" 
                  placeholder="e.g., Sales Manager" 
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button className="gap-2" disabled>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Notification settings coming soon
            </p>
          </CardContent>
        </Card>

        {/* Language & Region */}
        <Card>
          <CardHeader>
            <CardTitle>Language & Region</CardTitle>
            <CardDescription>
              Set your language and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            <p className="text-muted-foreground text-center">
              Language settings coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

