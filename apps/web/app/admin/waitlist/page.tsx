'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Pagination } from '@/components/ui/pagination'
import { 
  Search, 
  Mail, 
  CheckCircle, 
  Shield,
  RotateCcw
} from 'lucide-react'
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

interface WaitlistEntry {
  id: string
  email: string
  full_name: string
  company: string
  role?: string
  note?: string
  status: 'pending' | 'approved' | 'rejected' | 'invited'
  created_at: string
}

const ITEMS_PER_PAGE = 20

export default function AdminWaitlistPage() {
  const supabase = createClient()
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'invited' | 'approved' | 'rejected'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [inviteDialog, setInviteDialog] = useState<{ open: boolean; entry: WaitlistEntry | null }>({ open: false, entry: null })
  const [blockDialog, setBlockDialog] = useState<{ open: boolean; entry: WaitlistEntry | null }>({ open: false, entry: null })

  useEffect(() => {
    loadWaitlist()
  }, [])

  const loadWaitlist = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setWaitlist(data || [])
    } catch (error) {
      console.error('Error loading waitlist:', error)
      toast.error('Failed to load waitlist')
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = (entry: WaitlistEntry) => {
    setInviteDialog({ open: true, entry })
  }

  const confirmInvite = async () => {
    if (!inviteDialog.entry) return

    try {
      console.log('📧 Starting invitation process:', {
        email: inviteDialog.entry.email,
        fullName: inviteDialog.entry.full_name,
        company: inviteDialog.entry.company,
        timestamp: new Date().toISOString(),
      })

      // Send invitation email
      const emailResult = await sendInvitationEmail({
        to: inviteDialog.entry.email,
        fullName: inviteDialog.entry.full_name,
        company: inviteDialog.entry.company,
      })

      if (!emailResult.success) {
        console.error('❌ Email sending failed:', emailResult.error)
        toast.error(`Failed to send email: ${emailResult.error}`)
        return
      }

      // Update waitlist status and timestamps
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('waitlist')
        .update({ 
          status: 'invited',
          invited_at: new Date().toISOString(),
          invited_by: user?.id || null,
          invitation_email_sent_at: new Date().toISOString(),
        })
        .eq('id', inviteDialog.entry.id)

      if (error) throw error

      console.log('✅ Invitation completed successfully:', {
        email: inviteDialog.entry.email,
        messageId: emailResult.messageId,
        timestamp: new Date().toISOString(),
      })

      toast.success('Invitation sent successfully')
      setInviteDialog({ open: false, entry: null })
      loadWaitlist()
    } catch (error) {
      console.error('❌ Error sending invite:', {
        error,
        email: inviteDialog.entry?.email,
        timestamp: new Date().toISOString(),
      })
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
      loadWaitlist()
    } catch (error) {
      console.error('Error approving entry:', error)
      toast.error('Failed to approve entry')
    }
  }

  const handleBlock = (entry: WaitlistEntry) => {
    setBlockDialog({ open: true, entry })
  }

  const confirmBlock = async () => {
    if (!blockDialog.entry) return

    try {
      const domain = blockDialog.entry.email.split('@')[1]
      
      // Check if domain already exists
      const { data: existingDomain, error: checkError } = await supabase
        .from('email_domain_policy')
        .select('*')
        .eq('domain', domain)
        .maybeSingle()

      if (checkError) throw checkError

      // If domain exists, update it; otherwise insert
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

      // Update waitlist entry
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .update({ status: 'rejected' })
        .eq('id', blockDialog.entry.id)

      if (waitlistError) throw waitlistError

      toast.success('Domain blocked successfully')
      setBlockDialog({ open: false, entry: null })
      loadWaitlist()
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

      // Update invitation timestamp
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
      loadWaitlist()
    } catch (error) {
      console.error('❌ Error resending invite:', {
        error,
        email: entry.email,
        timestamp: new Date().toISOString(),
      })
      toast.error('Failed to resend invitation')
    }
  }

  const handleRestoreRejected = async (entry: WaitlistEntry) => {
    try {
      const domain = entry.email.split('@')[1]
      
      // Unblock the domain in email_domain_policy
      const { error: domainError } = await supabase
        .from('email_domain_policy')
        .update({ status: 'allowed' })
        .eq('domain', domain)
        .eq('status', 'blocked')

      if (domainError) throw domainError

      // Restore waitlist entry to pending
      const { error: waitlistError } = await supabase
        .from('waitlist')
        .update({ status: 'pending' })
        .eq('id', entry.id)

      if (waitlistError) throw waitlistError

      toast.success('Entry restored and domain unblocked')
      loadWaitlist()
    } catch (error) {
      console.error('Error restoring entry:', error)
      toast.error('Failed to restore entry')
    }
  }

  const filteredWaitlist = waitlist.filter(entry => {
    const matchesSearch = 
      entry.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.role && entry.role.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || entry.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredWaitlist.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedWaitlist = filteredWaitlist.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'error'> = {
      pending: 'outline',
      invited: 'info',
      approved: 'success',
      rejected: 'error',
    }
    return variants[status] || 'outline'
  }

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Waitlist Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage waitlist entries and send invitations
          </p>
        </div>
      </section>

      {/* Search and Filters - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by email, name, company, or role..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('all')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('pending')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Pending
            </Button>
            <Button
              variant={filterStatus === 'invited' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('invited')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Invited
            </Button>
            <Button
              variant={filterStatus === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('approved')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('rejected')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Rejected
            </Button>
          </div>
        </div>
      </section>

      {/* Waitlist Table - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWaitlist.length > 0 ? (
                    paginatedWaitlist.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{entry.email}</TableCell>
                        <TableCell>{entry.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.company}</TableCell>
                        <TableCell className="text-muted-foreground">{entry.role || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(entry.status)} className="text-xs">
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {entry.status === 'pending' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleInvite(entry)}
                                      className="min-h-[36px] px-2"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Send invitation email</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleApprove(entry)}
                                      className="min-h-[36px] px-2"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Approve and move to whitelist</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            {entry.status === 'invited' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResendInvite(entry)}
                                    className="min-h-[36px] px-2"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Resend invitation email</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {entry.status === 'rejected' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestoreRejected(entry)}
                                    className="min-h-[36px] px-2 text-primary hover:text-primary"
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Restore to pending status</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {entry.status !== 'rejected' && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBlock(entry)}
                                    className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Block domain and reject entry</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No waitlist entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </section>

      {/* Invite Confirmation Dialog */}
      <Dialog open={inviteDialog.open} onOpenChange={(open) => setInviteDialog({ open, entry: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invitation</DialogTitle>
            <DialogDescription>
              Send an invitation email to <strong>{inviteDialog.entry?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialog({ open: false, entry: null })}
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
      <Dialog open={blockDialog.open} onOpenChange={(open) => setBlockDialog({ open, entry: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Domain</DialogTitle>
            <DialogDescription>
              Block the domain <strong>{blockDialog.entry?.email.split('@')[1]}</strong>? 
              This will prevent all emails from this domain from registering.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBlockDialog({ open: false, entry: null })}
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
    </div>
    </TooltipProvider>
  )
}
