'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, Plus, Users, Building2 } from 'lucide-react'
import { generateMockBuyers, type Buyer, type BuyerContact } from '@/lib/mock-data/buyers'
import type { Lead } from '@/lib/mock-data/leads'

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  onLeadsAdded: (leads: Lead[]) => void
}

export function AddLeadDialog({
  open,
  onOpenChange,
  campaignId,
  onLeadsAdded
}: AddLeadDialogProps) {
  const [activeTab, setActiveTab] = useState<'manual' | 'database'>('manual')
  
  // Manual add state
  const [newLead, setNewLead] = useState({ email: '', name: '', title: '', company: '' })
  
  // Database search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  
  // Load buyer database (in real app, this would be from API)
  const buyers = useMemo(() => generateMockBuyers(200), [])
  
  // Filter buyers based on search
  const filteredBuyers = useMemo(() => {
    if (!searchTerm.trim()) return buyers.slice(0, 20) // Show first 20 if no search
    
    const term = searchTerm.toLowerCase()
    return buyers.filter(buyer =>
      buyer.company.toLowerCase().includes(term) ||
      buyer.industry.toLowerCase().includes(term) ||
      buyer.country.toLowerCase().includes(term) ||
      buyer.contactDetails?.some(contact =>
        contact.name.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term) ||
        contact.role.toLowerCase().includes(term)
      )
    ).slice(0, 50) // Limit to 50 results
  }, [buyers, searchTerm])

  async function handleManualAdd() {
    if (!newLead.email || !newLead.name || !newLead.company) {
      toast.error('Please fill in all required fields')
      return
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newLead.email)) {
      toast.error('Invalid email address')
      return
    }
    
    try {
      // Persist lead to database
      const response = await fetch('/api/admin/campaigns/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          leads: [{
            email: newLead.email,
            name: newLead.name,
            title: newLead.title,
            company: newLead.company,
            status: 'active'
          }]
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add lead')
      }

      onLeadsAdded(result.leads)
      setNewLead({ email: '', name: '', title: '', company: '' })
      onOpenChange(false)
      toast.success('Lead added successfully!')
    } catch (error: any) {
      console.error('Error adding lead:', error)
      toast.error(error.message || 'Failed to add lead')
    }
  }

  function toggleContactSelection(buyerCompany: string, contactEmail: string) {
    const key = `${buyerCompany}|${contactEmail}`
    const newSelected = new Set(selectedContacts)
    
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    
    setSelectedContacts(newSelected)
  }

  function toggleBuyerSelection(buyer: Buyer) {
    const contacts = buyer.contactDetails || []
    const allSelected = contacts.every(c => 
      selectedContacts.has(`${buyer.company}|${c.email}`)
    )
    
    const newSelected = new Set(selectedContacts)
    
    if (allSelected) {
      // Deselect all
      contacts.forEach(c => newSelected.delete(`${buyer.company}|${c.email}`))
    } else {
      // Select all
      contacts.forEach(c => newSelected.add(`${buyer.company}|${c.email}`))
    }
    
    setSelectedContacts(newSelected)
  }

  async function handleBulkAdd() {
    if (selectedContacts.size === 0) {
      toast.error('Please select at least one contact')
      return
    }
    
    const leads: any[] = []
    
    selectedContacts.forEach(key => {
      const [companyName, email] = key.split('|')
      const buyer = buyers.find(b => b.company === companyName)
      const contact = buyer?.contactDetails?.find(c => c.email === email)
      
      if (buyer && contact) {
        leads.push({
          email: contact.email,
          name: contact.name,
          title: contact.title || contact.role,
          company: buyer.company,
          country: buyer.country,
          industry: buyer.industry,
          status: 'active'
        })
      }
    })
    
    if (leads.length > 0) {
      try {
        // Persist leads to database
        const response = await fetch('/api/admin/campaigns/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId,
            leads
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to add leads')
        }

        onLeadsAdded(result.leads)
        setSelectedContacts(new Set())
        setSearchTerm('')
        onOpenChange(false)
        toast.success(`${result.count} lead${result.count !== 1 ? 's' : ''} added successfully!`)
      } catch (error: any) {
        console.error('Error adding leads:', error)
        toast.error(error.message || 'Failed to add leads')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Leads to Campaign</DialogTitle>
          <DialogDescription>
            Add individual leads manually or search the buyer database to bulk add contacts.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="manual" className="gap-2">
              <Plus className="h-4 w-4" />
              Manual Add
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Users className="h-4 w-4" />
              Search Database
            </TabsTrigger>
          </TabsList>

          {/* Manual Add Tab */}
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Procurement Manager"
                  value={newLead.title}
                  onChange={(e) => setNewLead({ ...newLead, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  placeholder="Company Name"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleManualAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Database Search Tab */}
          <TabsContent value="database" className="flex-1 flex flex-col space-y-4 min-h-0">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, industry, contact name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {selectedContacts.size > 0 && (
                <div className="flex items-center justify-between bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <span className="text-sm font-medium">
                    {selectedContacts.size} contact{selectedContacts.size !== 1 ? 's' : ''} selected
                  </span>
                  <Button size="sm" onClick={handleBulkAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected
                  </Button>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-auto rounded-lg border border-border/30">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="min-w-[180px]">Company</TableHead>
                      <TableHead className="min-w-[150px]">Contact</TableHead>
                      <TableHead className="min-w-[150px]">Title</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead className="min-w-[150px]">Industry</TableHead>
                      <TableHead className="min-w-[100px]">Country</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredBuyers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No matching companies found' : 'Enter a search term to find companies'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBuyers.map((buyer) => {
                      const contacts = buyer.contactDetails || []
                      const allSelected = contacts.length > 0 && contacts.every(c => 
                        selectedContacts.has(`${buyer.company}|${c.email}`)
                      )
                      const someSelected = contacts.some(c => 
                        selectedContacts.has(`${buyer.company}|${c.email}`)
                      )

                      return contacts.length > 0 ? (
                        <>
                          {/* Company Header Row */}
                          <TableRow key={buyer.company} className="bg-muted/30">
                            <TableCell>
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={() => toggleBuyerSelection(buyer)}
                                aria-label={`Select all contacts from ${buyer.company}`}
                              />
                            </TableCell>
                            <TableCell colSpan={2} className="font-medium">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                {buyer.company}
                                <Badge variant="outline" className="text-xs">
                                  {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell colSpan={2} className="text-sm text-muted-foreground">
                              {buyer.website && (
                                <a 
                                  href={buyer.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-primary"
                                >
                                  {buyer.website}
                                </a>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{buyer.industry}</TableCell>
                            <TableCell className="text-sm">{buyer.country}</TableCell>
                          </TableRow>
                          
                          {/* Contact Rows */}
                          {contacts.map((contact) => {
                            const contactKey = `${buyer.company}|${contact.email}`
                            const isSelected = selectedContacts.has(contactKey)
                            
                            return (
                              <TableRow 
                                key={contactKey}
                                className="hover:bg-accent/50 cursor-pointer"
                                onClick={() => toggleContactSelection(buyer.company, contact.email)}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleContactSelection(buyer.company, contact.email)}
                                    aria-label={`Select ${contact.name}`}
                                  />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm pl-8">└</TableCell>
                                <TableCell className="font-medium">{contact.name}</TableCell>
                                <TableCell className="text-sm">{contact.title || contact.role}</TableCell>
                                <TableCell className="text-sm font-mono">{contact.email}</TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                            )
                          })}
                        </>
                      ) : null
                    })
                  )}
                </TableBody>
              </Table>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkAdd} disabled={selectedContacts.size === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add {selectedContacts.size > 0 ? `${selectedContacts.size} ` : ''}Selected
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

