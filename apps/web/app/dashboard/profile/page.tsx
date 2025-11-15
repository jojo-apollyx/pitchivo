import { requireAuth } from '@/lib/auth'
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">My Profile</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage your personal information and preferences
            </p>
          </div>
        </section>

        {/* Content */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 max-w-4xl">
          {/* Profile Information */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold">Personal Information</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Update your profile details
            </p>
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                  <AvatarImage src={avatarUrl} alt={fullName} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20" disabled>
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
                    className="transition-all duration-300"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email"
                    defaultValue={user.email || ''} 
                    disabled
                    className="transition-all duration-300"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input 
                    id="role" 
                    placeholder="e.g., Sales Manager" 
                    disabled
                    className="transition-all duration-300"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20" disabled>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="text-center w-full">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Notification Preferences</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how you want to be notified
              </p>
              <p className="text-sm text-muted-foreground">
                Notification settings coming soon
              </p>
            </div>
          </section>

          {/* Language & Region */}
          <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 min-h-[200px] flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
            <div className="text-center w-full">
              <h2 className="text-lg sm:text-xl font-semibold mb-2">Language & Region</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Set your language and regional preferences
              </p>
              <p className="text-sm text-muted-foreground">
                Language settings coming soon
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

