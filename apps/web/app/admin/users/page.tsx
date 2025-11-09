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
import { Pagination } from '@/components/ui/pagination'
import { 
  Search, 
  UserCog, 
  UserX, 
  Eye
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Organization {
  id: string
  name: string
  owner_email: string
  created_at: string
  status: 'active' | 'suspended'
}

const ITEMS_PER_PAGE = 20

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [impersonateDialog, setImpersonateDialog] = useState<{ open: boolean; org: Organization | null }>({ open: false, org: null })

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, owner_email, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map to include status (default to active for now)
      const orgsWithStatus = (data || []).map(org => ({
        ...org,
        status: 'active' as const,
      }))

      setOrganizations(orgsWithStatus)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = (org: Organization) => {
    setImpersonateDialog({ open: true, org })
  }

  const confirmImpersonate = () => {
    if (impersonateDialog.org) {
      // Redirect to dashboard with impersonate query param
      window.location.href = `/dashboard?impersonate=${impersonateDialog.org.id}`
    }
  }

  const handleSuspend = async (orgId: string) => {
    // TODO: Implement suspend functionality
    console.log('Suspend organization:', orgId)
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.owner_email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || org.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredOrganizations.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, endIndex)

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Users / Organizations</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage organizations and their owners
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1) // Reset to first page on search
              }}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
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
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('active')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'suspended' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setFilterStatus('suspended')
                setCurrentPage(1)
              }}
              className="min-h-[36px]"
            >
              Suspended
            </Button>
          </div>
        </div>
      </section>

      {/* Organizations Table - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization Name</TableHead>
                    <TableHead>Owner Email</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Campaigns Sent</TableHead>
                    <TableHead>RFQs Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrganizations.length > 0 ? (
                    paginatedOrganizations.map((org) => (
                      <TableRow key={org.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.owner_email}</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell className="text-muted-foreground">-</TableCell>
                        <TableCell>
                          <Badge
                            variant={org.status === 'active' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleImpersonate(org)}
                              className="min-h-[36px] px-2"
                              title="Impersonate"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/users/${org.id}`)}
                              className="min-h-[36px] px-2"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSuspend(org.id)}
                              className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                              title="Suspend"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                        No organizations found
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

      {/* Impersonate Confirmation Dialog */}
      <Dialog open={impersonateDialog.open} onOpenChange={(open) => setImpersonateDialog({ open, org: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate Organization</DialogTitle>
            <DialogDescription>
              You are about to impersonate <strong>{impersonateDialog.org?.name}</strong>. 
              You will see the interface as this organization's owner would see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImpersonateDialog({ open: false, org: null })}
            >
              Cancel
            </Button>
            <Button onClick={confirmImpersonate}>
              Confirm Impersonate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
