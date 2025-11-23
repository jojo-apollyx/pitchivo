'use client'

import { InboxThread } from './types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ReplyComposer } from './reply-composer'
import { Badge } from '@/components/ui/badge'
import { Building2, User, Mail, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  // Find the last REPLY message (the one we're replying to)
  const lastReplyMessage = thread.messages
    .filter(m => m.type === 'REPLY')
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())[0]
  
  // Find the last SENT message (to get the original email_stats_id for the thread)
  const lastSentMessage = thread.messages
    .filter(m => m.type === 'SENT')
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime())[0]
  
  const lastMessage = thread.messages[thread.messages.length - 1]

  // Sort messages by time (oldest first for conversation view)
  const sortedMessages = [...thread.messages].sort((a, b) => 
    new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
  )

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border/50 bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">
                {lastMessage?.subject || '(No Subject)'}
              </h2>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="gap-1.5 text-xs">
                <User className="h-3 w-3" />
                {thread.lead.first_name} {thread.lead.last_name || 'Unknown'}
              </Badge>
              {thread.lead.company_name && (
                <Badge variant="outline" className="gap-1.5 text-xs">
                  <Building2 className="h-3 w-3" />
                  {thread.lead.company_name}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{thread.lead.email}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {sortedMessages.map((message, index) => {
            const isSent = message.type === 'SENT'
            const isLast = index === sortedMessages.length - 1
            const prevMessage = index > 0 ? sortedMessages[index - 1] : null
            const showSender = !prevMessage || prevMessage.type !== message.type
            
            return (
              <div 
                key={`${message.id}-${index}`}
                className={`flex gap-3 ${isSent ? 'justify-end' : 'justify-start'}`}
              >
                {!isSent && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {thread.lead.first_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col gap-1.5 ${isSent ? 'items-end' : 'items-start'} flex-1 ${isSent ? 'max-w-[75%]' : 'max-w-[75%]'}`}>
                  {showSender && (
                    <div className={`flex items-center gap-2 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="text-xs font-medium text-foreground">
                        {isSent ? 'You' : `${thread.lead.first_name} ${thread.lead.last_name || ''}`.trim()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.received_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  )}
                  
                  <div 
                    className={`rounded-lg px-4 py-2.5 text-sm shadow-sm border ${
                      isSent 
                        ? 'bg-primary text-primary-foreground border-primary/20' 
                        : 'bg-card border-border/50'
                    }`}
                  >
                    <div 
                      className={isSent ? 'text-primary-foreground' : 'text-foreground'}
                      dangerouslySetInnerHTML={{ __html: message.email_body }} 
                    />
                  </div>
                </div>
                
                {isSent && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      Y
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Composer */}
      <div className="px-6 py-4 border-t border-border/50 bg-card">
        {lastReplyMessage && lastSentMessage ? (
          <ReplyComposer 
            campaignId={lastReplyMessage.campaign_id}
            emailStatsId={lastSentMessage.email_stats_id || lastSentMessage.stats_id || ''}
            replyMessageId={lastReplyMessage.message_id || lastReplyMessage.id || ''}
            replyEmailTime={lastReplyMessage.received_at || lastReplyMessage.time || ''}
            replyEmailBody={lastReplyMessage.email_body || ''}
            onSent={onRefresh}
          />
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            No reply available for this thread
          </div>
        )}
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

