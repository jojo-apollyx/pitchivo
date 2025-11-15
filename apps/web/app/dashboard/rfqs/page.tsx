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

  // Group RFQs by status for summary (from all pages)
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light/5 via-background to-primary-light/5">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight mb-1">
                  Requests for Quotation
                </h1>
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
                    className="bg-card/50 backdrop-blur-sm rounded-lg border border-border/30 p-3 sm:p-4 hover:border-border/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                      {/* Left: Product Image & Info */}
                      <div className="flex items-start gap-3 flex-shrink-0">
                        {/* Product Image */}
                        {rfq.products?.product_data?.product_images && 
                         Array.isArray(rfq.products.product_data.product_images) && 
                         rfq.products.product_data.product_images.length > 0 ? (
                          <div className="flex-shrink-0">
                            <img
                              src={rfq.products.product_data.product_images[0]}
                              alt={rfq.products.product_name}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover border border-border/30"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center flex-shrink-0">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Product Name */}
                        {rfq.products && (
                          <div className="flex-shrink-0 min-w-[120px] sm:min-w-[150px]">
                            <Link
                              href={`/products/${rfq.product_id}?merchant=true`}
                              className="group"
                            >
                              <h4 className="text-xs sm:text-sm font-semibold text-foreground mb-0.5 group-hover:text-primary transition-colors line-clamp-2">
                                {rfq.products.product_name}
                              </h4>
                            </Link>
                            {rfq.products.product_data?.product_name && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {rfq.products.product_data.product_name}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Middle: Buyer Info & Message */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                          {/* Buyer Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1.5">
                              <StatusIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-0.5 leading-tight">
                                  {rfq.name}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {rfq.company}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Contact & Time */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1.5">
                              <a
                                href={`mailto:${rfq.email}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[150px]">{rfq.email}</span>
                              </a>
                              {rfq.phone && (
                                <a
                                  href={`tel:${rfq.phone}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Phone className="h-3 w-3" />
                                  {rfq.phone}
                                </a>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDistanceToNow(new Date(rfq.submitted_at), { addSuffix: true })}
                              </span>
                            </div>

                            {/* Message Preview */}
                            <div className="mt-2">
                              <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                                {rfq.message}
                              </p>
                            </div>

                            {/* Additional Details */}
                            {(rfq.quantity || rfq.target_date) && (
                              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                {rfq.quantity && (
                                  <span>
                                    <span className="text-muted-foreground">Qty:</span>{' '}
                                    <span className="font-medium text-foreground">{rfq.quantity}</span>
                                  </span>
                                )}
                                {rfq.target_date && (
                                  <span>
                                    <span className="text-muted-foreground">Target:</span>{' '}
                                    <span className="font-medium text-foreground">
                                      {format(new Date(rfq.target_date), 'MMM d, yyyy')}
                                    </span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Right: Status & Actions */}
                          <div className="flex items-start gap-2 flex-shrink-0 sm:flex-col sm:items-end">
                            <Badge
                              variant="outline"
                              className={`${statusConfig.color} border px-2 py-1 text-xs font-medium`}
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

                        {/* Response Message (if exists) */}
                        {rfq.response_message && (
                          <div className="mt-2 pt-2 border-t border-border/30">
                            <div className="bg-primary/5 rounded-md p-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">
                                Your Response
                              </p>
                              <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                                {rfq.response_message}
                              </p>
                              {rfq.responded_at && (
                                <p className="text-xs text-muted-foreground mt-1">
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
