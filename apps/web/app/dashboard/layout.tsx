import { requireAuth, getUserProfile, getOrganizationById } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { ThemeProvider } from '@/components/dashboard/theme-provider'
import { ImpersonateBarWrapper } from '@/components/admin/impersonate-bar-wrapper'

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams?: { impersonate?: string }
}) {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  
  // Check if admin is impersonating an organization
  const impersonateOrgId = searchParams?.impersonate
  let organization = profile?.organizations
  
  if (impersonateOrgId && profile?.is_pitchivo_admin) {
    // Admin is impersonating - load the impersonated organization
    const impersonatedOrg = await getOrganizationById(impersonateOrgId)
    if (impersonatedOrg) {
      organization = impersonatedOrg
    }
  }
  
  // Get color scheme from organization (defaults to Emerald Spark)
  const colorScheme = {
    primary: organization?.primary_color || '#10B981',
    secondary: organization?.secondary_color || '#059669',
    accent: organization?.accent_color || '#F87171',
  }

  // Check if user is admin
  const isAdmin = profile?.is_pitchivo_admin ?? false

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider colorScheme={colorScheme} />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar isAdmin={isAdmin} />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Impersonate Warning Bar (if admin is impersonating) */}
          <ImpersonateBarWrapper />
          
          {/* Topbar */}
          <Topbar user={user} />
          
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

