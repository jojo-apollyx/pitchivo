'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { createUsersColumns } from './columns'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import type { User } from './types'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch users data
async function fetchUsers() {
  const supabase = createClient()
  
  // Get auth users with banned status
  const { data: authUsersData } = await supabase.functions.invoke('admin-list-users').catch(() => ({ data: null }))
  
  const bannedStatusMap = new Map<string, boolean>()
  if (authUsersData?.users) {
    authUsersData.users.forEach((authUser: any) => {
      const isBanned = authUser.is_banned === true || 
                      (authUser.banned_until !== null && authUser.banned_until !== undefined)
      bannedStatusMap.set(authUser.id, isBanned)
    })
  }
  
  // Get user profiles with organizations
  const { data: usersData, error } = await supabase
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

  if (error) throw error

  return (usersData || []).map((user: any) => {
    const isBanned = bannedStatusMap.get(user.id) || false
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
      status: (isBanned ? 'suspended' : 'active') as 'active' | 'suspended',
    }
  })
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { openDialog, closeDialog, isDialogOpen, getDialogData } = useUIStore()
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended'>('all')

  // Fetch data with TanStack Query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: fetchUsers,
  })

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      return filterStatus === 'all' || user.status === filterStatus
    })
  }, [users, filterStatus])

  const handleImpersonate = (user: User) => {
    openDialog('impersonate', user)
  }

  const confirmImpersonate = async () => {
    const user = getDialogData('impersonate') as User
    if (!user?.id) return

    try {
      const response = await fetch('/api/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to set impersonate session')
      }
      
      window.location.href = '/dashboard'
    } catch (error) {
      console.error('Error impersonating:', error)
      toast.error('Failed to start impersonation session')
    }
  }

  const handleSuspend = (user: User) => {
    openDialog('suspend', user)
  }

  const confirmSuspend = async () => {
    const user = getDialogData('suspend') as User
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('admin-suspend-user', {
        body: { 
          userId: user.id,
          action: 'suspend'
        }
      })

      if (error) throw error

      toast.success(`User ${user.email} has been suspended successfully`)
      closeDialog('suspend')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (error: any) {
      console.error('Error suspending user:', error)
      toast.error(`Failed to suspend user: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUnsuspend = (user: User) => {
    openDialog('unsuspend', user)
  }

  const confirmUnsuspend = async () => {
    const user = getDialogData('unsuspend') as User
    if (!user) return

    try {
      const { data, error } = await supabase.functions.invoke('admin-suspend-user', {
        body: { 
          userId: user.id,
          action: 'unsuspend'
        }
      })

      if (error) throw error

      toast.success(`User ${user.email} has been unsuspended successfully`)
      closeDialog('unsuspend')
      
      await new Promise(resolve => setTimeout(resolve, 500))
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    } catch (error: any) {
      console.error('Error unsuspending user:', error)
      toast.error(`Failed to unsuspend user: ${error.message || 'Unknown error'}`)
    }
  }

  const handleViewDetails = (userId: string) => {
    router.push(`/admin/users/${userId}`)
  }

  const columns = useMemo(
    () => createUsersColumns(
      handleImpersonate,
      handleSuspend,
      handleUnsuspend,
      handleViewDetails
    ),
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Page Header - Integral Section */}
        <motion.section
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50"
        >
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Users / Organizations</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage all users and their organizations
            </p>
          </div>
        </motion.section>

        {/* Search and Filters - Integral Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30"
        >
          <div className="max-w-6xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="min-h-[44px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('active')}
                  className="min-h-[44px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                >
                  Active
                </Button>
                <Button
                  variant={filterStatus === 'suspended' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('suspended')}
                  className="min-h-[44px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                >
                  Suspended
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Users Table - Integral Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          <div className="max-w-6xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <DataTable
                columns={columns}
                data={filteredUsers}
                searchKey="email"
                searchPlaceholder="Search by email, name, or organization..."
                loading={isLoading}
                emptyMessage="No users found"
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* Impersonate Dialog */}
      <Dialog
        open={isDialogOpen('impersonate')}
        onOpenChange={(open) => open ? null : closeDialog('impersonate')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impersonate User</DialogTitle>
            <DialogDescription>
              You will be redirected to view the dashboard as <strong>{(getDialogData('impersonate') as User)?.email}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('impersonate')}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmImpersonate}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Impersonate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog
        open={isDialogOpen('suspend')}
        onOpenChange={(open) => open ? null : closeDialog('suspend')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend <strong>{(getDialogData('suspend') as User)?.email}</strong>? They will not be able to log in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('suspend')}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmSuspend}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog
        open={isDialogOpen('unsuspend')}
        onOpenChange={(open) => open ? null : closeDialog('unsuspend')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Unsuspend <strong>{(getDialogData('unsuspend') as User)?.email}</strong>? They will be able to log in again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('unsuspend')}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnsuspend}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
            >
              Unsuspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
