'use client'

import { useState, useEffect } from 'react'
import { Building2, Save, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    pitchivo_domain: string | null
  }
  userRole: string | null
}

export function OrganizationSettingsForm({ organization, userRole }: OrganizationSettingsFormProps) {
  const [companySize, setCompanySize] = useState(organization.company_size || '')
  const [industry, setIndustry] = useState(organization.industry || '')
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
    const hasRoleChange = role !== (userRole || '')
    
    if (!hasSizeChange && !hasIndustryChange && !hasRoleChange) {
      toast.info('No changes to save')
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      
      // Update organization fields using API route (more reliable than direct RPC)
      if (hasSizeChange || hasIndustryChange) {
        const response = await fetch('/api/organizations', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_size: companySize || null,
            industry: industry || null,
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

  const hasChanges = companySize !== (organization.company_size || '') || industry !== (organization.industry || '') || role !== (userRole || '')

  return (
    <section className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg sm:text-xl font-semibold">Organization Information</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Basic information about your organization
      </p>
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="company-name">Company Name</Label>
          <Input 
            id="company-name" 
            defaultValue={organization.name || ''} 
            disabled
            className="transition-all duration-300"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="domain">Email Domain</Label>
          <Input 
            id="domain" 
            defaultValue={organization.domain || ''} 
            disabled
            className="transition-all duration-300"
          />
        </div>
        {organization.pitchivo_domain && (
          <div className="grid gap-2">
            <Label htmlFor="pitchivo-domain">Pitchivo Domain</Label>
            <Input 
              id="pitchivo-domain" 
              defaultValue={organization.pitchivo_domain || ''} 
              disabled
              className="transition-all duration-300"
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <Select
            value={industry}
            onValueChange={setIndustry}
          >
            <SelectTrigger id="industry" className="transition-all duration-300">
              <SelectValue placeholder="Select an industry" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingIndustries ? (
                <SelectItem value="loading" disabled>Loading industries...</SelectItem>
              ) : (
                industries.map((industryCode) => (
                  <SelectItem key={industryCode} value={industryCode}>
                    {industryMap[industryCode] || industryCode}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company-size">Company Size</Label>
          <Select
            value={companySize}
            onValueChange={setCompanySize}
          >
            <SelectTrigger id="company-size" className="transition-all duration-300">
              <SelectValue placeholder="Select company size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size.value} value={size.value}>
                  {size.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Your Role / Title
          </Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Sales Manager, Founder, CEO"
            className="transition-all duration-300"
          />
        </div>
        <div className="flex justify-end pt-4">
          <Button 
            className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20" 
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </section>
  )
}

