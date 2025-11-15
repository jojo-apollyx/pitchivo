'use client'

import { useState, useEffect, useMemo } from 'react'
import { MessageSquare, Search, X, Mail, Phone, Building2, Calendar, Package, CheckCircle2, Clock, Archive, TrendingUp, TrendingDown, MoreVertical, ExternalLink, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'

type RFQStatus = 'new' | 'in_progress' | 'responded' | 'won' | 'lost' | 'archived'

interface RFQ {
  rfq_id: string
  product_id: string
  org_id: string
  name: string
  email: string
  company: string
  phone?: string
  message: string
  quantity?: string
  target_date?: string
  status: RFQStatus
  responded_at?: string
  responded_by?: string
  response_message?: string
  submitted_at: string
  updated_at: string
  products?: {
    product_id: string
    product_name: string
    industry_code?: string
    product_data?: any // Contains product_images, ingredient name, etc.
  }
}

const STATUS_CONFIG: Record<RFQStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  new: { label: 'New', color: 'bg-primary/10 text-primary border-primary/20', icon: MessageSquare },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock },
  responded: { label: 'Responded', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle2 },
  won: { label: 'Won', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: TrendingUp },
  lost: { label: 'Lost', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: TrendingDown },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground border-border/30', icon: Archive },
}

const ITEMS_PER_PAGE = 10

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<RFQStatus>('new')
  const [responseMessage, setResponseMessage] = useState('')

  // Fetch RFQs with pagination
  useEffect(() => {
    const fetchRfqs = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (productFilter !== 'all') params.set('productId', productFilter)
        if (searchQuery) params.set('search', searchQuery)
        params.set('page', currentPage.toString())
        params.set('pageSize', ITEMS_PER_PAGE.toString())

        const response = await fetch(`/api/rfqs?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to fetch RFQs')
        
        const data = await response.json()
        setRfqs(data.rfqs || [])
        setTotalCount(data.totalCount || 0)
        setTotalPages(data.totalPages || 0)
      } catch (error) {
        console.error('Error fetching RFQs:', error)
        toast.error('Failed to load RFQs')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRfqs()
  }, [statusFilter, productFilter, searchQuery, currentPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, productFilter, searchQuery])

  // Get unique products for filter
  const products = useMemo(() => {
    const productMap = new Map<string, string>()
    rfqs.forEach((rfq) => {
      if (rfq.products?.product_id && rfq.products?.product_name) {
        productMap.set(rfq.products.product_id, rfq.products.product_name)
      }
    })
    return Array.from(productMap.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [rfqs])

  // Group RFQs by status for summary (from current page only)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    rfqs.forEach((rfq) => {
      counts[rfq.status] = (counts[rfq.status] || 0) + 1
    })
    return counts
  }, [rfqs])

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || productFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setProductFilter('all')
    setCurrentPage(1)
  }

  const handleStatusChange = async (rfq: RFQ, status: RFQStatus) => {
    try {
      const response = await fetch('/api/rfqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rfq_id: rfq.rfq_id,
          status,
          response_message: responseMessage || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to update RFQ')

      const data = await response.json()
      
      // Update local state
      setRfqs((prev) =>
        prev.map((r) => (r.rfq_id === rfq.rfq_id ? data.rfq : r))
      )

      toast.success(`RFQ marked as ${STATUS_CONFIG[status].label}`)
      setStatusDialogOpen(false)
      setSelectedRfq(null)
      setResponseMessage('')
    } catch (error) {
      console.error('Error updating RFQ:', error)
      toast.error('Failed to update RFQ status')
    }
  }

  const openStatusDialog = (rfq: RFQ, status: RFQStatus) => {
    setSelectedRfq(rfq)
    setNewStatus(status)
    setResponseMessage(rfq.response_message || '')
    setStatusDialogOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">
                    Requests for Quotation
                  </h1>
                  {!isLoading && (
                    <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                      {totalCount} {totalCount === 1 ? 'RFQ' : 'RFQs'}
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Manage and respond to buyer inquiries
                </p>
              </div>
              {totalCount > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                    const count = statusCounts[status] || 0
                    if (count === 0) return null
                    return (
                      <Badge
                        key={status}
                        variant="outline"
                        className={`${config.color} border px-3 py-1.5 text-xs font-medium`}
                      >
                        {config.label}: {count}
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-border/30 bg-background/50">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-11 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Product Filter */}
            {products.length > 0 && (
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map(([id, name]) => (
                    <SelectItem key={id} value={id}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-2 h-11"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          {!isLoading && (
            <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
              Showing {rfqs.length} of {totalCount} RFQ{totalCount !== 1 ? 's' : ''}
            </div>
          )}
        </section>

        {/* RFQs List */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Loading RFQs...</p>
              </div>
            </div>
          ) : rfqs.length === 0 ? (
            <div className="max-w-2xl mx-auto py-12">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold mb-2">
                  {hasActiveFilters ? 'No RFQs found' : 'No RFQs received yet'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or search query'
                    : 'When buyers send you requests for quotation, they\'ll appear here'}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="gap-2"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {rfqs.map((rfq) => {
                const StatusIcon = STATUS_CONFIG[rfq.status].icon
                const statusConfig = STATUS_CONFIG[rfq.status]

                return (
                  <div
                    key={rfq.rfq_id}
                    className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-4 sm:p-5 hover:border-border/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
                      {/* Left: Product Image & Name */}
                      <div className="flex-shrink-0">
                        {rfq.products ? (
                          <Link
                            href={`/products/${rfq.product_id}?merchant=true`}
                            className="group block"
                          >
                            {/* Product Image */}
                            {rfq.products?.product_data?.product_images && 
                             Array.isArray(rfq.products.product_data.product_images) && 
                             rfq.products.product_data.product_images.length > 0 ? (
                              <div className="mb-3">
                                <img
                                  src={rfq.products.product_data.product_images[0]}
                                  alt={rfq.products.product_name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border border-border/30 group-hover:border-primary/50 transition-colors"
                                />
                              </div>
                            ) : (
                              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center mb-3 group-hover:border-primary/50 transition-colors">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Product Name */}
                            <h4 className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                              {rfq.products.product_name}
                            </h4>
                            {rfq.products.product_data?.product_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {rfq.products.product_data.product_name}
                              </p>
                            )}
                          </Link>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Middle: Buyer Info & Message */}
                      <div className="flex-1 min-w-0">
                        {/* Buyer Name & Status */}
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <h3 className="text-base sm:text-lg font-semibold text-foreground leading-tight">
                              {rfq.name}
                            </h3>
                          </div>
                          
                          {/* Status Badge */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge
                              variant="outline"
                              className={`${statusConfig.color} border px-2.5 py-1 text-xs font-medium whitespace-nowrap`}
                            >
                              {statusConfig.label}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {rfq.status !== 'new' && (
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'new')}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Mark as New
                                  </DropdownMenuItem>
                                )}
                                {rfq.status !== 'in_progress' && (
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'in_progress')}
                                  >
                                    <Clock className="h-4 w-4 mr-2" />
                                    Mark In Progress
                                  </DropdownMenuItem>
                                )}
                                {rfq.status !== 'responded' && (
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'responded')}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Mark as Responded
                                  </DropdownMenuItem>
                                )}
                                {rfq.status !== 'won' && (
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'won')}
                                  >
                                    <TrendingUp className="h-4 w-4 mr-2" />
                                    Mark as Won
                                  </DropdownMenuItem>
                                )}
                                {rfq.status !== 'lost' && (
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'lost')}
                                  >
                                    <TrendingDown className="h-4 w-4 mr-2" />
                                    Mark as Lost
                                  </DropdownMenuItem>
                                )}
                                {rfq.status !== 'archived' && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => openStatusDialog(rfq, 'archived')}
                                    >
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {rfq.products && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/products/${rfq.product_id}?merchant=true`}
                                      >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        View Product
                                      </Link>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                            
                        {/* Contact Info Row - Company, Email, Phone, Time */}
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 pb-3 border-b border-border/30">
                          <span className="flex items-center gap-1.5 text-sm">
                            <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="font-medium text-foreground">{rfq.company}</span>
                          </span>
                          <a
                            href={`mailto:${rfq.email}`}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span>{rfq.email}</span>
                          </a>
                          {rfq.phone && (
                            <a
                              href={`tel:${rfq.phone}`}
                              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Phone className="h-4 w-4 flex-shrink-0" />
                              <span>{rfq.phone}</span>
                            </a>
                          )}
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDistanceToNow(new Date(rfq.submitted_at), { addSuffix: true })}</span>
                          </span>
                        </div>

                        {/* Message Preview */}
                        <div className="mb-3">
                          <p className="text-sm text-foreground leading-relaxed">
                            {rfq.message}
                          </p>
                        </div>

                        {/* Additional Details */}
                        {(rfq.quantity || rfq.target_date) && (
                          <div className="flex flex-wrap gap-4 text-sm mb-3">
                            {rfq.quantity && (
                              <span>
                                <span className="text-muted-foreground">Quantity:</span>{' '}
                                <span className="font-medium text-foreground">{rfq.quantity}</span>
                              </span>
                            )}
                            {rfq.target_date && (
                              <span>
                                <span className="text-muted-foreground">Target Date:</span>{' '}
                                <span className="font-medium text-foreground">
                                  {format(new Date(rfq.target_date), 'MMM d, yyyy')}
                                </span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Response Message (if exists) */}
                        {rfq.response_message && (
                          <div className="mt-3 pt-3 border-t border-border/30">
                            <div className="bg-primary/5 rounded-md p-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                                Your Response
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {rfq.response_message}
                              </p>
                              {rfq.responded_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(rfq.responded_at), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="mt-6 sm:mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
          </div>
          )}
        </section>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Update RFQ Status</DialogTitle>
            <DialogDescription>
              Change the status of this RFQ to {STATUS_CONFIG[newStatus]?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RFQStatus)}>
                <SelectTrigger id="status" className="mt-2 h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newStatus === 'responded' || newStatus === 'won') && (
              <div>
                <Label htmlFor="response" className="text-sm font-medium">Response Message (Optional)</Label>
                <Textarea
                  id="response"
                  placeholder="Add a note about your response..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false)
                setSelectedRfq(null)
                setResponseMessage('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRfq && handleStatusChange(selectedRfq, newStatus)}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
