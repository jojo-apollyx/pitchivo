'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { InboxThread } from './types'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface MessageListProps {
  threads: InboxThread[]
  selectedThreadId: string | null
  onSelectThread: (id: string) => void
  isLoading: boolean
}

export function MessageList({ 
  threads, 
  selectedThreadId, 
  onSelectThread,
  isLoading 
}: MessageListProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
        <p>No messages found</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col divide-y divide-border/50">
        {threads.map((thread) => {
          const isSelected = selectedThreadId === thread.lead_id
          const lastMessage = thread.messages[thread.messages.length - 1]
          
          return (
            <button
              key={thread.lead_id}
              className={cn(
                "flex flex-col items-start gap-1 p-4 text-left hover:bg-accent/50 transition-colors",
                isSelected && "bg-accent",
                !thread.is_read && "bg-primary/5"
              )}
              onClick={() => onSelectThread(thread.lead_id)}
            >
              <div className="flex w-full items-center justify-between">
                <span className={cn("font-semibold text-sm", !thread.is_read && "text-primary")}>
                  {thread.lead.first_name} {thread.lead.last_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="text-xs text-muted-foreground truncate w-full">
                {thread.lead.company_name}
              </div>
              
              <div className="text-sm font-medium truncate w-full mt-1">
                {lastMessage?.subject || '(No Subject)'}
              </div>
              
              <div className="text-xs text-muted-foreground line-clamp-2 w-full">
                {lastMessage?.email_body.replace(/<[^>]*>/g, '') || ''}
              </div>
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

