'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
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
import { Search, Plus, Users, Building2, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-react'
import type { Lead } from '@/lib/mock-data/leads'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'

// Types for database leads
interface Contact {
  lead_id: string
  email: string
  name: string
  title: string
  phone?: string
  linkedin_url?: string
  status: string
}

interface Company {
  id?: string
  company: string
  industry: string
  country: string
  location?: string
  domain?: string | null
  business_type?: string[]
  contacts: Contact[]
  products?: Product[]
  contactCount?: number
  interaction_type?: string
}

interface Product {
  id: string
  name: string
  category?: string
  item_type?: string
  aliases?: string[]
  interaction_type?: string
}

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
  contactName: string
  contactTitle: string
  contactEmail: string
  industry: string
  country: string
  isCompanyHeader: boolean
  contactCount?: number
  companyData: Company
  contact?: Contact
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
  const [searchMode, setSearchMode] = useState<'company' | 'product'>('company')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [companies, setCompanies] = useState<Company[]>([])
  const [products, setProducts] = useState<Array<{ id: string; name: string; category?: string; item_type?: string; aliases?: string[]; companies: Company[] }>>([])
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  
  // Autocomplete state
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{ id: string; name: string; display: string; [key: string]: any }>>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  
  // Debounced autocomplete effect
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      await fetchAutocompleteSuggestions(searchTerm)
    }, 200) // 200ms debounce for autocomplete

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchMode])

  // Debounced full search effect
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setCompanies([])
      setProducts([])
      setShowAutocomplete(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      setShowAutocomplete(false) // Hide autocomplete when doing full search
      if (searchMode === 'company') {
        await searchByCompany(searchTerm)
      } else {
        await searchByProduct(searchTerm)
      }
    }, 500) // 500ms debounce for full search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchMode])

  async function fetchAutocompleteSuggestions(term: string) {
    if (!term || term.trim().length < 1) {
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
      return
    }

    try {
      const endpoint = searchMode === 'company' 
        ? `/api/admin/leads/autocomplete-company?q=${encodeURIComponent(term)}&limit=10`
        : `/api/admin/leads/autocomplete-product?q=${encodeURIComponent(term)}&limit=10`
      
      const response = await fetch(endpoint)
      if (!response.ok) return
      
      const data = await response.json()
      setAutocompleteSuggestions(data.suggestions || [])
      setShowAutocomplete((data.suggestions || []).length > 0)
      setSelectedSuggestionIndex(-1)
    } catch (error) {
      console.error('Error fetching autocomplete:', error)
      setAutocompleteSuggestions([])
      setShowAutocomplete(false)
    }
  }

  async function searchByCompany(term: string) {
    if (!term || term.trim().length < 2) return

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/leads/search-by-company?q=${encodeURIComponent(term)}&limit=50`)
      if (!response.ok) throw new Error('Failed to search by company')
      
      const data = await response.json()
      setCompanies(data.companies || [])
      setProducts([])
    } catch (error) {
      console.error('Error searching by company:', error)
      toast.error('Failed to search by company')
    } finally {
      setSearching(false)
    }
  }

  async function searchByProduct(term: string) {
    if (!term || term.trim().length < 2) return

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/leads/search-by-product?q=${encodeURIComponent(term)}&limit=50`)
      if (!response.ok) throw new Error('Failed to search by product')
      
      const data = await response.json()
      setProducts(data.products || [])
      setCompanies([])
    } catch (error) {
      console.error('Error searching by product:', error)
      toast.error('Failed to search by product')
    } finally {
      setSearching(false)
    }
  }

  function toggleCompanyExpansion(companyId: string) {
    const newExpanded = new Set(expandedCompanies)
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId)
    } else {
      newExpanded.add(companyId)
    }
    setExpandedCompanies(newExpanded)
  }

  function handleSelectSuggestion(suggestion: { id: string; name: string; display: string; [key: string]: any }) {
    setSearchTerm(suggestion.name)
    setShowAutocomplete(false)
    setAutocompleteSuggestions([])
    setSelectedSuggestionIndex(-1)
    
    // Trigger search immediately
    if (searchMode === 'company') {
      searchByCompany(suggestion.name)
    } else {
      searchByProduct(suggestion.name)
    }
  }

  // Flatten data for TanStack Table - create rows for both company headers and contacts
  const tableData = useMemo(() => {
    const rows: ContactRow[] = []
    
    companies.forEach(company => {
      const contacts = company.contacts || []
      if (contacts.length === 0) return
      
      // Add company header row
      rows.push({
        id: `company-${company.company}`,
        company: company.company,
        contactName: '',
        contactTitle: '',
        contactEmail: '',
        industry: company.industry,
        country: company.country,
        isCompanyHeader: true,
        contactCount: contacts.length,
        companyData: company
      })
      
      // Add contact rows
      contacts.forEach(contact => {
        rows.push({
          id: `${company.company}|${contact.email}`,
          company: company.company,
          contactName: contact.name,
          contactTitle: contact.title,
          contactEmail: contact.email,
          industry: '',
          country: '',
          isCompanyHeader: false,
          companyData: company,
          contact
        })
      })
    })
    
    return rows
  }, [companies])

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

  function toggleCompanySelection(company: Company) {
    const contacts = company.contacts || []
    const allSelected = contacts.every(c => 
      selectedContacts.has(`${company.company}|${c.email}`)
    )
    
    const newSelected = new Set(selectedContacts)
    
    if (allSelected) {
      // Deselect all
      contacts.forEach(c => newSelected.delete(`${company.company}|${c.email}`))
    } else {
      // Select all
      contacts.forEach(c => newSelected.add(`${company.company}|${c.email}`))
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
          const contacts = data.companyData.contacts || []
          const allSelected = contacts.every(c => 
            selectedContacts.has(`${data.company}|${c.email}`)
          )
          return (
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => toggleCompanySelection(data.companyData)}
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
          return null
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
      
      // Try to find in companies (search by company mode)
      let company = companies.find(c => c.company === companyName)
      let contact = company?.contacts?.find(c => c.email === email)
      
      // If not found, try to find in products' companies (search by product mode)
      if (!company || !contact) {
        for (const product of products) {
          company = product.companies.find(c => c.company === companyName)
          if (company) {
            contact = company.contacts.find(c => c.email === email)
            if (contact) break
          }
        }
      }
      
      if (company && contact) {
        leads.push({
          email: contact.email,
          name: contact.name,
          title: contact.title,
          company: company.company,
          country: company.country,
          industry: company.industry,
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
              {/* Search Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={searchMode === 'company' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSearchMode('company')
                    setSearchTerm('')
                    setCompanies([])
                    setProducts([])
                  }}
                  className="gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Search by Company
                </Button>
                <Button
                  variant={searchMode === 'product' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSearchMode('product')
                    setSearchTerm('')
                    setCompanies([])
                    setProducts([])
                  }}
                  className="gap-2"
                >
                  <Package className="h-4 w-4" />
                  Search by Product
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  ref={searchInputRef}
                  placeholder={
                    searchMode === 'company'
                      ? 'Search by company name...'
                      : 'Search by product name...'
                  }
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setShowAutocomplete(true)
                  }}
                  onFocus={() => {
                    if (autocompleteSuggestions.length > 0) {
                      setShowAutocomplete(true)
                    }
                  }}
                  onBlur={(e) => {
                    // Delay hiding to allow click on suggestion
                    setTimeout(() => {
                      if (!document.activeElement?.closest('.autocomplete-dropdown')) {
                        setShowAutocomplete(false)
                      }
                    }, 200)
                  }}
                  onKeyDown={(e) => {
                    if (!showAutocomplete || autocompleteSuggestions.length === 0) return
                    
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setSelectedSuggestionIndex(prev => 
                        prev < autocompleteSuggestions.length - 1 ? prev + 1 : prev
                      )
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
                    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
                      e.preventDefault()
                      handleSelectSuggestion(autocompleteSuggestions[selectedSuggestionIndex])
                    } else if (e.key === 'Escape') {
                      setShowAutocomplete(false)
                    }
                  }}
                  className="pl-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {/* Autocomplete Dropdown */}
                {showAutocomplete && autocompleteSuggestions.length > 0 && (
                  <div className="autocomplete-dropdown absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                    {autocompleteSuggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id}
                        className={`px-4 py-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                          index === selectedSuggestionIndex ? 'bg-accent' : ''
                        } ${index === 0 ? 'rounded-t-lg' : ''} ${
                          index === autocompleteSuggestions.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectSuggestion(suggestion)
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {searchMode === 'company' ? (
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{suggestion.name}</div>
                            {suggestion.display && suggestion.display !== suggestion.name && (
                              <div className="text-xs text-muted-foreground truncate">
                                {suggestion.display.replace(suggestion.name, '').trim()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

            {/* Results Display */}
            <div className="flex-1 flex flex-col rounded-lg border border-border/30 overflow-hidden">
              <div className="overflow-auto flex-1">
                {searchMode === 'company' ? (
                  // Search by Company Results
                  <div className="space-y-4 p-4">
                    {companies.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-muted-foreground">
                            {searching ? (
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Searching database...
                              </div>
                            ) : searchTerm && searchTerm.length >= 2 ? (
                              'No matching companies found'
                            ) : (
                          'Enter at least 2 characters to search by company'
                        )}
                      </div>
                    ) : (
                      companies.map((company) => (
                        <div key={company.id || company.company} className="border border-border/30 rounded-lg p-4 space-y-3">
                          {/* Company Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">{company.company}</h3>
                                <Badge variant="outline">{company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {company.industry && <span>Industry: {company.industry}</span>}
                                {company.country && <span>Country: {company.country}</span>}
                                {company.location && <span>Location: {company.location}</span>}
                              </div>
                            </div>
                            <Checkbox
                              checked={company.contacts.every(c => 
                                selectedContacts.has(`${company.company}|${c.email}`)
                              )}
                              onCheckedChange={() => {
                                const allSelected = company.contacts.every(c => 
                                  selectedContacts.has(`${company.company}|${c.email}`)
                                )
                                const newSelected = new Set(selectedContacts)
                                if (allSelected) {
                                  company.contacts.forEach(c => newSelected.delete(`${company.company}|${c.email}`))
                                } else {
                                  company.contacts.forEach(c => newSelected.add(`${company.company}|${c.email}`))
                                }
                                setSelectedContacts(newSelected)
                              }}
                            />
                          </div>

                          {/* Products */}
                          {company.products && company.products.length > 0 && (
                            <div className="bg-muted/30 rounded-md p-3">
                              <div className="text-xs font-semibold text-muted-foreground mb-2">Related Products:</div>
                              <div className="flex flex-wrap gap-2">
                                {company.products.map((product) => (
                                  <Badge key={product.id} variant="outline" className="text-xs">
                                    <Package className="h-3 w-3 mr-1" />
                                    {product.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Contacts */}
                          <div className="space-y-2">
                            <div className="text-xs font-semibold text-muted-foreground">Contacts:</div>
                            <div className="space-y-1">
                              {company.contacts.map((contact) => (
                                <div
                                  key={contact.email}
                                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
                                  onClick={() => toggleContactSelection({
                                    id: `${company.company}|${contact.email}`,
                                    company: company.company,
                                    contactName: contact.name,
                                    contactTitle: contact.title,
                                    contactEmail: contact.email,
                                    industry: '',
                                    country: '',
                                    isCompanyHeader: false,
                                    companyData: company,
                                    contact
                                  })}
                                >
                                  <Checkbox
                                    checked={selectedContacts.has(`${company.company}|${contact.email}`)}
                                    onCheckedChange={() => {}}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{contact.name}</div>
                                    <div className="text-xs text-muted-foreground">{contact.title}</div>
                                    <div className="text-xs font-mono text-muted-foreground">{contact.email}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Search by Product Results
                  <div className="space-y-4 p-4">
                    {products.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-muted-foreground">
                        {searching ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Searching database...
                          </div>
                        ) : searchTerm && searchTerm.length >= 2 ? (
                          'No matching products found'
                        ) : (
                          'Enter at least 2 characters to search by product'
                        )}
                      </div>
                    ) : (
                      products.map((product) => (
                        <div key={product.id} className="border border-border/30 rounded-lg p-4 space-y-3">
                          {/* Product Header */}
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                            {product.category && (
                              <Badge variant="outline" className="text-xs">{product.category}</Badge>
                            )}
                            {product.aliases && product.aliases.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {product.aliases.length} alias{product.aliases.length !== 1 ? 'es' : ''}
                              </Badge>
                            )}
                          </div>

                          {/* Companies */}
                          {product.companies.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground">
                                Related Companies ({product.companies.length}):
                              </div>
                              {product.companies.map((company) => (
                                <div key={company.id || company.company} className="border border-border/20 rounded-md p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-medium">{company.company}</span>
                                      {company.interaction_type && (
                                        <Badge variant="outline" className="text-xs">
                                          {company.interaction_type}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {company.contactCount || company.contacts.length} contact{company.contactCount !== 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleCompanyExpansion(company.id || company.company)}
                                      className="gap-1"
                                    >
                                      {expandedCompanies.has(company.id || company.company) ? (
                                        <>
                                          <ChevronUp className="h-4 w-4" />
                                          Hide Contacts
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-4 w-4" />
                                          Show Contacts
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {company.industry && <span>Industry: {company.industry}</span>}
                                    {company.country && <span className="ml-2">Country: {company.country}</span>}
                                  </div>

                                  {/* Expanded Contacts */}
                                  {expandedCompanies.has(company.id || company.company) && (
                                    <div className="mt-2 space-y-1 border-t border-border/20 pt-2">
                                      {company.contacts.map((contact) => (
                                        <div
                                          key={contact.email}
                                          className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer"
                                          onClick={() => toggleContactSelection({
                                            id: `${company.company}|${contact.email}`,
                                            company: company.company,
                                            contactName: contact.name,
                                            contactTitle: contact.title,
                                            contactEmail: contact.email,
                                            industry: '',
                                            country: '',
                                            isCompanyHeader: false,
                                            companyData: company,
                                            contact
                                          })}
                                        >
                                          <Checkbox
                                            checked={selectedContacts.has(`${company.company}|${contact.email}`)}
                                            onCheckedChange={() => {}}
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{contact.name}</div>
                                            <div className="text-xs text-muted-foreground">{contact.title}</div>
                                            <div className="text-xs font-mono text-muted-foreground">{contact.email}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">No companies found for this product</div>
                          )}
                        </div>
                      ))
                    )}
                </div>
                )}
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

