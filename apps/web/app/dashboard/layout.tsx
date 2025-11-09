import { requireAuth, getUserProfile } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { ThemeProvider } from '@/components/dashboard/theme-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)
  const organization = profile?.organizations
  
  // Get color scheme from organization (defaults to Emerald Spark)
  const colorScheme = {
    primary: organization?.primary_color || '#10B981',
    secondary: organization?.secondary_color || '#059669',
    accent: organization?.accent_color || '#F87171',
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider colorScheme={colorScheme} />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
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

