'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  category?: string
  aliases?: string[]
}

interface Company {
  id: string
  name: string
  domain?: string
  location?: string
  country?: string
  signals: any[]
  contacts: any[]
}

interface AddEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: Ingredient
  company?: Company | null
  onSuccess: () => void
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

export function AddEditDialog({
  open,
  onOpenChange,
  ingredient,
  company,
  onSuccess
}: AddEditDialogProps) {
  const [companySearch, setCompanySearch] = useState('')
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([])
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')
  const [companyCountry, setCompanyCountry] = useState('')
  const [companyCity, setCompanyCity] = useState('')
  const [companyState, setCompanyState] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactTitle, setContactTitle] = useState('')
  const [interactionType, setInteractionType] = useState('purchased')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])

  // Initialize form when company is provided (edit mode)
  useEffect(() => {
    if (company) {
      setCompanyName(company.name)
      setCompanyDomain(company.domain || '')
      setCompanyCountry(company.country || '')
      // Parse location if available
      if (company.location) {
        const parts = company.location.split(',')
        if (parts.length > 0) setCompanyCity(parts[0].trim())
        if (parts.length > 1) setCompanyState(parts[1].trim())
      }
      setSelectedCompany({ id: company.id, name: company.name, domain: company.domain })
      setCompanySearch(company.name)
    } else {
      // Reset form for new company
      setCompanyName('')
      setCompanyDomain('')
      setCompanyCountry('')
      setCompanyCity('')
      setCompanyState('')
      setContactFirstName('')
      setContactLastName('')
      setContactEmail('')
      setContactTitle('')
      setInteractionType('purchased')
      setEventDate(new Date().toISOString().split('T')[0])
      setSelectedCompany(null)
      setCompanySearch('')
    }
  }, [company, open])

  // Search for companies
  useEffect(() => {
    if (companySearch.length < 2) {
      setCompanySuggestions([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true)
      try {
        const response = await fetch(`/api/admin/ingredients/search-companies?q=${encodeURIComponent(companySearch)}&limit=10`)
        const result = await response.json()
        if (result.companies) {
          setCompanySuggestions(result.companies)
        }
      } catch (err) {
        console.error('Error searching companies:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [companySearch])

  function handleCompanySelect(suggestion: any) {
    setSelectedCompany(suggestion)
    setCompanyName(suggestion.name)
    setCompanyDomain(suggestion.domain || '')
    setCompanyCountry(suggestion.location_country || '')
    setCompanyCity(suggestion.location_city || '')
    setCompanyState(suggestion.location_state || '')
    setCompanySearch(suggestion.name)
    setCompanySuggestions([])
  }

  async function handleSubmit() {
    if (!companyName || !interactionType) {
      toast.error('Company name and interaction type are required')
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/admin/ingredients/upsert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ingredientId: ingredient.id,
          companyId: selectedCompany?.id,
          companyName,
          companyDomain,
          companyCountry,
          companyCity,
          companyState,
          contactFirstName: contactFirstName || undefined,
          contactLastName: contactLastName || undefined,
          contactEmail: contactEmail || undefined,
          contactTitle: contactTitle || undefined,
          interactionType,
          eventDate: eventDate || undefined
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      toast.success(company ? 'Updated successfully' : 'Added successfully')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {company ? 'Edit Company & Signal' : 'Add Company & Signal'}
          </DialogTitle>
          <DialogDescription>
            {company ? 'Update company information and add a new signal' : 'Add a new company, contact, and signal for this ingredient'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Ingredient (read-only) */}
          <div>
            <Label>Ingredient</Label>
            <Input value={ingredient.name} disabled className="mt-1" />
          </div>

          {/* Company Search/Select */}
          <div>
            <Label>Company</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search existing company or enter new name"
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value)
                  if (!e.target.value) {
                    setSelectedCompany(null)
                  }
                }}
                className="pl-10"
              />
              {companySuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {companySuggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleCompanySelect(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-accent/50 transition-colors"
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      {suggestion.domain && (
                        <div className="text-xs text-muted-foreground">{suggestion.domain}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedCompany && (
              <p className="text-xs text-muted-foreground mt-1">
                Using existing company: {selectedCompany.name}
              </p>
            )}
          </div>

          {/* Company Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="companyDomain">Domain</Label>
              <Input
                id="companyDomain"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                className="mt-1"
                placeholder="example.com"
              />
            </div>
            <div>
              <Label htmlFor="companyCountry">Country</Label>
              <Input
                id="companyCountry"
                value={companyCountry}
                onChange={(e) => setCompanyCountry(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="companyCity">City</Label>
              <Input
                id="companyCity"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Contact Information (Optional) */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4">Contact Information (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactFirstName">First Name</Label>
                <Input
                  id="contactFirstName"
                  value={contactFirstName}
                  onChange={(e) => setContactFirstName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactLastName">Last Name</Label>
                <Input
                  id="contactLastName"
                  value={contactLastName}
                  onChange={(e) => setContactLastName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactTitle">Title</Label>
                <Input
                  id="contactTitle"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Signal Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4">Signal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interactionType">Interaction Type *</Label>
                <Select value={interactionType} onValueChange={setInteractionType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {company ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

