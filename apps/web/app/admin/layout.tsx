import { requireAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminTopbar } from '@/components/admin/admin-topbar'
import { ThemeProvider } from '@/components/dashboard/theme-provider'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireAdmin()
  
  // Get color scheme from organization (defaults to Emerald Spark)
  const colorScheme = {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#F87171',
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider colorScheme={colorScheme} />
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <AdminSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Topbar */}
          <AdminTopbar user={user} />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

