'use client'

import { MasterInbox } from '@/components/admin/inbox/master-inbox'

export default function AdminInboxPage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-4 lg:p-8 bg-background">
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Master Inbox</h1>
          <p className="text-muted-foreground">
            Manage communications across all client campaigns
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          <MasterInbox />
        </div>
      </div>
    </div>
  )
}

