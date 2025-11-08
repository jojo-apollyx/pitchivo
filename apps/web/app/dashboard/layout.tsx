import { requireAuth } from '@/lib/auth'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { MobileNav } from '@/components/dashboard/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-background">
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

