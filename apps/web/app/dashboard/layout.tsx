import { getEffectiveUserAndProfile, getUserProfile, requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { ThemeProvider } from '@/components/dashboard/theme-provider'
import { ImpersonateBarServer } from '@/components/admin/impersonate-bar-server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get effective user and profile (handles impersonation automatically)
  const { user: effectiveUser, organization } = await getEffectiveUserAndProfile()
  
  // Get actual profile to check admin status (for sidebar)
  const actualUser = await requireAuth()
  const actualProfile = await getUserProfile(actualUser.id)
  
  // Get color scheme from organization (defaults to Emerald Spark)
  const colorScheme = {
    primary: organization?.primary_color || '#10B981',
    secondary: organization?.secondary_color || '#059669',
    accent: organization?.accent_color || '#F87171',
  }

  // Check if user is admin (use actual profile, not effective)
  const isAdmin = actualProfile?.is_pitchivo_admin ?? false

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider colorScheme={colorScheme} />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar isAdmin={isAdmin} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Impersonate Warning Bar (if admin is impersonating) */}
          <ImpersonateBarServer />
          
          {/* Topbar */}
          <Topbar user={effectiveUser} />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  )
}

