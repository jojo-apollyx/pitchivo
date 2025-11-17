'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import {
  Users,
  Mail,
  Plus,
  Trash2,
  Send,
  XCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Edit,
  Calendar,
  Filter,
  Download,
  Upload,
  Search,
  MailOpen,
  MousePointerClick,
  Ban,
  AlertTriangle,
  TrendingUp,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { format } from 'date-fns'
import {
  Lead,
  ScheduledEmailWithBrevoStatus,
  generateMockLeads,
  generateMockScheduledEmails,
  getBrevoStatusBadge
} from '@/lib/mock-data/leads'

interface CampaignEmailManagementProps {
  campaignId: string
}

export function CampaignEmailManagement({ campaignId }: CampaignEmailManagementProps) {
  const [activeTab, setActiveTab] = useState<'leads' | 'scheduled'>('leads')
  const [leads, setLeads] = useState<Lead[]>([])
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailWithBrevoStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'bounced' | 'unsubscribed'>('all')
  const [scheduleFilter, setScheduleFilter] = useState<'all' | 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked'>('all')
  
  // Sorting
  const [leadSortBy, setLeadSortBy] = useState<'name' | 'email' | 'company' | 'added_at'>('added_at')
  const [leadSortOrder, setLeadSortOrder] = useState<'asc' | 'desc'>('desc')
  const [emailSortOrder, setEmailSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Pagination for leads
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 20
  
  // Add lead dialog
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [newLead, setNewLead] = useState({ email: '', name: '', title: '', company: '' })
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null)
  
  // Edit scheduled email
  const [editEmailOpen, setEditEmailOpen] = useState(false)
  const [emailToEdit, setEmailToEdit] = useState<ScheduledEmailWithBrevoStatus | null>(null)
  const [editedScheduleDate, setEditedScheduleDate] = useState('')
  const [editedScheduleTime, setEditedScheduleTime] = useState('')
  
  // Cancel confirmation
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const [emailToCancel, setEmailToCancel] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [campaignId])

  function loadData() {
    setLoading(true)
    // Load mock data - now generates 200 leads by default
    const mockLeads = generateMockLeads(campaignId)
    const mockScheduled = generateMockScheduledEmails(campaignId, mockLeads)
    
    setLeads(mockLeads)
    setScheduledEmails(mockScheduled)
    setLoading(false)
  }

  // Filter, sort, and paginate leads
  const { sortedAndFilteredLeads, paginatedLeads, totalPages } = useMemo(() => {
    // Filter
    let filtered = leads.filter(lead => {
      const matchesSearch = 
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      
      return matchesSearch && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''
      
      switch (leadSortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'company':
          aValue = a.company.toLowerCase()
          bValue = b.company.toLowerCase()
          break
        case 'added_at':
          aValue = new Date(a.added_at).getTime()
          bValue = new Date(b.added_at).getTime()
          break
      }
      
      if (aValue < bValue) return leadSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return leadSortOrder === 'asc' ? 1 : -1
      return 0
    })

    // Paginate
    const total = Math.ceil(filtered.length / leadsPerPage)
    const startIndex = (currentPage - 1) * leadsPerPage
    const paginated = filtered.slice(startIndex, startIndex + leadsPerPage)

    return {
      sortedAndFilteredLeads: filtered,
      paginatedLeads: paginated,
      totalPages: total
    }
  }, [leads, searchTerm, statusFilter, leadSortBy, leadSortOrder, currentPage, leadsPerPage])

  // Filter and sort scheduled emails
  const sortedScheduledEmails = useMemo(() => {
    let filtered = scheduledEmails.filter(email => {
      const matchesFilter = scheduleFilter === 'all' || 
        (scheduleFilter === 'pending' && email.status === 'pending') ||
        (scheduleFilter === 'sent' && email.status === 'sent') ||
        (scheduleFilter === 'delivered' && email.brevo_status === 'delivered') ||
        (scheduleFilter === 'opened' && email.brevo_status === 'opened') ||
        (scheduleFilter === 'clicked' && email.brevo_status === 'clicked')
      
      return matchesFilter
    })

    // Sort by scheduled time
    filtered.sort((a, b) => {
      const aTime = new Date(a.scheduled_time).getTime()
      const bTime = new Date(b.scheduled_time).getTime()
      return emailSortOrder === 'asc' ? aTime - bTime : bTime - aTime
    })

    return filtered
  }, [scheduledEmails, scheduleFilter, emailSortOrder])

  // Stats
  const stats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(l => l.status === 'active').length,
    bouncedLeads: leads.filter(l => l.status === 'bounced').length,
    unsubscribedLeads: leads.filter(l => l.status === 'unsubscribed').length,
    totalScheduled: scheduledEmails.length,
    pendingEmails: scheduledEmails.filter(e => e.status === 'pending').length,
    sentEmails: scheduledEmails.filter(e => e.status === 'sent').length,
    deliveredEmails: scheduledEmails.filter(e => e.brevo_status === 'delivered' || e.brevo_status === 'opened' || e.brevo_status === 'clicked').length,
    openedEmails: scheduledEmails.filter(e => e.brevo_status === 'opened' || e.brevo_status === 'clicked').length,
    clickedEmails: scheduledEmails.filter(e => e.brevo_status === 'clicked').length,
    bouncedEmails: scheduledEmails.filter(e => e.brevo_status === 'hard_bounce' || e.brevo_status === 'soft_bounce').length
  }

  function handleAddLead() {
    if (!newLead.email || !newLead.name || !newLead.company) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newLead.email)) {
      toast.error('Invalid email address')
      return
    }
    
    const lead: Lead = {
      lead_id: `lead_${campaignId}_${Date.now()}`,
      campaign_id: campaignId,
      email: newLead.email,
      name: newLead.name,
      title: newLead.title,
      company: newLead.company,
      status: 'active',
      added_at: new Date().toISOString()
    }
    
    setLeads([lead, ...leads])
    setAddLeadOpen(false)
    setNewLead({ email: '', name: '', title: '', company: '' })
    toast.success('Lead added successfully!')
  }

  function handleDeleteLead(leadId: string) {
    setLeads(leads.filter(l => l.lead_id !== leadId))
    setLeadToDelete(null)
    setDeleteConfirmOpen(false)
    toast.success('Lead deleted successfully!')
  }

  function handleEditSchedule(email: ScheduledEmailWithBrevoStatus) {
    setEmailToEdit(email)
    const dateObj = new Date(email.scheduled_time)
    setEditedScheduleDate(format(dateObj, 'yyyy-MM-dd'))
    setEditedScheduleTime(format(dateObj, 'HH:mm'))
    setEditEmailOpen(true)
  }

  function handleUpdateSchedule() {
    if (!emailToEdit || !editedScheduleDate) return
    
    // Combine date and time
    const timeStr = editedScheduleTime || '09:00'
    const newScheduleTime = `${editedScheduleDate}T${timeStr}:00.000Z`
    
    setScheduledEmails(scheduledEmails.map(e => 
      e.scheduled_email_id === emailToEdit.scheduled_email_id
        ? { ...e, scheduled_time: newScheduleTime, updated_at: new Date().toISOString() }
        : e
    ))
    
    setEditEmailOpen(false)
    setEmailToEdit(null)
    setEditedScheduleDate('')
    setEditedScheduleTime('')
    toast.success('Schedule updated successfully!')
  }
  
  function toggleLeadSort(column: typeof leadSortBy) {
    if (leadSortBy === column) {
      setLeadSortOrder(leadSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setLeadSortBy(column)
      setLeadSortOrder('asc')
    }
  }
  
  function toggleEmailSort() {
    setEmailSortOrder(emailSortOrder === 'asc' ? 'desc' : 'asc')
  }

  function handleCancelEmail(emailId: string) {
    setScheduledEmails(scheduledEmails.map(e =>
      e.scheduled_email_id === emailId
        ? { ...e, status: 'cancelled' as const, updated_at: new Date().toISOString() }
        : e
    ))
    
    setEmailToCancel(null)
    setCancelConfirmOpen(false)
    toast.success('Email cancelled successfully!')
  }

  function handleSendNow(emailId: string) {
    // In real implementation, this would call API to send immediately
    setScheduledEmails(scheduledEmails.map(e =>
      e.scheduled_email_id === emailId
        ? { 
            ...e, 
            status: 'sent' as const, 
            sent_at: new Date().toISOString(),
            brevo_message_id: `msg_${Math.random().toString(36).substring(7)}`,
            brevo_status: 'sent' as const,
            updated_at: new Date().toISOString()
          }
        : e
    ))
    toast.success('Email sent successfully!')
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading campaign data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Total Leads</div>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats.activeLeads}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600">{stats.pendingEmails}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Delivered</div>
          <div className="text-2xl font-bold text-green-600">{stats.deliveredEmails}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Opened</div>
          <div className="text-2xl font-bold text-emerald-600">{stats.openedEmails}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Clicked</div>
          <div className="text-2xl font-bold text-teal-600">{stats.clickedEmails}</div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            Campaign Leads ({stats.totalLeads})
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <Mail className="h-4 w-4" />
            Scheduled Emails ({stats.totalScheduled})
          </TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'bounced' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('bounced')}
                >
                  Bounced
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'unsubscribed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('unsubscribed')}
                >
                  Unsubscribed
                </Button>
              </div>
            </div>
            <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>

          {/* Leads Table */}
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => toggleLeadSort('name')}
                    >
                      Name
                      {leadSortBy === 'name' && (
                        leadSortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {leadSortBy !== 'name' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => toggleLeadSort('email')}
                    >
                      Email
                      {leadSortBy === 'email' && (
                        leadSortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {leadSortBy !== 'email' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => toggleLeadSort('company')}
                    >
                      Company
                      {leadSortBy === 'company' && (
                        leadSortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {leadSortBy !== 'company' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => toggleLeadSort('added_at')}
                    >
                      Added
                      {leadSortBy === 'added_at' && (
                        leadSortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                      {leadSortBy !== 'added_at' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.lead_id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell className="text-muted-foreground">{lead.title}</TableCell>
                    <TableCell>{lead.company}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          lead.status === 'active'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : lead.status === 'bounced'
                            ? 'bg-red-100 text-red-700 border-red-300'
                            : lead.status === 'unsubscribed'
                            ? 'bg-gray-100 text-gray-700 border-gray-300'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lead.added_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setLeadToDelete(lead.lead_id)
                          setDeleteConfirmOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedLeads.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No leads found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * leadsPerPage + 1} to {Math.min(currentPage * leadsPerPage, sortedAndFilteredLeads.length)} of {sortedAndFilteredLeads.length} leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Scheduled Emails Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={scheduleFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={scheduleFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('pending')}
              className="gap-1"
            >
              <Clock className="h-3 w-3" />
              Pending
            </Button>
            <Button
              size="sm"
              variant={scheduleFilter === 'sent' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('sent')}
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              Sent
            </Button>
            <Button
              size="sm"
              variant={scheduleFilter === 'delivered' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('delivered')}
              className="gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Delivered
            </Button>
            <Button
              size="sm"
              variant={scheduleFilter === 'opened' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('opened')}
              className="gap-1"
            >
              <MailOpen className="h-3 w-3" />
              Opened
            </Button>
            <Button
              size="sm"
              variant={scheduleFilter === 'clicked' ? 'default' : 'outline'}
              onClick={() => setScheduleFilter('clicked')}
              className="gap-1"
            >
              <MousePointerClick className="h-3 w-3" />
              Clicked
            </Button>
          </div>

          {/* Scheduled Emails Table */}
          <div className="rounded-lg border border-border/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8 data-[state=open]:bg-accent"
                      onClick={() => toggleEmailSort()}
                    >
                      Scheduled Time
                      {emailSortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Brevo Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedScheduledEmails.map((email) => {
                  const brevoInfo = getBrevoStatusBadge(email.brevo_status)
                  return (
                    <TableRow key={email.scheduled_email_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{email.recipient_name}</div>
                          <div className="text-xs text-muted-foreground">{email.recipient_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{email.recipient_title}</TableCell>
                      <TableCell>{email.recipient_company}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(email.scheduled_time), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(email.scheduled_time), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            email.status === 'pending'
                              ? 'bg-blue-100 text-blue-700 border-blue-300'
                              : email.status === 'sent'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : email.status === 'failed'
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-gray-100 text-gray-700 border-gray-300'
                          }
                        >
                          {email.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {email.brevo_status ? (
                          <Badge variant="outline" className={brevoInfo.color} title={brevoInfo.description}>
                            {brevoInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {email.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditSchedule(email)}
                                title="Edit Schedule"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSendNow(email.scheduled_email_id)}
                                title="Send Now"
                              >
                                <Send className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEmailToCancel(email.scheduled_email_id)
                                  setCancelConfirmOpen(true)
                                }}
                                title="Cancel"
                              >
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {email.brevo_message_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              title="View in Brevo"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {sortedScheduledEmails.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No scheduled emails found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Lead Dialog */}
      <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to this campaign. They will be available for scheduling emails.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john.doe@company.com"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Procurement Manager"
                value={newLead.title}
                onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                placeholder="Company Name"
                value={newLead.company}
                onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddLeadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLead}>
                Add Lead
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the lead from the campaign. Any scheduled emails for this lead will also be cancelled.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => leadToDelete && handleDeleteLead(leadToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Schedule Dialog */}
      <Dialog open={editEmailOpen} onOpenChange={setEditEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Email Schedule</DialogTitle>
            <DialogDescription>
              Update the scheduled time for this email.
            </DialogDescription>
          </DialogHeader>
          {emailToEdit && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div><strong>To:</strong> {emailToEdit.recipient_name} ({emailToEdit.recipient_email})</div>
                <div><strong>Company:</strong> {emailToEdit.recipient_company}</div>
                <div><strong>Subject:</strong> {emailToEdit.subject}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <DatePicker
                    value={editedScheduleDate}
                    onChange={setEditedScheduleDate}
                    placeholder="Select date"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduledTime">Time</Label>
                  <Input
                    id="scheduledTime"
                    type="time"
                    value={editedScheduleTime}
                    onChange={(e) => setEditedScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditEmailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSchedule}>
                  Update Schedule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Email Confirmation */}
      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Email?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the scheduled email. The email will not be sent. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => emailToCancel && handleCancelEmail(emailToCancel)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

