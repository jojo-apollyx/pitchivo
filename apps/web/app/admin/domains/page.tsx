'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/data-table/data-table'
import { createDomainsColumns } from './columns'
import { useUIStore } from '@/lib/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Shield, Plus, CheckCircle } from 'lucide-react'
import type { BlockedDomain } from './types'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Fetch blocked domains
async function fetchBlockedDomains() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('email_domain_policy')
    .select('*')
    .eq('status', 'blocked')
    .order('is_public_domain', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as BlockedDomain[]
}

export default function AdminDomainsPage() {
  const supabase = createClient()
  const queryClient = useQueryClient()
  const { openDialog, closeDialog, isDialogOpen, getDialogData } = useUIStore()
  const [newDomain, setNewDomain] = useState('')

  // Fetch data with TanStack Query
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['admin', 'domains'],
    queryFn: fetchBlockedDomains,
  })

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain')
      return
    }

    try {
      const domain = newDomain.includes('@') 
        ? newDomain.split('@')[1].toLowerCase().trim()
        : newDomain.toLowerCase().trim()

      const { error } = await supabase
        .from('email_domain_policy')
        .upsert({
          domain,
          status: 'blocked',
          is_public_domain: false,
          reason: 'Manually blocked by admin',
        })

      if (error) throw error

      toast.success('Domain added to blocklist')
      setNewDomain('')
      closeDialog('add')
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error('Failed to add domain to blocklist')
    }
  }

  const handleRemoveDomain = async () => {
    const domain = getDialogData('remove') as BlockedDomain
    if (!domain) return

    try {
      const { error } = await supabase
        .from('email_domain_policy')
        .delete()
        .eq('domain', domain.domain)
        .eq('status', 'blocked')

      if (error) throw error

      toast.success('Domain removed from blocklist')
      closeDialog('remove')
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
    } catch (error) {
      console.error('Error removing domain:', error)
      toast.error('Failed to remove domain from blocklist')
    }
  }

  const handleUnblockDomain = async () => {
    const domain = getDialogData('unblock') as BlockedDomain
    if (!domain) return

    try {
      const { error } = await supabase
        .from('email_domain_policy')
        .update({ status: 'allowed' })
        .eq('domain', domain.domain)
        .eq('status', 'blocked')

      if (error) throw error

      toast.success('Domain unblocked successfully')
      closeDialog('unblock')
      queryClient.invalidateQueries({ queryKey: ['admin', 'domains'] })
    } catch (error) {
      console.error('Error unblocking domain:', error)
      toast.error('Failed to unblock domain')
    }
  }

  const columns = useMemo(
    () => createDomainsColumns(handleUnblockDomain, handleRemoveDomain),
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
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Domain Control</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Manage blocked domains and email domain policies
            </p>
          </div>
        </motion.section>

        {/* Add Domain - Integral Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30"
        >
          <div className="max-w-4xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">Add Domain to Blocklist</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Enter domain (e.g., spamdomain.com or user@spamdomain.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1 h-11 transition-all duration-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      openDialog('add', { domain: newDomain })
                    }
                  }}
                />
                <Button
                  onClick={() => openDialog('add', { domain: newDomain })}
                  className="min-h-[44px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Blocked Domains List - Integral Section */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
        >
          <div className="max-w-6xl">
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Blocked Domains</h2>
              <DataTable
                columns={columns}
                data={domains}
                searchKey="domain"
                searchPlaceholder="Search domains..."
                loading={isLoading}
                emptyMessage="No blocked domains"
              />
            </div>
          </div>
        </motion.section>
      </div>

      {/* Add Domain Dialog */}
      <Dialog
        open={isDialogOpen('add')}
        onOpenChange={(open) => open ? null : closeDialog('add')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Domain to Blocklist</DialogTitle>
            <DialogDescription>
              Add <strong>{newDomain.includes('@') ? newDomain.split('@')[1] : newDomain}</strong> to the blocklist? 
              This will prevent all emails from this domain from registering.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('add')}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain}>
              Add to Blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Domain Dialog */}
      <Dialog
        open={isDialogOpen('unblock')}
        onOpenChange={(open) => open ? null : closeDialog('unblock')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock Domain</DialogTitle>
            <DialogDescription>
              Unblock <strong>{(getDialogData('unblock') as BlockedDomain)?.domain}</strong>? 
              This will change the status to 'allowed' and permit emails from this domain to register.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('unblock')}
            >
              Cancel
            </Button>
            <Button onClick={handleUnblockDomain}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Unblock Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Domain Dialog */}
      <Dialog
        open={isDialogOpen('remove')}
        onOpenChange={(open) => open ? null : closeDialog('remove')}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Domain from Blocklist</DialogTitle>
            <DialogDescription>
              Permanently remove <strong>{(getDialogData('remove') as BlockedDomain)?.domain}</strong> from the blocklist? 
              This will delete the record entirely. To temporarily allow the domain, use "Unblock" instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => closeDialog('remove')}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveDomain}
            >
              Remove from Blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
