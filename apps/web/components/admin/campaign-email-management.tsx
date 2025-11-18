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
} from '@/components/ui/dialog'
import { AddLeadDialog } from '@/components/admin/add-lead-dialog'
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
  Edit,
  Search,
  MailOpen,
  MousePointerClick,
  Ban,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Calendar
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

// Combined lead with scheduling info
interface LeadWithSchedule extends Lead {
  scheduledEmail?: ScheduledEmailWithBrevoStatus
}

export function CampaignEmailManagement({ campaignId }: CampaignEmailManagementProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmailWithBrevoStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'bounced' | 'unsubscribed' | 'invalid'>('all')
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<'all' | 'scheduled' | 'sent' | 'not_scheduled'>('all')
  
  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'company' | 'added_at' | 'schedule_time'>('added_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 25
  
  // Add lead dialog
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  
  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null)
  
  // Schedule email dialog
  const [scheduleEmailOpen, setScheduleEmailOpen] = useState(false)
  const [leadToSchedule, setLeadToSchedule] = useState<Lead | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('09:00')
  
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

  // Merge leads with their scheduled emails
  const leadsWithSchedule = useMemo(() => {
    return leads.map(lead => {
      const scheduledEmail = scheduledEmails.find(e => e.lead_id === lead.lead_id)
      return {
        ...lead,
        scheduledEmail
      }
    })
  }, [leads, scheduledEmails])

  // Filter, sort, and paginate leads
  const { sortedAndFilteredLeads, paginatedLeads, totalPages } = useMemo(() => {
    // Filter
    let filtered = leadsWithSchedule.filter(lead => {
      const matchesSearch = 
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
      
      let matchesScheduleStatus = true
      if (scheduleStatusFilter === 'scheduled') {
        matchesScheduleStatus = !!lead.scheduledEmail && lead.scheduledEmail.status === 'pending'
      } else if (scheduleStatusFilter === 'sent') {
        matchesScheduleStatus = !!lead.scheduledEmail && lead.scheduledEmail.status === 'sent'
      } else if (scheduleStatusFilter === 'not_scheduled') {
        matchesScheduleStatus = !lead.scheduledEmail || lead.scheduledEmail.status === 'cancelled'
      }
      
      return matchesSearch && matchesStatus && matchesScheduleStatus
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''
      
      switch (sortBy) {
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
        case 'schedule_time':
          aValue = a.scheduledEmail ? new Date(a.scheduledEmail.scheduled_time).getTime() : 0
          bValue = b.scheduledEmail ? new Date(b.scheduledEmail.scheduled_time).getTime() : 0
          break
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
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
  }, [leadsWithSchedule, searchTerm, statusFilter, scheduleStatusFilter, sortBy, sortOrder, currentPage, leadsPerPage])

  // Stats
  const stats = {
    totalLeads: leads.length,
    activeLeads: leads.filter(l => l.status === 'active').length,
    scheduledEmails: scheduledEmails.filter(e => e.status === 'pending').length,
    sentEmails: scheduledEmails.filter(e => e.status === 'sent').length,
    deliveredEmails: scheduledEmails.filter(e => e.brevo_status === 'delivered' || e.brevo_status === 'opened' || e.brevo_status === 'clicked').length,
    openedEmails: scheduledEmails.filter(e => e.brevo_status === 'opened' || e.brevo_status === 'clicked').length,
    clickedEmails: scheduledEmails.filter(e => e.brevo_status === 'clicked').length,
  }

  function handleLeadsAdded(newLeads: Lead[]) {
    setLeads([...newLeads, ...leads])
    // Reset to first page to show new leads
    setCurrentPage(1)
  }

  function handleDeleteLead(leadId: string) {
    setLeads(leads.filter(l => l.lead_id !== leadId))
    // Also remove any scheduled emails for this lead
    setScheduledEmails(scheduledEmails.filter(e => e.lead_id !== leadId))
    setLeadToDelete(null)
    setDeleteConfirmOpen(false)
    toast.success('Lead deleted successfully!')
  }

  function handleScheduleEmail(lead: Lead) {
    setLeadToSchedule(lead)
    // Set default to tomorrow at 9am
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setScheduleDate(format(tomorrow, 'yyyy-MM-dd'))
    setScheduleTime('09:00')
    setScheduleEmailOpen(true)
  }

  function handleCreateSchedule() {
    if (!leadToSchedule || !scheduleDate) {
      toast.error('Please select a date and time')
      return
    }
    
    // Combine date and time
    const scheduleDateTime = `${scheduleDate}T${scheduleTime}:00.000Z`
    
    // Create new scheduled email
    const newScheduledEmail: ScheduledEmailWithBrevoStatus = {
      scheduled_email_id: `scheduled_${campaignId}_${Date.now()}`,
      campaign_id: campaignId,
      lead_id: leadToSchedule.lead_id,
      recipient_email: leadToSchedule.email,
      recipient_name: leadToSchedule.name,
      recipient_title: leadToSchedule.title,
      recipient_company: leadToSchedule.company,
      subject: `Innovative Solutions for ${leadToSchedule.company}`,
      content: `Hi ${leadToSchedule.name},\n\nI wanted to reach out to discuss how our products can benefit ${leadToSchedule.company}...\n\nBest regards`,
      scheduled_time: scheduleDateTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setScheduledEmails([...scheduledEmails, newScheduledEmail])
    setScheduleEmailOpen(false)
    setLeadToSchedule(null)
    setScheduleDate('')
    setScheduleTime('09:00')
    toast.success('Email scheduled successfully!')
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
  
  function toggleSort(column: typeof sortBy) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
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

  function handleSendNow(lead: LeadWithSchedule) {
    if (lead.scheduledEmail) {
      // Update existing scheduled email to sent
      setScheduledEmails(scheduledEmails.map(e =>
        e.scheduled_email_id === lead.scheduledEmail!.scheduled_email_id
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
    } else {
      // Create new scheduled email and mark as sent immediately
      const newScheduledEmail: ScheduledEmailWithBrevoStatus = {
        scheduled_email_id: `scheduled_${campaignId}_${Date.now()}`,
        campaign_id: campaignId,
        lead_id: lead.lead_id,
        recipient_email: lead.email,
        recipient_name: lead.name,
        recipient_title: lead.title,
        recipient_company: lead.company,
        subject: `Innovative Solutions for ${lead.company}`,
        content: `Hi ${lead.name},\n\nI wanted to reach out to discuss how our products can benefit ${lead.company}...\n\nBest regards`,
        scheduled_time: new Date().toISOString(),
        status: 'sent',
        sent_at: new Date().toISOString(),
        brevo_message_id: `msg_${Math.random().toString(36).substring(7)}`,
        brevo_status: 'sent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setScheduledEmails([...scheduledEmails, newScheduledEmail])
    }
    toast.success('Email sent successfully!')
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading campaign data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
          <div className="text-2xl font-bold text-blue-600">{stats.scheduledEmails}</div>
        </div>
        <div className="bg-card/50 rounded-lg p-4 border border-border/30">
          <div className="text-xs text-muted-foreground mb-1">Sent</div>
          <div className="text-2xl font-bold text-indigo-600">{stats.sentEmails}</div>
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

      {/* Unified Leads View */}
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1 w-full lg:w-auto">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button onClick={() => setAddLeadOpen(true)} className="gap-2 w-full lg:w-auto">
            <Plus className="h-4 w-4" />
            Add Lead
          </Button>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">Lead Status:</span>
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
            <Button
              size="sm"
              variant={statusFilter === 'invalid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('invalid')}
            >
              Invalid
            </Button>
          </div>
          
          <div className="w-px h-8 bg-border mx-2" />
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">Email Status:</span>
            <Button
              size="sm"
              variant={scheduleStatusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setScheduleStatusFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={scheduleStatusFilter === 'scheduled' ? 'default' : 'outline'}
              onClick={() => setScheduleStatusFilter('scheduled')}
              className="gap-1"
            >
              <Clock className="h-3 w-3" />
              Scheduled
            </Button>
            <Button
              size="sm"
              variant={scheduleStatusFilter === 'sent' ? 'default' : 'outline'}
              onClick={() => setScheduleStatusFilter('sent')}
              className="gap-1"
            >
              <Send className="h-3 w-3" />
              Sent
            </Button>
            <Button
              size="sm"
              variant={scheduleStatusFilter === 'not_scheduled' ? 'default' : 'outline'}
              onClick={() => setScheduleStatusFilter('not_scheduled')}
              className="gap-1"
            >
              <XCircle className="h-3 w-3" />
              Not Scheduled
            </Button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="rounded-lg border border-border/30 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('name')}
                  >
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'name' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'email' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('company')}
                  >
                    Company
                    {sortBy === 'company' && (
                      sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'company' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>Email Status</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('added_at')}
                  >
                    Added
                    {sortBy === 'added_at' && (
                      sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'added_at' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => toggleSort('schedule_time')}
                  >
                    Scheduled Time
                    {sortBy === 'schedule_time' && (
                      sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                    )}
                    {sortBy !== 'schedule_time' && <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => {
                const brevoInfo = lead.scheduledEmail?.brevo_status 
                  ? getBrevoStatusBadge(lead.scheduledEmail.brevo_status)
                  : null
                  
                return (
                  <TableRow key={lead.lead_id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="font-mono text-sm">{lead.email}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{lead.title}</TableCell>
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
                    <TableCell>
                      {lead.scheduledEmail && lead.scheduledEmail.status !== 'cancelled' ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {format(new Date(lead.scheduledEmail.scheduled_time), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(lead.scheduledEmail.scheduled_time), 'h:mm a')}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {lead.scheduledEmail && lead.scheduledEmail.status !== 'cancelled' ? (
                          <>
                            <Badge
                              variant="outline"
                              className={
                                lead.scheduledEmail.status === 'pending'
                                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                                  : lead.scheduledEmail.status === 'sent'
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : lead.scheduledEmail.status === 'failed'
                                  ? 'bg-red-100 text-red-700 border-red-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }
                            >
                              {lead.scheduledEmail.status}
                            </Badge>
                            {brevoInfo && (
                              <Badge variant="outline" className={brevoInfo.color} title={brevoInfo.description}>
                                {brevoInfo.label}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Schedule or Edit Schedule */}
                        {!lead.scheduledEmail || lead.scheduledEmail.status === 'cancelled' ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleScheduleEmail(lead)}
                            title="Schedule Email"
                          >
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : lead.scheduledEmail.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditSchedule(lead.scheduledEmail!)}
                              title="Edit Schedule"
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendNow(lead)}
                              title="Send Now"
                            >
                              <Send className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEmailToCancel(lead.scheduledEmail!.scheduled_email_id)
                                setCancelConfirmOpen(true)
                              }}
                              title="Cancel Email"
                            >
                              <XCircle className="h-4 w-4 text-orange-600" />
                            </Button>
                          </>
                        ) : null}
                        
                        {/* Send immediately for leads without schedule or sent emails */}
                        {(!lead.scheduledEmail || lead.scheduledEmail.status === 'sent') && lead.status === 'active' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSendNow(lead)}
                            title="Send Now"
                          >
                            <Send className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        
                        {/* Delete Lead */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setLeadToDelete(lead.lead_id)
                            setDeleteConfirmOpen(true)
                          }}
                          title="Remove Lead"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {paginatedLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
      </div>

      {/* Add Lead Dialog */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        campaignId={campaignId}
        onLeadsAdded={handleLeadsAdded}
      />

      {/* Schedule Email Dialog */}
      <Dialog open={scheduleEmailOpen} onOpenChange={setScheduleEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Email</DialogTitle>
            <DialogDescription>
              Set a date and time to send an email to this lead.
            </DialogDescription>
          </DialogHeader>
          {leadToSchedule && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div><strong>To:</strong> {leadToSchedule.name} ({leadToSchedule.email})</div>
                <div><strong>Company:</strong> {leadToSchedule.company}</div>
                <div><strong>Title:</strong> {leadToSchedule.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduleDate">Schedule Date</Label>
                  <DatePicker
                    value={scheduleDate}
                    onChange={setScheduleDate}
                    placeholder="Select date"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <Label htmlFor="scheduleTime">Time</Label>
                  <Input
                    id="scheduleTime"
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setScheduleEmailOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSchedule}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Email
                </Button>
              </div>
            </div>
          )}
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
                  <Label htmlFor="editedScheduleDate">Scheduled Date</Label>
                  <DatePicker
                    value={editedScheduleDate}
                    onChange={setEditedScheduleDate}
                    placeholder="Select date"
                    minDate={new Date()}
                  />
                </div>
                <div>
                  <Label htmlFor="editedScheduleTime">Time</Label>
                  <Input
                    id="editedScheduleTime"
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
