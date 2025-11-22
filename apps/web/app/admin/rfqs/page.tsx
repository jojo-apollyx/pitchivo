'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MessageSquare, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Mail,
  Building2,
  Calendar,
  Eye,
  Edit,
  Archive,
  Phone,
  Package,
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface RFQ {
  rfq_id: string
  product_id: string
  org_id: string
  name: string
  email: string
  company: string
  phone: string | null
  message: string
  quantity: string | null
  target_date: string | null
  status: 'new' | 'in_progress' | 'responded' | 'won' | 'lost' | 'archived'
  responded_at: string | null
  responded_by: string | null
  response_message: string | null
  submitted_at: string
  updated_at: string
  products?: {
    product_id: string
    product_name: string
    industry_code: string
  }
  organizations?: {
    id: string
    name: string
    domain: string
  }
}

interface RFQStats {
  total: number
  new: number
  in_progress: number
  responded: number
  won: number
  lost: number
  conversion_rate: number
}

export default function AdminRFQsPage() {
  const router = useRouter()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [filteredRfqs, setFilteredRfqs] = useState<RFQ[]>([])
  const [stats, setStats] = useState<RFQStats>({
    total: 0,
    new: 0,
    in_progress: 0,
    responded: 0,
    won: 0,
    lost: 0,
    conversion_rate: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [responseMessage, setResponseMessage] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    loadRfqs()
  }, [])

  // Filter RFQs based on search and status
  useEffect(() => {
    let filtered = rfqs

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(rfq => rfq.status === statusFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(rfq => {
        return (
          rfq.name.toLowerCase().includes(query) ||
          rfq.email.toLowerCase().includes(query) ||
          rfq.company.toLowerCase().includes(query) ||
          rfq.message.toLowerCase().includes(query) ||
          rfq.products?.product_name.toLowerCase().includes(query) ||
          rfq.organizations?.name.toLowerCase().includes(query)
        )
      })
    }

    setFilteredRfqs(filtered)
  }, [searchQuery, statusFilter, rfqs])

  async function loadRfqs() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('product_rfqs')
        .select(`
          *,
          products (
            product_id,
            product_name,
            industry_code
          ),
          organizations (
            id,
            name,
            domain
          )
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const rfqData = (data || []) as RFQ[]
      setRfqs(rfqData)
      setFilteredRfqs(rfqData)

      // Calculate stats
      const newStats: RFQStats = {
        total: rfqData.length,
        new: rfqData.filter(r => r.status === 'new').length,
        in_progress: rfqData.filter(r => r.status === 'in_progress').length,
        responded: rfqData.filter(r => r.status === 'responded').length,
        won: rfqData.filter(r => r.status === 'won').length,
        lost: rfqData.filter(r => r.status === 'lost').length,
        conversion_rate: rfqData.length > 0 
          ? Math.round((rfqData.filter(r => r.status === 'won').length / rfqData.length) * 100)
          : 0
      }
      setStats(newStats)

    } catch (error) {
      console.error('Error loading RFQs:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus() {
    if (!selectedRfq || !newStatus) return

    setUpdatingStatus(true)
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      }

      // If marking as responded or won, set response fields
      if (newStatus === 'responded' || newStatus === 'won') {
        updateData.responded_at = new Date().toISOString()
        if (responseMessage.trim()) {
          updateData.response_message = responseMessage
        }
      }

      const { error } = await supabase
        .from('product_rfqs')
        .update(updateData)
        .eq('rfq_id', selectedRfq.rfq_id)

      if (error) throw error

      // Reload RFQs
      await loadRfqs()
      
      // Close modal
      setShowDetailModal(false)
      setSelectedRfq(null)
      setNewStatus('')
      setResponseMessage('')

      toast.success('RFQ status updated successfully!')
    } catch (error) {
      console.error('Error updating RFQ:', error)
      toast.error('Failed to update RFQ status', {
        description: error instanceof Error ? error.message : 'Please try again.'
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  function openDetailModal(rfq: RFQ) {
    setSelectedRfq(rfq)
    setNewStatus(rfq.status)
    setResponseMessage(rfq.response_message || '')
    setShowDetailModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'responded':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'won':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'lost':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'archived':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-3 w-3" />
      case 'in_progress':
        return <Clock className="h-3 w-3" />
      case 'responded':
        return <Mail className="h-3 w-3" />
      case 'won':
        return <CheckCircle2 className="h-3 w-3" />
      case 'lost':
        return <AlertCircle className="h-3 w-3" />
      case 'archived':
        return <Archive className="h-3 w-3" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 flex items-center justify-center">
        <p className="text-muted-foreground">Loading RFQs...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight">RFQ Management</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Admin view - {stats.total} total RFQs across all organizations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadRfqs} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {/* Total RFQs */}
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-4 border border-border/30">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MessageSquare className="h-4 w-4" />
                <span>Total</span>
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground mt-1">All RFQs</div>
            </div>

            {/* New */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>New</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{stats.new}</div>
              <div className="text-xs text-blue-600 mt-1">Needs attention</div>
            </div>

            {/* In Progress */}
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center gap-2 text-sm text-yellow-700 mb-2">
                <Clock className="h-4 w-4" />
                <span>In Progress</span>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{stats.in_progress}</div>
              <div className="text-xs text-yellow-600 mt-1">Being worked</div>
            </div>

            {/* Responded */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-sm text-purple-700 mb-2">
                <Mail className="h-4 w-4" />
                <span>Responded</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.responded}</div>
              <div className="text-xs text-purple-600 mt-1">Awaiting reply</div>
            </div>

            {/* Won */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Won</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.won}</div>
              <div className="text-xs text-green-600 mt-1">Converted</div>
            </div>

            {/* Lost */}
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-2 text-sm text-red-700 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span>Lost</span>
              </div>
              <div className="text-2xl font-bold text-red-900">{stats.lost}</div>
              <div className="text-xs text-red-600 mt-1">Not converted</div>
            </div>

            {/* Conversion Rate */}
            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/30">
              <div className="flex items-center gap-2 text-sm text-accent-dark mb-2">
                <TrendingUp className="h-4 w-4" />
                <span>Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-accent-dark">{stats.conversion_rate}%</div>
              <div className="text-xs text-muted-foreground mt-1">Conversion</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-card/50 rounded-xl p-4 border border-border/30 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, email, company, message, product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 text-xs text-muted-foreground">
              Showing {filteredRfqs.length} of {rfqs.length} RFQs
              {searchQuery && ` matching "${searchQuery}"`}
              {statusFilter !== 'all' && ` with status "${statusFilter}"`}
            </div>
          </div>

          {/* RFQ Table */}
          {filteredRfqs.length === 0 ? (
            <div className="text-center py-12 bg-card/50 rounded-xl border border-border/30">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No RFQs found matching your filters'
                  : 'No RFQs yet'
                }
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button 
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }} 
                  variant="outline" 
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card/50 rounded-xl border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b border-border/30">
                    <tr>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Company
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredRfqs.map((rfq) => (
                      <tr 
                        key={rfq.rfq_id} 
                        className="hover:bg-accent/5 transition-colors"
                      >
                        {/* Contact */}
                        <td className="p-4">
                          <div className="min-w-[150px]">
                            <div className="font-semibold text-sm">{rfq.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Mail className="h-3 w-3" />
                              {rfq.email}
                            </div>
                          </div>
                        </td>

                        {/* Company */}
                        <td className="p-4">
                          <div className="min-w-[120px]">
                            <div className="flex items-center gap-1.5 text-sm">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {rfq.company}
                            </div>
                          </div>
                        </td>

                        {/* Product */}
                        <td className="p-4">
                          <div className="min-w-[150px]">
                            <div className="text-sm font-medium">
                              {rfq.products?.product_name || 'Unknown Product'}
                            </div>
                            {rfq.products?.industry_code && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {rfq.products.industry_code}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Organization */}
                        <td className="p-4">
                          <div className="min-w-[120px]">
                            <div className="text-sm">
                              {rfq.organizations?.name || 'Unknown Org'}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {rfq.organizations?.domain}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium ${getStatusColor(rfq.status)} flex items-center gap-1 w-fit`}
                          >
                            {getStatusIcon(rfq.status)}
                            {rfq.status.replace('_', ' ')}
                          </Badge>
                        </td>

                        {/* Submitted */}
                        <td className="p-4">
                          <div className="min-w-[100px]">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(rfq.submitted_at), 'MMM d, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground/70 mt-0.5">
                              {format(new Date(rfq.submitted_at), 'h:mm a')}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailModal(rfq)}
                              className="gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RFQ Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              RFQ Details
            </DialogTitle>
            <DialogDescription>
              View and manage this RFQ submission
            </DialogDescription>
          </DialogHeader>

          {selectedRfq && (
            <div className="space-y-6 mt-4">
              {/* Status and Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Current Status</Label>
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${getStatusColor(selectedRfq.status)} flex items-center gap-1 w-fit`}
                  >
                    {getStatusIcon(selectedRfq.status)}
                    {selectedRfq.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <div className="mt-2 text-sm">
                    {format(new Date(selectedRfq.submitted_at), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Name</Label>
                    <div className="mt-1 text-sm font-medium">{selectedRfq.name}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Company</Label>
                    <div className="mt-1 text-sm font-medium">{selectedRfq.company}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <div className="mt-1 text-sm flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {selectedRfq.email}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Phone</Label>
                    <div className="mt-1 text-sm flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {selectedRfq.phone || 'Not provided'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product & Organization */}
              <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product & Organization
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Product</Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedRfq.products?.product_name || 'Unknown'}
                    </div>
                    {selectedRfq.products?.industry_code && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {selectedRfq.products.industry_code}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Organization</Label>
                    <div className="mt-1 text-sm font-medium">
                      {selectedRfq.organizations?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {selectedRfq.organizations?.domain}
                    </div>
                  </div>
                </div>
              </div>

              {/* RFQ Details */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Message
                </Label>
                <div className="p-4 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedRfq.message}
                </div>
              </div>

              {selectedRfq.quantity && (
                <div>
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <div className="mt-1 text-sm">{selectedRfq.quantity}</div>
                </div>
              )}

              {selectedRfq.target_date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Target Date</Label>
                  <div className="mt-1 text-sm">{selectedRfq.target_date}</div>
                </div>
              )}

              {/* Response Information */}
              {selectedRfq.responded_at && (
                <div className="space-y-3 p-4 bg-accent/5 rounded-lg">
                  <h3 className="font-semibold text-sm">Response Information</h3>
                  <div>
                    <Label className="text-xs text-muted-foreground">Responded At</Label>
                    <div className="mt-1 text-sm">
                      {format(new Date(selectedRfq.responded_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                  {selectedRfq.response_message && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Response Message</Label>
                      <div className="mt-1 text-sm p-3 bg-background rounded border">
                        {selectedRfq.response_message}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Admin Actions</h3>
                
                <div>
                  <Label htmlFor="status-update">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newStatus === 'responded' || newStatus === 'won') && (
                  <div>
                    <Label htmlFor="response-message">Response Message (Optional)</Label>
                    <Textarea
                      id="response-message"
                      value={responseMessage}
                      onChange={(e) => setResponseMessage(e.target.value)}
                      placeholder="Add any notes about your response..."
                      className="mt-2 min-h-[100px]"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus || newStatus === selectedRfq.status}
                    className="flex-1"
                  >
                    {updatingStatus ? 'Updating...' : 'Update RFQ Status'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </main>
  )
}
