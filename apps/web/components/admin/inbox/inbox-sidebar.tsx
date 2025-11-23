'use client'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { 
  Inbox, 
  Mail, 
  Filter, 
  Search,
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface InboxSidebarProps {
  currentFilter: 'ALL' | 'UNREAD'
  onFilterChange: (filter: 'ALL' | 'UNREAD') => void
  selectedClientId: number | null
  onClientChange: (clientId: number | null) => void
}

export function InboxSidebar({ 
  currentFilter, 
  onFilterChange,
  selectedClientId,
  onClientChange
}: InboxSidebarProps) {
  const [clients, setClients] = useState<any[]>([])

  useEffect(() => {
    // Fetch clients for filter
    fetch('/api/admin/organizations')
      .then(res => res.json())
      .then(data => setClients(data.organizations || []))
      .catch(console.error)
  }, [])

  return (
    <div className="flex flex-col h-full py-4">
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search inbox..." className="pl-8" />
        </div>
      </div>

      <div className="space-y-1 px-2">
        <Button
          variant={currentFilter === 'ALL' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onFilterChange('ALL')}
        >
          <Inbox className="mr-2 h-4 w-4" />
          All Messages
        </Button>
        <Button
          variant={currentFilter === 'UNREAD' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onFilterChange('UNREAD')}
        >
          <Mail className="mr-2 h-4 w-4" />
          Unread
        </Button>
      </div>

      <div className="mt-6 px-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center">
          <Briefcase className="h-3 w-3 mr-1" />
          Clients
        </h3>
        <ScrollArea className="h-[300px]">
          <div className="space-y-1">
            <Button
              variant={selectedClientId === null ? 'secondary' : 'ghost'}
              className="w-full justify-start text-sm h-8"
              onClick={() => onClientChange(null)}
            >
              All Clients
            </Button>
            {clients.map(client => (
              <Button
                key={client.id}
                variant={selectedClientId === client.id ? 'secondary' : 'ghost'}
                className="w-full justify-start text-sm h-8 truncate"
                onClick={() => onClientChange(client.id)}
              >
                {client.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

