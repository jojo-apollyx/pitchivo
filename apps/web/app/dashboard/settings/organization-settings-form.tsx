'use client'

import { useState, useEffect } from 'react'
import { Building2, Save, Briefcase, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { getAllIndustries, getIndustryByCode } from '@/lib/constants/industries'

const COMPANY_SIZES = [
  { value: '1-5', label: '1-5' },
  { value: '6-20', label: '6-20' },
  { value: '21-100', label: '21-100' },
  { value: '100+', label: '100+' },
]

interface OrganizationSettingsFormProps {
  organization: {
    id: string
    name: string
    domain: string
    industry: string | null
    company_size: string | null
    description: string | null
    pitchivo_domain: string | null
  }
  userRole: string | null
}

export function OrganizationSettingsForm({ organization, userRole }: OrganizationSettingsFormProps) {
  const [companySize, setCompanySize] = useState(organization.company_size || '')
  const [industry, setIndustry] = useState(organization.industry || '')
  const [description, setDescription] = useState(organization.description || '')
  const [role, setRole] = useState(userRole || '')
  const [isSaving, setIsSaving] = useState(false)
  const [industries, setIndustries] = useState<string[]>([])
  const [industryMap, setIndustryMap] = useState<Record<string, string>>({}) // code -> name mapping
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true)

  // Load supported industries from hardcoded constants (industries table was removed)
  useEffect(() => {
    try {
      const allIndustries = getAllIndustries()
      // Show all industries, not just enabled ones, so users can see what's available
      const industryCodes = allIndustries.map((ind) => ind.code)
      const map: Record<string, string> = {}
      allIndustries.forEach((ind) => {
        map[ind.code] = ind.name
      })
      setIndustries(industryCodes)
      setIndustryMap(map)
    } catch (error) {
      console.error('Error loading industries:', error)
      // Fallback to default industries
      const fallbackCodes = ['food_supplement', 'chemicals_raw_materials', 'pharmaceuticals', 'cosmetics_personal_care', 'other']
      const fallbackMap: Record<string, string> = {
        'food_supplement': 'Food Supplements & Ingredients',
        'chemicals_raw_materials': 'Chemicals & Raw Materials',
        'pharmaceuticals': 'Pharmaceuticals',
        'cosmetics_personal_care': 'Cosmetics & Personal Care',
        'other': 'Other',
      }
      setIndustries(fallbackCodes)
      setIndustryMap(fallbackMap)
    } finally {
      setIsLoadingIndustries(false)
    }
  }, [])

  const handleSave = async () => {
    const hasSizeChange = companySize !== (organization.company_size || '')
    const hasIndustryChange = industry !== (organization.industry || '')
    const hasDescriptionChange = description !== (organization.description || '')
    const hasRoleChange = role !== (userRole || '')
    
    if (!hasSizeChange && !hasIndustryChange && !hasDescriptionChange && !hasRoleChange) {
      toast.info('No changes to save')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Update organization fields using API route (more reliable than direct RPC)
      if (hasSizeChange || hasIndustryChange || hasDescriptionChange) {
        const response = await fetch('/api/organizations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_size: companySize || null,
            industry: industry || null,
            description: description || null,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Update failed' }))
          throw new Error(errorData.error || `Failed to update organization: ${response.statusText}`)
        }

        const result = await response.json()
        if (!result.success) {
          throw new Error('Failed to update organization')
        }
      }
      
      // Update user role if changed
      if (hasRoleChange) {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          throw new Error('User not found')
        }
        
        const { error: roleError } = await supabase
          .from('user_profiles')
          .update({ org_role: role || null })
          .eq('id', user.id)

        if (roleError) {
          throw roleError
        }
      }

      const changes = []
      if (hasSizeChange) changes.push('company size')
      if (hasIndustryChange) changes.push('industry')
      if (hasDescriptionChange) changes.push('description')
      if (hasRoleChange) changes.push('role')
      
      toast.success(`${changes.join(' and ').replace(/, ([^,]*)$/, ' and $1')} updated successfully`)
      
      // Refresh the page to show updated values
      window.location.reload()
    } catch (error) {
      console.error('Error updating organization:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update organization. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = companySize !== (organization.company_size || '') || industry !== (organization.industry || '') || description !== (organization.description || '') || role !== (userRole || '')

  return (
    <div className="space-y-6">
      {/* Company Information - Grid Layout */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          Company Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name - Full Width on Mobile, Half on Desktop */}
          <div className="space-y-1.5">
            <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
            <Input 
              id="company-name" 
              defaultValue={organization.name || ''} 
              disabled
              className="h-10 text-sm bg-muted/50"
            />
          </div>

          {/* Email Domain */}
          <div className="space-y-1.5">
            <Label htmlFor="domain" className="text-sm font-medium">Email Domain</Label>
            <Input 
              id="domain" 
              defaultValue={organization.domain || ''} 
              disabled
              className="h-10 text-sm bg-muted/50"
            />
          </div>

          {/* Pitchivo Domain - Only show if exists */}
          {organization.pitchivo_domain && (
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="pitchivo-domain" className="text-sm font-medium">Pitchivo Domain</Label>
              <Input 
                id="pitchivo-domain" 
                defaultValue={organization.pitchivo_domain || ''} 
                disabled
                className="h-10 text-sm bg-muted/50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Business Details - Grid Layout */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Business Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industry */}
          <div className="space-y-1.5">
            <Label htmlFor="industry" className="text-sm font-medium">Industry</Label>
            <Select
              value={industry}
              onValueChange={setIndustry}
            >
              <SelectTrigger id="industry" className="h-10 text-sm">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingIndustries ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  industries.map((industryCode) => (
                    <SelectItem key={industryCode} value={industryCode} className="text-sm">
                      {industryMap[industryCode] || industryCode}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Company Size */}
          <div className="space-y-1.5">
            <Label htmlFor="company-size" className="text-sm font-medium">Company Size</Label>
            <Select
              value={companySize}
              onValueChange={setCompanySize}
            >
              <SelectTrigger id="company-size" className="h-10 text-sm">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value} className="text-sm">
                    {size.label} employees
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description - Full Width */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Company Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your organization, products, and services..."
              rows={3}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This helps buyers understand your business better
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Your Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="role" className="text-sm font-medium">Your Role / Title</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Sales Manager, CEO"
              className="h-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border/20">
        <p className="text-xs text-muted-foreground">
          {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
        </p>
        <Button 
          className="gap-2 h-9 px-4 text-sm" 
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

