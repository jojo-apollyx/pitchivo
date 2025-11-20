'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Download, Pause, Play, UserX, Trash2, Mail, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

interface LeadsTabProps {
  campaign: any
  onRefresh: () => void
}

interface Lead {
  lead_id: string
  email: string
  name?: string
  title?: string
  company?: string
  status: string
  last_contacted?: string
  open_count: number
  click_count: number
  reply_count: number
  current_sequence: number
  category_id?: number
  smartlead_lead_id?: string
}

export function LeadsTab({ campaign, onRefresh }: LeadsTabProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addLeadOpen, setAddLeadOpen] = useState(false)
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(0)
  const [totalLeads, setTotalLeads] = useState(0)
  const pageSize = 50

  // Add lead form
  const [newLead, setNewLead] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company_name: '',
    title: '',
    phone_number: '',
    location: '',
  })

  useEffect(() => {
    loadLeads()
  }, [campaign.campaign_id, page, statusFilter])

  async function loadLeads() {
    try {
      setLoading(true)
      
      if (!campaign.smartlead_campaign_id) {
        // Load from our database only
        const { data, error } = await fetch(
          `/api/admin/campaigns/${campaign.campaign_id}/leads?offset=${page * pageSize}&limit=${pageSize}&status=${statusFilter}`
        ).then(res => res.json())
        
        if (error) throw error
        setLeads(data?.leads || [])
        setTotalLeads(data?.total || 0)
        return
      }

      // Load from Smartlead
      const response = await fetch(
        `/api/smartlead/campaigns/${campaign.smartlead_campaign_id}/leads?offset=${page * pageSize}&limit=${pageSize}`
      )
      
      if (!response.ok) throw new Error('Failed to load leads')
      
      const data = await response.json()
      
      // Transform Smartlead leads to our format
      const transformedLeads = (data.data || []).map((item: any) => ({
        lead_id: item.lead?.id || item.campaign_lead_map_id,
        smartlead_lead_id: item.lead?.id,
        email: item.lead?.email || '',
        name: `${item.lead?.first_name || ''} ${item.lead?.last_name || ''}`.trim(),
        title: item.lead?.custom_fields?.Title || '',
        company: item.lead?.company_name || '',
        status: item.status?.toLowerCase() || 'active',
        last_contacted: item.last_contacted,
        open_count: 0,
        click_count: 0,
        reply_count: 0,
        current_sequence: item.last_email_sequence_sent || 0,
      }))
      
      setLeads(transformedLeads)
      setTotalLeads(data.total_leads || 0)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddLead() {
    if (!newLead.email) {
      toast.error('Email is required')
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/smartlead/campaigns/${campaign.smartlead_campaign_id}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_list: [newLead],
          settings: {
            ignore_global_block_list: false,
            ignore_unsubscribe_list: false,
            ignore_duplicate_leads_in_other_campaign: false,
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add lead')

      toast.success('Lead added successfully')
      setAddLeadOpen(false)
      setNewLead({
        email: '',
        first_name: '',
        last_name: '',
        company_name: '',
        title: '',
        phone_number: '',
        location: '',
      })
      loadLeads()
      onRefresh()
    } catch (error) {
      console.error('Error adding lead:', error)
      toast.error('Failed to add lead')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleLeadAction(leadId: string, leadEmail: string, action: 'pause' | 'resume' | 'unsubscribe' | 'delete') {
    if (!campaign.smartlead_campaign_id) {
      toast.error('Campaign not synced with Smartlead')
      return
    }

    setIsProcessing(true)
    try {
      let endpoint = ''
      let method = 'POST'
      
      switch (action) {
        case 'pause':
          endpoint = `/api/admin/campaigns/${campaign.campaign_id}/leads/${leadId}/pause`
          break
        case 'resume':
          endpoint = `/api/admin/campaigns/${campaign.campaign_id}/leads/${leadId}/resume`
          break
        case 'unsubscribe':
          endpoint = `/api/admin/campaigns/${campaign.campaign_id}/leads/${leadId}/unsubscribe`
          break
        case 'delete':
          endpoint = `/api/smartlead/campaigns/${campaign.smartlead_campaign_id}/leads?email=${encodeURIComponent(leadEmail)}`
          method = 'DELETE'
          break
      }

      const response = await fetch(endpoint, { method })
      
      if (!response.ok) throw new Error(`Failed to ${action} lead`)

      toast.success(`Lead ${action}d successfully`)
      loadLeads()
      onRefresh()
    } catch (error) {
      console.error(`Error ${action}ing lead:`, error)
      toast.error(`Failed to ${action} lead`)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleBulkAction(action: 'pause' | 'resume' | 'export') {
    if (selectedLeads.size === 0) {
      toast.error('No leads selected')
      return
    }

    setIsProcessing(true)
    try {
      if (action === 'export') {
        // Export selected leads
        const selectedLeadData = leads.filter(l => selectedLeads.has(l.lead_id))
        const csv = generateCSV(selectedLeadData)
        downloadCSV(csv, `leads-${campaign.display_name}-${new Date().toISOString().split('T')[0]}.csv`)
        toast.success('Leads exported successfully')
      } else {
        // Pause/Resume multiple leads
        for (const leadId of Array.from(selectedLeads)) {
          const lead = leads.find(l => l.lead_id === leadId)
          if (lead) {
            await handleLeadAction(leadId, lead.email, action)
          }
        }
        setSelectedLeads(new Set())
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} leads`)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleExportAll() {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaign.campaign_id}/leads/export`)
      if (!response.ok) throw new Error('Failed to export leads')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${campaign.display_name || 'campaign'}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Leads exported successfully')
    } catch (error) {
      console.error('Error exporting leads:', error)
      toast.error('Failed to export leads')
    }
  }

  function generateCSV(data: Lead[]): string {
    const headers = ['Email', 'Name', 'Company', 'Title', 'Status', 'Opens', 'Clicks', 'Replies', 'Sequence']
    const rows = data.map(lead => [
      lead.email,
      lead.name || '',
      lead.company || '',
      lead.title || '',
      lead.status,
      lead.open_count.toString(),
      lead.click_count.toString(),
      lead.reply_count.toString(),
      lead.current_sequence.toString(),
    ])
    
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    bounced: 'bg-red-500',
    unsubscribed: 'bg-gray-500',
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {selectedLeads.size > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('pause')}
                disabled={isProcessing}
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('resume')}
                disabled={isProcessing}
              >
                <Play className="h-4 w-4 mr-2" />
                Resume Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Selected
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
          >
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>

          <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>
                  Add a new lead to this campaign
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="company_name">Company</Label>
                  <Input
                    id="company_name"
                    value={newLead.company_name}
                    onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                    placeholder="Company Inc"
                  />
                </div>
                
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newLead.title}
                    onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                    placeholder="CEO"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddLeadOpen(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLead}
                  disabled={isProcessing || !newLead.email}
                >
                  Add Lead
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leads Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLeads(new Set(filteredLeads.map(l => l.lead_id)))
                    } else {
                      setSelectedLeads(new Set())
                    }
                  }}
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Opens</TableHead>
              <TableHead className="text-right">Clicks</TableHead>
              <TableHead className="text-right">Replies</TableHead>
              <TableHead className="text-right">Sequence</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No leads found
                </TableCell>
              </TableRow>
            ) : (
              filteredLeads.map((lead) => (
                <TableRow key={lead.lead_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.has(lead.lead_id)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedLeads)
                        if (checked) {
                          newSelected.add(lead.lead_id)
                        } else {
                          newSelected.delete(lead.lead_id)
                        }
                        setSelectedLeads(newSelected)
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{lead.email}</TableCell>
                  <TableCell>{lead.name || '-'}</TableCell>
                  <TableCell>{lead.company || '-'}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status] || 'bg-gray-500'}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{lead.open_count}</TableCell>
                  <TableCell className="text-right">{lead.click_count}</TableCell>
                  <TableCell className="text-right">{lead.reply_count}</TableCell>
                  <TableCell className="text-right">{lead.current_sequence}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {lead.status === 'active' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLeadAction(lead.lead_id, lead.email, 'pause')}
                          disabled={isProcessing}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : lead.status === 'paused' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLeadAction(lead.lead_id, lead.email, 'resume')}
                          disabled={isProcessing}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      ) : null}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLeadAction(lead.lead_id, lead.email, 'unsubscribe')}
                        disabled={isProcessing}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this lead?')) {
                            handleLeadAction(lead.lead_id, lead.email, 'delete')
                          }
                        }}
                        disabled={isProcessing}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalLeads > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalLeads)} of {totalLeads} leads
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={(page + 1) * pageSize >= totalLeads}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

