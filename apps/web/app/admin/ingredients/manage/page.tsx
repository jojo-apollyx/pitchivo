'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, Building2, Users, Trash2, Edit, X, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { LoadingIllustration } from '@/components/ui/loading-illustration'
import { toast } from 'sonner'
import { AddEditDialog } from './components/AddEditDialog'
import { DeleteConfirmationDialog } from './components/DeleteConfirmationDialog'
import { cn } from '@/lib/utils'

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

const INTERACTION_TYPES = [
  'purchased',
  'requested_quote',
  'viewed_item',
  'added_to_cart',
  'imported',
  'used_in_production',
  'distributed',
  'mentioned_in_article',
  'partnership_announced',
  'sold',
  'supplied',
  'manufactured',
  'exported'
]

export default function IngredientsManagePage() {
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [ingredientSuggestions, setIngredientSuggestions] = useState<any[]>([])
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [data, setData] = useState<ManageData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addEditOpen, setAddEditOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'signal' | 'all'; signalId?: string; companyId?: string } | null>(null)
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set())

  // Search for ingredients
  useEffect(() => {
    if (ingredientSearch.length < 2) {
      setIngredientSuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/admin/leads/autocomplete-product?q=${encodeURIComponent(ingredientSearch)}&limit=10`)
        const result = await response.json()
        if (result.success) {
          setIngredientSuggestions(result.suggestions || [])
        }
      } catch (err) {
        console.error('Error searching ingredients:', err)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [ingredientSearch])

  // Load data when ingredient is selected
  useEffect(() => {
    if (!selectedIngredient) {
      setData(null)
      return
    }

    loadData()
  }, [selectedIngredient])

  async function loadData() {
    if (!selectedIngredient) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/ingredients/manage?ingredientId=${selectedIngredient.id}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load data')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  function handleIngredientSelect(ingredient: any) {
    setSelectedIngredient({
      id: ingredient.id,
      name: ingredient.name,
      category: ingredient.category,
      aliases: ingredient.aliases
    })
    setIngredientSearch(ingredient.name)
    setIngredientSuggestions([])
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

  async function handleDeleteConfirm() {
    if (!deleteTarget || !selectedIngredient) return

    try {
      if (deleteTarget.type === 'signal' && deleteTarget.signalId) {
        const response = await fetch(`/api/admin/ingredients/signals/${deleteTarget.signalId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Failed to delete signal')
        }

        toast.success('Signal deleted')
      } else if (deleteTarget.type === 'all' && deleteTarget.companyId) {
        const response = await fetch(
          `/api/admin/ingredients/company-signals?orgId=${deleteTarget.companyId}&itemId=${selectedIngredient.id}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          throw new Error('Failed to delete signals')
        }

        toast.success('All signals deleted')
      }

      setDeleteDialogOpen(false)
      setDeleteTarget(null)
      await loadData()
    } catch (err) {
      console.error('Error deleting:', err)
      toast.error('Failed to delete')
    }
  }

  function handleSaveSuccess() {
    setAddEditOpen(false)
    setEditingCompany(null)
    loadData()
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
          {/* Ingredient Search */}
          <div className="mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search for an ingredient..."
                  value={ingredientSearch}
                  onChange={(e) => setIngredientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && ingredientSuggestions.length > 0) {
                      handleIngredientSelect(ingredientSuggestions[0])
                    }
                  }}
                  className="pl-10"
                />
                {ingredientSuggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {ingredientSuggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleIngredientSelect(item)}
                        className="w-full text-left px-4 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="font-medium">{item.name}</div>
                        {item.category && (
                          <div className="text-xs text-muted-foreground">{item.category}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={() => {
                  if (ingredientSuggestions.length > 0) {
                    handleIngredientSelect(ingredientSuggestions[0])
                  } else if (ingredientSearch.trim().length >= 2) {
                    // Trigger search if no suggestions but has text
                    setIngredientSearch(ingredientSearch)
                  }
                }}
                disabled={ingredientSearch.trim().length < 2}
                className="gap-2"
              >
                <Search className="h-4 w-4" />
                Search
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
                  onClick={() => {
                    setSelectedIngredient(null)
                    setIngredientSearch('')
                    setData(null)
                  }}
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
              <LoadingIllustration size="lg" message="Loading companies and contacts..." />
            </div>
          )}

          {/* Error State */}
          {error && (
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
                                {company.domain && (
                                  <span>{company.domain}</span>
                                )}
                                {company.location && (
                                  <span>{company.location}</span>
                                )}
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
                              {company.signals.length > 0 && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteAllSignals(company)}
                                  className="gap-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Delete All ({company.signals.length})
                                </Button>
                              )}
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
                                    <span className="text-sm text-muted-foreground">
                                      {signal.event_date}
                                    </span>
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
          {!loading && !error && !selectedIngredient && (
            <div className="bg-card/50 rounded-xl p-12 text-center">
              <p className="text-muted-foreground">Search and select an ingredient to get started.</p>
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

