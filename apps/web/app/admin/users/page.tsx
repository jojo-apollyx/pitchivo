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
  UserCog, 
  UserX, 
  Eye,
  UserCheck
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

interface User {
  id: string
  email: string
  full_name?: string
  organization_id?: string
  organization_name?: string
  organization_domain?: string
  org_role?: 'marketing' | 'sales' | 'user'
  is_pitchivo_admin: boolean
  created_at: string
  status: 'active' | 'suspended'
}

const ITEMS_PER_PAGE = 20

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [impersonateDialog, setImpersonateDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [suspendDialog, setSuspendDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [unsuspendDialog, setUnsuspendDialog] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      
      // First, get all auth users with their banned status using admin endpoint
      // Note: This requires calling an Edge Function since client can't access auth.users directly
      const { data: authUsersData, error: authError } = await supabase.functions.invoke('admin-list-users')
      
      if (authError) {
        console.error('Error loading auth users:', authError)
        // Fall back to loading without status
      }
      
      // Create a map of user IDs to their banned status
      const bannedStatusMap = new Map<string, boolean>()
      if (authUsersData?.users) {
        console.log('Auth users data:', authUsersData.users)
        authUsersData.users.forEach((authUser: any) => {
          const isBanned = authUser.is_banned === true || 
                          (authUser.banned_until !== null && authUser.banned_until !== undefined)
          console.log(`User ${authUser.email}: banned=${isBanned}, banned_until=${authUser.banned_until}`)
          bannedStatusMap.set(authUser.id, isBanned)
        })
      }
      console.log('Banned status map size:', bannedStatusMap.size)
      
      // Get all users with their organization info
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select(`
          id,
          email,
          full_name,
          organization_id,
          org_role,
          is_pitchivo_admin,
          created_at,
          organizations (
            id,
            name,
            domain
          )
        `)
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      const usersWithOrg = (usersData || []).map((user: any) => {
        const isBanned = bannedStatusMap.get(user.id) || false
        const status = isBanned ? ('suspended' as const) : ('active' as const)
        console.log(`User ${user.email}: status=${status}, banned=${isBanned}`)
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          organization_id: user.organization_id,
          organization_name: user.organizations?.name,
          organization_domain: user.organizations?.domain,
          org_role: user.org_role,
          is_pitchivo_admin: user.is_pitchivo_admin,
          created_at: user.created_at,
          status: status,
        }
      })

      setUsers(usersWithOrg)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = (user: User) => {
    if (user.id) {
      setImpersonateDialog({ open: true, user })
    }
  }

  const confirmImpersonate = async () => {
    if (impersonateDialog.user?.id) {
      try {
        // Set impersonate cookie via API with USER_ID
        const response = await fetch('/api/impersonate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: impersonateDialog.user.id }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to set impersonate session')
        }
        
        // Redirect to dashboard
        window.location.href = '/dashboard'
      } catch (error) {
        console.error('Error impersonating:', error)
        alert('Failed to start impersonation session')
      }
    }
  }

  const handleSuspend = (user: User) => {
    setSuspendDialog({ open: true, user })
  }

  const confirmSuspend = async () => {
    if (!suspendDialog.user) return

    try {
      const { data, error } = await supabase.functions.invoke('admin-suspend-user', {
        body: { 
          userId: suspendDialog.user.id,
          action: 'suspend'
        }
      })

      if (error) throw error

      console.log('User suspended successfully:', data)
      alert(`User ${suspendDialog.user.email} has been suspended successfully`)
      
      setSuspendDialog({ open: false, user: null })
      
      // Wait a moment for Supabase to process the ban
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Reload users list to show updated status
      await loadUsers()
    } catch (error: any) {
      console.error('Error suspending user:', error)
      alert(`Failed to suspend user: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUnsuspend = (user: User) => {
    setUnsuspendDialog({ open: true, user })
  }

  const confirmUnsuspend = async () => {
    if (!unsuspendDialog.user) return

    try {
      const { data, error } = await supabase.functions.invoke('admin-suspend-user', {
        body: { 
          userId: unsuspendDialog.user.id,
          action: 'unsuspend'
        }
      })

      if (error) throw error

      console.log('User unsuspended successfully:', data)
      alert(`User ${unsuspendDialog.user.email} has been unsuspended successfully`)
      
      setUnsuspendDialog({ open: false, user: null })
      
      // Wait a moment for Supabase to process the unban
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Reload users list to show updated status
      await loadUsers()
    } catch (error: any) {
      console.error('Error unsuspending user:', error)
      alert(`Failed to unsuspend user: ${error.message || 'Unknown error'}`)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.organization_name && user.organization_name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Users / Organizations</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage all users and their organizations
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

      {/* Users Table - Integral Section */}
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
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.organization_name || '-'}
                        </TableCell>
                        <TableCell>
                          {user.org_role ? (
                            <Badge variant="info" className="text-xs">
                              {user.org_role}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.is_pitchivo_admin ? (
                            <Badge variant="warning" className="text-xs">
                              Admin
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'success' : 'error'}
                            className="text-xs"
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.organization_id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleImpersonate(user)}
                                    className="min-h-[36px] px-2"
                                  >
                                    <UserCog className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Impersonate this organization</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {user.organization_id && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/admin/users/${user.organization_id}`)}
                                    className="min-h-[36px] px-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View organization details</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {user.status === 'active' ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSuspend(user)}
                                    className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Suspend this user</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnsuspend(user)}
                                    className="min-h-[36px] px-2 text-success hover:text-success"
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unsuspend this user</p>
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
                        No users found
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
      <Dialog open={impersonateDialog.open} onOpenChange={(open) => setImpersonateDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate Organization</DialogTitle>
            <DialogDescription>
              You are about to impersonate <strong>{impersonateDialog.user?.organization_name}</strong> as <strong>{impersonateDialog.user?.email}</strong>. 
              You will see the interface as this user would see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImpersonateDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button onClick={confirmImpersonate}>
              Confirm Impersonate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Confirmation Dialog */}
      <Dialog open={suspendDialog.open} onOpenChange={(open) => setSuspendDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to suspend <strong>{suspendDialog.user?.email}</strong>? 
              This will prevent the user from accessing the application until they are unsuspended.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
            >
              Suspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Confirmation Dialog */}
      <Dialog open={unsuspendDialog.open} onOpenChange={(open) => setUnsuspendDialog({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unsuspend <strong>{unsuspendDialog.user?.email}</strong>? 
              This will restore the user's access to the application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnsuspendDialog({ open: false, user: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnsuspend}
            >
              Unsuspend User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  )
}
