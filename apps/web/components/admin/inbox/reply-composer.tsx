'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Paperclip, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ReplyComposerProps {
  leadId: string
  emailStatsId: string
  replyMessageId: string
  onSent: () => void
}

export function ReplyComposer({ 
  leadId, 
  emailStatsId, 
  replyMessageId,
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
          lead_id: leadId,
          email_stats_id: emailStatsId,
          reply_email_body: body,
          reply_message_id: replyMessageId,
          add_signature: true
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send reply')
      }

      toast.success('Reply sent successfully')
      setBody('')
      onSent()
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

