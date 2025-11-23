'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReplyComposerProps {
  campaignId: string | number
  emailStatsId: string
  replyMessageId: string
  replyEmailTime: string
  replyEmailBody: string
  onSent: (sentMessage?: { body: string; timestamp: string }) => void | (() => void)
}

export function ReplyComposer({ 
  campaignId,
  emailStatsId, 
  replyMessageId,
  replyEmailTime,
  replyEmailBody,
  onSent 
}: ReplyComposerProps) {
  const [body, setBody] = useState('')
  const [isSending, setIsSending] = useState(false)

  async function handleSend() {
    if (!body.trim()) return

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          email_stats_id: emailStatsId,
          email_body: body, // The reply content
          reply_message_id: replyMessageId,
          reply_email_time: replyEmailTime,
          reply_email_body: replyEmailBody, // The original email body
          add_signature: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send reply')
      }

      const sentBody = body.trim()
      toast.success('Reply sent successfully')
      setBody('')
      
      // Optimistically add the sent message to the UI immediately
      const now = new Date().toISOString()
      onSent({ body: sentBody, timestamp: now })
      
      // Wait longer for Smartlead to process and add to email_history
      // Smartlead queues the email, so we need to wait for it to appear in history
      setTimeout(() => {
        onSent() // Refresh from API
      }, 3000) // Increased to 3 seconds
      
      // Also refresh again after a longer delay to catch delayed updates
      setTimeout(() => {
        onSent() // Refresh from API again
      }, 8000) // Refresh again after 8 seconds
    } catch (error: any) {
      console.error('Send error:', error)
      toast.error(error.message || 'Failed to send reply')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Write your reply..."
        className="min-h-[120px] resize-none"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        disabled={isSending}
      />
      
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" disabled={isSending}>
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <Button 
          onClick={handleSend} 
          disabled={!body.trim() || isSending}
          className="gap-2"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send Reply
        </Button>
      </div>
    </div>
  )
}

