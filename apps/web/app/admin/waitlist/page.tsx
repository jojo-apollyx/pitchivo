'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { createWaitlistColumns } from './columns'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { sendInvitationEmail } from '@/lib/email'
import { motion } from 'framer-motion'
import type { WaitlistEntry } from './types'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch waitlist data
async function fetchWaitlist() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export default function AdminWaitlistPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { openDialog, closeDialog, isDialogOpen, getDialogData } = useUIStore()

  // Fetch data with TanStack Query
  const { data: waitlist = [], isLoading } = useQuery({
    queryKey: ['admin', 'waitlist'],
    queryFn: fetchWaitlist,
  })

  // Filter by status
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'invited' | 'approved' | 'rejected'>('all')
  
  const filteredWaitlist = useMemo(() => {
    return waitlist.filter(entry => {
      return filterStatus === 'all' || entry.status === filterStatus
    })
  }, [waitlist, filterStatus])

  // Handlers
  const handleInvite = (entry: WaitlistEntry) => {
    openDialog('invite', entry)
  }

  const confirmInvite = async () => {
    const entry = getDialogData('invite') as WaitlistEntry
    if (!entry) return

    try {
      console.log('📧 Starting invitation process:', {
        email: entry.email,
        fullName: entry.full_name,
        company: entry.company,
        timestamp: new Date().toISOString(),
      })

      const emailResult = await sendInvitationEmail({
        to: entry.email,
        fullName: entry.full_name,
        company: entry.company,
      })

      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.error)
        toast.error(`Failed to send email: ${emailResult.error}`)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('waitlist')
        .update({ 
          status: 'invited',
          invited_at: new Date().toISOString(),
          invited_by: user?.id || null,
          invitation_email_sent_at: new Date().toISOString(),
        })
        .eq('id', entry.id)

      if (error) throw error

      console.log('✅ Invitation completed successfully:', {
        email: entry.email,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString(),
      })

      toast.success('Invitation sent successfully')
      closeDialog('invite')
      queryClient.invalidateQueries({ queryKey: ['admin', 'waitlist'] })
    } catch (error) {
      console.error('❌ Error sending invite:', error)
      toast.error('Failed to send invitation')
    }
  }

  const handleApprove = async (entry: WaitlistEntry) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .update({ status: 'approved' })
        .eq('id', entry.id)

      if (error) throw error

      toast.success('Entry approved and moved to whitelist')
      queryClient.invalidateQueries({ queryKey: ['admin', 'waitlist'] })
    } catch (error) {
      console.error('Error approving entry:', error)
      toast.error('Failed to approve entry')
    }
  }

  const handleBlock = (entry: WaitlistEntry) => {
    openDialog('block', entry)
  }

  const confirmBlock = async () => {
    const entry = getDialogData('block') as WaitlistEntry
    if (!entry) return

    try {
      const domain = entry.email.split('@')[1]
      
      const { data: existingDomain, error: checkError } = await supabase
        .from('email_domain_policy')
        .select('*')
        .eq('domain', domain)
        .maybeSingle()

      if (checkError) throw checkError

      if (existingDomain) {
        const { error: updateError } = await supabase
          .from('email_domain_policy')
          .update({
            status: 'blocked',
            is_public_domain: false,
            reason: 'Blocked from waitlist',
          })
          .eq('domain', domain)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('email_domain_policy')
          .insert({
            domain,
            status: 'blocked',
            is_public_domain: false,
            reason: 'Blocked from waitlist',
          })

        if (insertError) throw insertError
      }

      const { error: waitlistError } = await supabase
        .from('waitlist')
        .update({ status: 'rejected' })
        .eq('id', entry.id)

      if (waitlistError) throw waitlistError

      toast.success('Domain blocked successfully')
      closeDialog('block')
      queryClient.invalidateQueries({ queryKey: ['admin', 'waitlist'] })
    } catch (error) {
      console.error('Error blocking domain:', error)
      toast.error('Failed to block domain')
    }
  }

  const handleResendInvite = async (entry: WaitlistEntry) => {
    try {
      console.log('📧 Resending invitation:', {
        email: entry.email,
        fullName: entry.full_name,
        company: entry.company,
        timestamp: new Date().toISOString(),
      })

      const emailResult = await sendInvitationEmail({
        to: entry.email,
        fullName: entry.full_name,
        company: entry.company,
      })

      if (!emailResult.success) {
        console.error('❌ Email resending failed:', emailResult.error)
        toast.error(`Failed to resend email: ${emailResult.error}`)
        return
      }

      const { error } = await supabase
        .from('waitlist')
        .update({ 
          invitation_email_sent_at: new Date().toISOString(),
        })
        .eq('id', entry.id)

      if (error) throw error

      console.log('✅ Invitation resent successfully:', {
        email: entry.email,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString(),
      })

      toast.success('Invitation resent successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'waitlist'] })
    } catch (error) {
      console.error('❌ Error resending invite:', error)
      toast.error('Failed to resend invitation')
    }
  }

  const handleRestoreRejected = async (entry: WaitlistEntry) => {
    try {
      const domain = entry.email.split('@')[1]
      
      const { error: domainError } = await supabase
        .from('email_domain_policy')
        .update({ status: 'allowed' })
        .eq('domain', domain)
        .eq('status', 'blocked')

      if (domainError) throw domainError

      const { error: waitlistError } = await supabase
        .from('waitlist')
        .update({ status: 'pending' })
        .eq('id', entry.id)

      if (waitlistError) throw waitlistError

      toast.success('Entry restored and domain unblocked')
      queryClient.invalidateQueries({ queryKey: ['admin', 'waitlist'] })
    } catch (error) {
      console.error('Error restoring entry:', error)
      toast.error('Failed to restore entry')
    }
  }

  const columns = useMemo(
    () => createWaitlistColumns(
      handleInvite,
      handleApprove,
      handleResendInvite,
      handleBlock,
      handleRestoreRejected
    ),
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background"
    >
      {/* Page Header - Integral Section */}
      <motion.section
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50"
      >
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Waitlist Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage waitlist entries and send invitations
          </p>
        </div>
      </motion.section>

      {/* Search and Filters - Integral Section */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="min-h-[36px]"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
              className="min-h-[36px]"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'invited' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('invited')}
              className="min-h-[36px]"
            >
              Invited
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('approved')}
              className="min-h-[36px]"
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('rejected')}
              className="min-h-[36px]"
            >
              Rejected
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Waitlist Table - Integral Section */}
      <motion.section
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
      >
        <DataTable
          columns={columns}
          data={filteredWaitlist}
          searchKey="email"
          searchPlaceholder="Search by email, name, company, or role..."
          loading={isLoading}
          emptyMessage="No waitlist entries found"
        />
      </motion.section>

      {/* Invite Confirmation Dialog */}
      <Dialog
        open={isDialogOpen('invite')}
        onOpenChange={(open) => open ? null : closeDialog('invite')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation email to <strong>{(getDialogData('invite') as WaitlistEntry)?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('invite')}
            >
              Cancel
            </Button>
            <Button onClick={confirmInvite}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Confirmation Dialog */}
      <Dialog
        open={isDialogOpen('block')}
        onOpenChange={(open) => open ? null : closeDialog('block')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Domain</DialogTitle>
            <DialogDescription>
              Block the domain <strong>{(getDialogData('block') as WaitlistEntry)?.email.split('@')[1]}</strong>? 
              This will prevent all emails from this domain from registering.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('block')}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBlock}
            >
              Block Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
