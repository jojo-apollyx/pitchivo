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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, Plus, Users, Building2 } from 'lucide-react'
import { generateMockBuyers, type Buyer, type BuyerContact } from '@/lib/mock-data/buyers'
import type { Lead } from '@/lib/mock-data/leads'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  onLeadsAdded: (leads: Lead[]) => void
}

// Type for flattened contact rows
type ContactRow = {
  id: string
  company: string
  companyWebsite: string
  contactName: string
  contactTitle: string
  contactEmail: string
  industry: string
  country: string
  isCompanyHeader: boolean
  contactCount?: number
  buyer: Buyer
  contact?: BuyerContact
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

  // Flatten data for TanStack Table - create rows for both company headers and contacts
  const tableData = useMemo(() => {
    const rows: ContactRow[] = []
    
    filteredBuyers.forEach(buyer => {
      const contacts = buyer.contactDetails || []
      if (contacts.length === 0) return
      
      // Add company header row
      rows.push({
        id: `company-${buyer.company}`,
        company: buyer.company,
        companyWebsite: buyer.website || '',
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        industry: buyer.industry,
        country: buyer.country,
        isCompanyHeader: true,
        contactCount: contacts.length,
        buyer
      })
      
      // Add contact rows
      contacts.forEach(contact => {
        rows.push({
          id: `${buyer.company}|${contact.email}`,
          company: buyer.company,
          companyWebsite: '',
          contactName: contact.name,
          contactTitle: contact.title || contact.role,
          contactEmail: contact.email,
          industry: '',
          country: '',
          isCompanyHeader: false,
          buyer,
          contact
        })
      })
    })
    
    return rows
  }, [filteredBuyers])

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

  function toggleContactSelection(row: ContactRow) {
    if (row.isCompanyHeader) return
    
    const newSelected = new Set(selectedContacts)
    
    if (newSelected.has(row.id)) {
      newSelected.delete(row.id)
    } else {
      newSelected.add(row.id)
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

  // Define columns for TanStack Table
  const columns = useMemo<ColumnDef<ContactRow>[]>(() => [
    {
      id: 'select',
      header: () => null,
      cell: ({ row }) => {
        const data = row.original
        if (data.isCompanyHeader) {
          const contacts = data.buyer.contactDetails || []
          const allSelected = contacts.every(c => 
            selectedContacts.has(`${data.company}|${c.email}`)
          )
          return (
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => toggleBuyerSelection(data.buyer)}
              aria-label={`Select all contacts from ${data.company}`}
            />
          )
        } else {
          return (
            <Checkbox
              checked={selectedContacts.has(data.id)}
              onCheckedChange={() => toggleContactSelection(data)}
              aria-label={`Select ${data.contactName}`}
            />
          )
        }
      },
      size: 50,
    },
    {
      accessorKey: 'company',
      header: 'Company',
      cell: ({ row }) => {
        const data = row.original
        if (data.isCompanyHeader) {
          return (
            <div className="flex items-center gap-2 font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span>{data.company}</span>
              <Badge variant="outline" className="text-xs">
                {data.contactCount} contact{data.contactCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          )
        } else {
          return (
            <div className="text-muted-foreground text-sm pl-8">└</div>
          )
        }
      },
      size: 220,
    },
    {
      accessorKey: 'contactName',
      header: 'Contact Name',
      cell: ({ row }) => {
        const data = row.original
        if (data.isCompanyHeader) {
          return (
            <div className="text-sm text-muted-foreground">
              {data.companyWebsite && (
                <a 
                  href={data.companyWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  {data.companyWebsite}
                </a>
              )}
            </div>
          )
        } else {
          return <span className="font-medium">{data.contactName}</span>
        }
      },
      size: 180,
    },
    {
      accessorKey: 'contactTitle',
      header: 'Title',
      cell: ({ row }) => {
        const data = row.original
        if (data.isCompanyHeader) return null
        return <span className="text-sm">{data.contactTitle}</span>
      },
      size: 180,
    },
    {
      accessorKey: 'contactEmail',
      header: 'Email',
      cell: ({ row }) => {
        const data = row.original
        if (data.isCompanyHeader) return null
        return <span className="text-sm font-mono">{data.contactEmail}</span>
      },
      size: 220,
    },
    {
      accessorKey: 'industry',
      header: 'Industry',
      cell: ({ row }) => {
        const data = row.original
        if (!data.isCompanyHeader) return null
        return <span className="text-sm">{data.industry}</span>
      },
      size: 160,
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }) => {
        const data = row.original
        if (!data.isCompanyHeader) return null
        return <span className="text-sm">{data.country}</span>
      },
      size: 140,
    },
  ], [selectedContacts])

  // Initialize TanStack Table
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

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

            {/* Results Table with TanStack Table */}
            <div className="flex-1 flex flex-col rounded-lg border border-border/30 overflow-hidden">
              <div className="overflow-auto flex-1">
                <div className="min-w-max">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted/30 sticky top-0 z-10">
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map(header => (
                            <th
                              key={header.id}
                              style={{ width: header.getSize() }}
                              className="h-12 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border"
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {tableData.length === 0 ? (
                        <tr>
                          <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                            {searchTerm ? 'No matching companies found' : 'Enter a search term to find companies'}
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map(row => {
                          const isCompanyHeader = row.original.isCompanyHeader
                          return (
                            <tr
                              key={row.id}
                              className={
                                isCompanyHeader 
                                  ? 'bg-muted/30 border-b border-border' 
                                  : 'hover:bg-accent/50 cursor-pointer border-b border-border/50'
                              }
                              onClick={() => !isCompanyHeader && toggleContactSelection(row.original)}
                            >
                              {row.getVisibleCells().map(cell => (
                                <td
                                  key={cell.id}
                                  style={{ width: cell.column.getSize() }}
                                  className="px-4 py-3 align-middle"
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
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

