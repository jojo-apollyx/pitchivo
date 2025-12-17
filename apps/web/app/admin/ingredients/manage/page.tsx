'use client'

import { useState } from 'react'
import { Search, Plus, Building2, Users, Trash2, Edit, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingIllustration } from '@/components/ui/loading-illustration'
import { toast } from 'sonner'
import { AddEditDialog } from './components/AddEditDialog'
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog'

interface Ingredient {
  id: string
  name: string
  category?: string
  aliases?: string[]
}

interface Signal {
  id: string
  org_id: string
  item_id: string
  contact_id?: string
  interaction_type: string
  event_date: string
  created_at: string
  is_verified: boolean
}

interface Contact {
  id: string
  org_id: string
  first_name?: string
  last_name?: string
  full_name: string
  email?: string
  title?: string
  linkedin_url?: string
  email_status: string
}

interface Company {
  id: string
  name: string
  domain?: string
  location?: string
  country?: string
  profileData: any
  signals: Signal[]
  contacts: Contact[]
}

interface ManageData {
  ingredient: Ingredient
  companies: Company[]
  totalCompanies: number
  totalSignals: number
  totalContacts: number
}

export default function IngredientsManagePage() {
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [data, setData] = useState<ManageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addEditOpen, setAddEditOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'signal' | 'all' | 'contact' | 'company'; signalId?: string; companyId?: string; contactId?: string; companyName?: string } | null>(null)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  // Search using the SAME API as campaign creation (generate-buyers)
  async function searchIngredient() {
    const query = ingredientSearch.trim()
    if (!query) {
      toast.error('Please enter an ingredient name')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setData(null)
      
      // Use EXACT same API as campaign creation, but get ALL results (limit: 0)
      const response = await fetch('/api/campaigns/generate-buyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: query, limit: 0 })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to search')
      }

      const result = await response.json()
      
      // Set selected ingredient - use search term as name, matched item for ID
      const matchedItem = result.matchedItems?.[0]
      setSelectedIngredient({
        id: matchedItem?.id || `search-${Date.now()}`,
        name: query, // Use what user typed, not matched item name
        category: matchedItem?.category,
        aliases: matchedItem?.aliases || []
      })

      // Transform buyers to our Company format
      const companies: Company[] = (result.buyers || []).map((buyer: any) => ({
        id: buyer.orgId, // Use real database ID
        name: buyer.company,
        domain: buyer.website || undefined,
        location: buyer.location || undefined,
        country: buyer.location || undefined,
        profileData: {
          companyType: buyer.companyType,
          employeeCount: buyer.employeeCount
        },
        signals: (buyer.interactionTypes || []).map((type: string, sidx: number) => ({
          id: `signal-${buyer.orgId}-${sidx}`,
          org_id: buyer.orgId,
          item_id: matchedItem?.id || '',
          interaction_type: type,
          event_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          is_verified: true
        })),
        contacts: (buyer.contactDetails || []).map((contact: any) => ({
          id: contact.id, // Use real database ID
          org_id: buyer.orgId,
          first_name: contact.name?.split(' ')[0] || '',
          last_name: contact.name?.split(' ').slice(1).join(' ') || '',
          full_name: contact.name || 'Unknown',
          email: contact.email || undefined,
          title: contact.title || undefined,
          email_status: 'unknown'
        }))
      }))

      setData({
        ingredient: {
          id: matchedItem?.id || `search-${Date.now()}`,
          name: query, // Use what user typed
          category: matchedItem?.category,
          aliases: matchedItem?.aliases || []
        },
        companies,
        totalCompanies: result.totalBuyers || 0,
        totalSignals: companies.reduce((sum, c) => sum + c.signals.length, 0),
        totalContacts: result.totalContacts || 0
      })

      if (result.totalBuyers === 0) {
        toast.error('No companies found for this ingredient')
      } else {
        toast.success(`Found ${result.totalBuyers} companies with ${result.totalContacts} contacts`)
      }
    } catch (err) {
      console.error('Error searching:', err)
      const message = err instanceof Error ? err.message : 'Failed to search'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  function toggleCompany(companyId: string) {
    setExpandedCompanies(prev => {
      const newSet = new Set(prev)
      if (newSet.has(companyId)) {
        newSet.delete(companyId)
      } else {
        newSet.add(companyId)
      }
      return newSet
    })
  }

  function handleAddNew() {
    setEditingCompany(null)
    setAddEditOpen(true)
  }

  function handleEditCompany(company: Company) {
    setEditingCompany(company)
    setAddEditOpen(true)
  }

  function handleDeleteSignal(signalId: string) {
    setDeleteTarget({ type: 'signal', signalId })
    setDeleteDialogOpen(true)
  }

  function handleDeleteAllSignals(company: Company) {
    setDeleteTarget({ type: 'all', companyId: company.id })
    setDeleteDialogOpen(true)
  }

  function handleDeleteContact(contactId: string) {
    setDeleteTarget({ type: 'contact', contactId })
    setDeleteDialogOpen(true)
  }

  function handleDeleteCompany(company: Company) {
    setDeleteTarget({ type: 'company', companyId: company.id, companyName: company.name })
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget || !selectedIngredient || !data) return

    try {
      if (deleteTarget.type === 'signal' && deleteTarget.signalId) {
        const response = await fetch(`/api/admin/ingredients/signals/${deleteTarget.signalId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete signal')
        }

        // Update local state - remove signal from company
        setData({
          ...data,
          companies: data.companies.map(company => ({
            ...company,
            signals: company.signals.filter(s => s.id !== deleteTarget.signalId)
          })),
          totalSignals: data.totalSignals - 1
        })
        toast.success('Signal deleted')
      } else if (deleteTarget.type === 'all' && deleteTarget.companyId) {
        const response = await fetch(
          `/api/admin/ingredients/company-signals?orgId=${deleteTarget.companyId}&itemId=${selectedIngredient.id}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error('Failed to delete signals')
        }

        // Update local state - remove all signals for company
        const company = data.companies.find(c => c.id === deleteTarget.companyId)
        const signalsRemoved = company?.signals.length || 0
        setData({
          ...data,
          companies: data.companies.map(c => 
            c.id === deleteTarget.companyId 
              ? { ...c, signals: [] }
              : c
          ),
          totalSignals: data.totalSignals - signalsRemoved
        })
        toast.success('All signals deleted')
      } else if (deleteTarget.type === 'contact' && deleteTarget.contactId) {
        const response = await fetch(`/api/admin/ingredients/contacts/${deleteTarget.contactId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete contact')
        }

        // Update local state - remove contact from company
        setData({
          ...data,
          companies: data.companies.map(company => ({
            ...company,
            contacts: company.contacts.filter(c => c.id !== deleteTarget.contactId)
          })),
          totalContacts: data.totalContacts - 1
        })
        toast.success('Contact deleted')
      } else if (deleteTarget.type === 'company' && deleteTarget.companyId) {
        const response = await fetch(`/api/admin/ingredients/companies/${deleteTarget.companyId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete company')
        }

        // Update local state - remove company entirely
        const company = data.companies.find(c => c.id === deleteTarget.companyId)
        const signalsRemoved = company?.signals.length || 0
        const contactsRemoved = company?.contacts.length || 0
        setData({
          ...data,
          companies: data.companies.filter(c => c.id !== deleteTarget.companyId),
          totalCompanies: data.totalCompanies - 1,
          totalSignals: data.totalSignals - signalsRemoved,
          totalContacts: data.totalContacts - contactsRemoved
        })
        toast.success('Company and all related data deleted')
      }

      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Failed to delete')
    }
  }

  function handleSaveSuccess() {
    setAddEditOpen(false)
    setEditingCompany(null)
    searchIngredient()
  }

  function handleClear() {
    setSelectedIngredient(null)
    setIngredientSearch('')
    setData(null)
    setError(null)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-semibold">Ingredient Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage companies, contacts, and signals for ingredients
              </p>
            </div>
            {selectedIngredient && (
              <Button onClick={handleAddNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Ingredient Search - Same as campaign creation */}
          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Enter ingredient name (e.g., Alpha Lipoic Acid)"
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      searchIngredient()
                    }
                  }}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={searchIngredient}
                disabled={!ingredientSearch.trim() || loading}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {selectedIngredient && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="outline" className="text-sm">
                  {selectedIngredient.name}
                </Badge>
                {selectedIngredient.category && (
                  <span className="text-sm text-muted-foreground">{selectedIngredient.category}</span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-xs"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-card/50 rounded-xl p-12 flex items-center justify-center min-h-[400px]">
              <LoadingIllustration size="lg" message="Finding companies and contacts..." />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-card/50 rounded-xl p-12 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Data Display */}
          {!loading && !error && data && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Companies</div>
                  <div className="text-2xl font-bold mt-1">{data.totalCompanies}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Signals</div>
                  <div className="text-2xl font-bold mt-1">{data.totalSignals}</div>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Contacts</div>
                  <div className="text-2xl font-bold mt-1">{data.totalContacts}</div>
                </div>
              </div>

              {/* Companies List */}
              {data.companies.length === 0 ? (
                <div className="bg-card/50 rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">No companies found for this ingredient.</p>
                  <Button onClick={handleAddNew} className="mt-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Add First Company
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.companies.map((company) => {
                    const isExpanded = expandedCompanies.has(company.id)
                    return (
                      <div key={company.id} className="bg-card/50 rounded-xl border border-border/30">
                        {/* Company Header */}
                        <div className="p-4 border-b border-border/30">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <h3 className="font-semibold text-lg">{company.name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {company.domain && <span>{company.domain}</span>}
                                {company.location && <span>{company.location}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCompany(company)}
                                className="gap-2"
                              >
                                <Edit className="h-3 w-3" />
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCompany(company)}
                                className="gap-2"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete Company
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Signals */}
                        {company.signals.length > 0 && (
                          <div className="p-4 border-b border-border/30">
                            <div className="text-sm font-medium mb-2">Signals ({company.signals.length})</div>
                            <div className="space-y-2">
                              {company.signals.map((signal) => (
                                <div
                                  key={signal.id}
                                  className="flex items-center justify-between p-2 bg-background/50 rounded-md"
                                >
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{signal.interaction_type}</Badge>
                                    <span className="text-sm text-muted-foreground">{signal.event_date}</span>
                                    {signal.is_verified && (
                                      <Badge variant="outline" className="text-xs">Verified</Badge>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteSignal(signal.id)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Contacts */}
                        {company.contacts.length > 0 && (
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-medium">Contacts ({company.contacts.length})</div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCompany(company.id)}
                                className="h-7"
                              >
                                {isExpanded ? 'Hide' : 'Show'}
                              </Button>
                            </div>
                            {isExpanded && (
                              <div className="space-y-2">
                                {company.contacts.map((contact) => (
                                  <div
                                    key={contact.id}
                                    className="flex items-center justify-between p-2 bg-background/50 rounded-md"
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3 w-3 text-muted-foreground" />
                                      <div>
                                        <div className="text-sm font-medium">{contact.full_name}</div>
                                        {contact.email && (
                                          <div className="text-xs text-muted-foreground">{contact.email}</div>
                                        )}
                                        {contact.title && (
                                          <div className="text-xs text-muted-foreground">{contact.title}</div>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteContact(contact.id)}
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !data && (
            <div className="bg-card/50 rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Enter an ingredient name and click Search to find companies.</p>
            </div>
          )}
        </div>
      </section>

      {/* Dialogs */}
      {selectedIngredient && (
        <>
          <AddEditDialog
            open={addEditOpen}
            onOpenChange={setAddEditOpen}
            ingredient={selectedIngredient}
            company={editingCompany}
            onSuccess={handleSaveSuccess}
          />
          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={handleDeleteConfirm}
            target={deleteTarget}
            company={deleteTarget?.companyId ? data?.companies.find(c => c.id === deleteTarget.companyId) : undefined}
          />
        </>
      )}
    </main>
  )
}
