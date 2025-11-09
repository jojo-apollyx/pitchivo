'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { 
  Shield, 
  Plus, 
  Trash2,
  CheckCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface BlockedDomain {
  domain: string
  status: 'blocked' | 'whitelisted' | 'allowed'
  is_public_domain?: boolean
  reason?: string
  created_at: string
  updated_at: string
}

const ITEMS_PER_PAGE = 20

export default function AdminDomainsPage() {
  const supabase = createClient()
  const [domains, setDomains] = useState<BlockedDomain[]>([])
  const [loading, setLoading] = useState(true)
  const [newDomain, setNewDomain] = useState('')
  const [addDialog, setAddDialog] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [removeDialog, setRemoveDialog] = useState<{ open: boolean; domain: string | null }>({ open: false, domain: null })
  const [unblockDialog, setUnblockDialog] = useState<{ open: boolean; domain: string | null }>({ open: false, domain: null })

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('email_domain_policy')
        .select('*')
        .eq('status', 'blocked')
        .order('is_public_domain', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setDomains(data || [])
    } catch (error) {
      console.error('Error loading domains:', error)
      toast.error('Failed to load blocked domains')
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain')
      return
    }

    try {
      // Extract domain from email if provided
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
      setAddDialog(false)
      loadDomains()
    } catch (error) {
      console.error('Error adding domain:', error)
      toast.error('Failed to add domain to blocklist')
    }
  }

  const handleRemoveDomain = async () => {
    if (!removeDialog.domain) return

    try {
      const { error } = await supabase
        .from('email_domain_policy')
        .delete()
        .eq('domain', removeDialog.domain)
        .eq('status', 'blocked')

      if (error) throw error

      toast.success('Domain removed from blocklist')
      setRemoveDialog({ open: false, domain: null })
      loadDomains()
    } catch (error) {
      console.error('Error removing domain:', error)
      toast.error('Failed to remove domain from blocklist')
    }
  }

  const handleUnblockDomain = async () => {
    if (!unblockDialog.domain) return

    try {
      const { error } = await supabase
        .from('email_domain_policy')
        .update({ status: 'allowed' })
        .eq('domain', unblockDialog.domain)
        .eq('status', 'blocked')

      if (error) throw error

      toast.success('Domain unblocked successfully')
      setUnblockDialog({ open: false, domain: null })
      loadDomains()
    } catch (error) {
      console.error('Error unblocking domain:', error)
      toast.error('Failed to unblock domain')
    }
  }

  // Pagination
  const totalPages = Math.ceil(domains.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedDomains = domains.slice(startIndex, endIndex)

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-background">
      {/* Page Header - Integral Section */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Domain Control</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Manage blocked domains and email domain policies
          </p>
        </div>
      </section>

      {/* Add Domain - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-border/30">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <h2 className="text-lg sm:text-xl font-semibold">Add Domain to Blocklist</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Enter domain (e.g., spamdomain.com or user@spamdomain.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="flex-1 h-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAddDialog(true)
              }
            }}
          />
          <Button
            onClick={() => setAddDialog(true)}
            className="min-h-[36px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Domain
          </Button>
        </div>
      </section>

      {/* Blocked Domains List - Integral Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-semibold">Blocked Domains</h2>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDomains.length > 0 ? (
                    paginatedDomains.map((domain) => (
                      <TableRow key={domain.domain} className="hover:bg-accent/5">
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell>
                          {domain.is_public_domain ? (
                            <Badge variant="info" className="text-xs">
                              Public
                            </Badge>
                          ) : (
                            <Badge variant="error" className="text-xs">
                              Blocked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(domain.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {domain.reason || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!domain.is_public_domain && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setUnblockDialog({ open: true, domain: domain.domain })}
                                    className="min-h-[36px] px-2 text-primary hover:text-primary"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Unblock domain (change to allowed)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRemoveDialog({ open: true, domain: domain.domain })}
                                  className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove from blocklist permanently</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                        No blocked domains
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

      {/* Add Domain Confirmation Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
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
              onClick={() => setAddDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDomain}>
              Add to Blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Domain Confirmation Dialog */}
      <Dialog open={unblockDialog.open} onOpenChange={(open) => setUnblockDialog({ open, domain: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock Domain</DialogTitle>
            <DialogDescription>
              Unblock <strong>{unblockDialog.domain}</strong>? 
              This will change the status to 'allowed' and permit emails from this domain to register.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnblockDialog({ open: false, domain: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUnblockDomain}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Unblock Domain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Domain Confirmation Dialog */}
      <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, domain: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Domain from Blocklist</DialogTitle>
            <DialogDescription>
              Permanently remove <strong>{removeDialog.domain}</strong> from the blocklist? 
              This will delete the record entirely. To temporarily allow the domain, use "Unblock" instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog({ open: false, domain: null })}
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
    </div>
    </TooltipProvider>
  )
}
