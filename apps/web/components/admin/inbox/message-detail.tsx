'use client'

import { InboxThread } from './types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ReplyComposer } from './reply-composer'
import { Badge } from '@/components/ui/badge'
import { Building2, User } from 'lucide-react'

interface MessageDetailProps {
  thread: InboxThread | null
  onRefresh: () => void
}

export function MessageDetail({ thread, onRefresh }: MessageDetailProps) {
  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MailIcon className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">Select a conversation</p>
        <p className="text-sm">Choose a thread from the list to view details</p>
      </div>
    )
  }

  const lastMessage = thread.messages[thread.messages.length - 1]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {lastMessage?.subject || '(No Subject)'}
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                {thread.lead.first_name} {thread.lead.last_name}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Building2 className="h-3 w-3" />
                {thread.lead.company_name}
              </Badge>
              <span>&bull;</span>
              <span className="text-xs">{thread.lead.email}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Client: <span className="font-medium text-foreground">{thread.lead.client_id}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8">
          {thread.messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex flex-col gap-2 max-w-3xl ${
                message.type === 'SENT' ? 'ml-auto items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">
                  {message.type === 'SENT' ? 'You' : thread.lead.first_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(message.received_at), 'MMM d, h:mm a')}
                </span>
              </div>
              
              <div 
                className={`rounded-lg p-4 text-sm shadow-sm border ${
                  message.type === 'SENT' 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card border-border'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: message.email_body }} />
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="p-4 border-t bg-background">
        <ReplyComposer 
          leadId={thread.lead_id} 
          emailStatsId={lastMessage?.email_stats_id || ''}
          replyMessageId={lastMessage?.id || ''}
          onSent={onRefresh}
        />
      </div>
    </div>
  )
}

function MailIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

