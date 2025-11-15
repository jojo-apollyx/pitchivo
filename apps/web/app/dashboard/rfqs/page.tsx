'use client'

import { useState, useEffect, useMemo } from 'react'
import { MessageSquare, Search, X, Mail, Phone, Building2, Calendar, Package, CheckCircle2, Clock, Archive, TrendingUp, TrendingDown, MoreVertical, ExternalLink, Loader2, Filter, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background via-50% to-accent/5 relative">
      {/* Page Header - Sticky */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-tight text-foreground">
                RFQ Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {totalCount} {totalCount === 1 ? 'inquiry' : 'inquiries'} total
              </p>
            </div>
            
            {/* Status Pills - Compact */}
            {totalCount > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const count = statusCounts[status] || 0
                  if (count === 0) return null
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all touch-manipulation',
                        statusFilter === status 
                          ? config.color 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {config.label} <span className="ml-1 opacity-70">({count})</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search & Filters - Compact */}
      <section className="px-4 sm:px-6 lg:px-8 py-3 border-b border-border/20 bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search by name, company, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9 text-sm border-border/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm border-border/50">
                  <SelectValue placeholder="Status" />
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
                  <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm border-border/50">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    {products.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name.length > 20 ? name.substring(0, 20) + '...' : name}
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
                  className="gap-1.5 h-9 px-3 text-xs hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          {!isLoading && (
            <div className="text-xs text-muted-foreground">
              {rfqs.length === 0 
                ? 'No RFQs found'
                : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}-${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount}`
              }
            </div>
          )}
        </div>
      </section>

      {/* RFQs List - Continuous Flow */}
      <section className="px-4 sm:px-6 lg:px-8 bg-background/60 backdrop-blur-sm min-h-[500px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading inquiries...</p>
            </div>
          </div>
        ) : rfqs.length === 0 ? (
          <div className="py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-base font-semibold mb-1.5">
                {hasActiveFilters ? 'No RFQs match your filters' : 'No inquiries yet'}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Buyer inquiries will appear here when you receive them'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  size="sm"
                  className="gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {rfqs.map((rfq) => {
              const StatusIcon = STATUS_CONFIG[rfq.status].icon
              const statusConfig = STATUS_CONFIG[rfq.status]

              return (
                <div
                  key={rfq.rfq_id}
                  className="py-3.5 sm:py-4 hover:bg-accent/5 transition-colors -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 group"
                >
                  <div className="flex gap-3">
                    {/* Product Image - Compact */}
                    {rfq.products?.product_data?.product_images?.[0] ? (
                      <div className="flex-shrink-0">
                        <img
                          src={rfq.products.product_data.product_images[0]}
                          alt={rfq.products.product_name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-border/30"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-muted/30 border border-border/20 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {/* Buyer Name & Company */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">
                              {rfq.name}
                            </h3>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="h-3 w-3 flex-shrink-0" />
                              {rfq.company}
                            </span>
                          </div>

                          {/* Product Name - If exists */}
                          {rfq.products && (
                            <Link
                              href={`/products/${rfq.product_id}?merchant=true`}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-1.5"
                            >
                              <span className="line-clamp-1">{rfq.products.product_name}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          )}

                          {/* Message Preview */}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                            {rfq.message}
                          </p>

                          {/* Meta Info - Compact Row */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <a
                              href={`mailto:${rfq.email}`}
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                              title={rfq.email}
                            >
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate max-w-[140px]">{rfq.email}</span>
                            </a>
                            {rfq.phone && (
                              <a
                                href={`tel:${rfq.phone}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors"
                              >
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                {rfq.phone}
                              </a>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {formatDistanceToNow(new Date(rfq.submitted_at), { addSuffix: true })}
                            </span>
                            {rfq.quantity && (
                              <span>
                                <span className="text-muted-foreground/70">Qty:</span> {rfq.quantity}
                              </span>
                            )}
                            {rfq.target_date && (
                              <span>
                                <span className="text-muted-foreground/70">Target:</span>{' '}
                                {format(new Date(rfq.target_date), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>

                          {/* Response Message (if exists) - Compact */}
                          {rfq.response_message && (
                            <div className="mt-2 pt-2 border-t border-border/20">
                              <div className="bg-primary/5 rounded-md px-2.5 py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-0.5">
                                  Your Response
                                </p>
                                <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                                  {rfq.response_message}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Status & Actions - Right Side */}
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <Badge
                            variant="outline"
                            className={cn(
                              'border px-2.5 py-0.5 text-xs font-medium',
                              statusConfig.color
                            )}
                          >
                            {statusConfig.label}
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {rfq.status !== 'new' && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(rfq, 'new')}
                                  className="text-xs"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 mr-2" />
                                  Mark as New
                                </DropdownMenuItem>
                              )}
                              {rfq.status !== 'in_progress' && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(rfq, 'in_progress')}
                                  className="text-xs"
                                >
                                  <Clock className="h-3.5 w-3.5 mr-2" />
                                  In Progress
                                </DropdownMenuItem>
                              )}
                              {rfq.status !== 'responded' && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(rfq, 'responded')}
                                  className="text-xs"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                                  Responded
                                </DropdownMenuItem>
                              )}
                              {rfq.status !== 'won' && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(rfq, 'won')}
                                  className="text-xs"
                                >
                                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                                  Won
                                </DropdownMenuItem>
                              )}
                              {rfq.status !== 'lost' && (
                                <DropdownMenuItem
                                  onClick={() => openStatusDialog(rfq, 'lost')}
                                  className="text-xs"
                                >
                                  <TrendingDown className="h-3.5 w-3.5 mr-2" />
                                  Lost
                                </DropdownMenuItem>
                              )}
                              {rfq.status !== 'archived' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => openStatusDialog(rfq, 'archived')}
                                    className="text-xs"
                                  >
                                    <Archive className="h-3.5 w-3.5 mr-2" />
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
                                      className="text-xs"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5 mr-2" />
                                      View Product
                                    </Link>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="mt-6 pb-6">
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-lg">Update Status</DialogTitle>
            <DialogDescription className="text-sm">
              Change the status of this inquiry to {STATUS_CONFIG[newStatus]?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-3">
            <div>
              <Label htmlFor="status" className="text-sm font-medium mb-2 block">
                New Status
              </Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as RFQStatus)}>
                <SelectTrigger id="status" className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                    <SelectItem key={status} value={status} className="text-sm">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(newStatus === 'responded' || newStatus === 'won') && (
              <div>
                <Label htmlFor="response" className="text-sm font-medium mb-2 block">
                  Response Message <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="response"
                  placeholder="Add a note about your response..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatusDialogOpen(false)
                setSelectedRfq(null)
                setResponseMessage('')
              }}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedRfq && handleStatusChange(selectedRfq, newStatus)}
              className="h-9 text-sm"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
