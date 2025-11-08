'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Building2, Users, Briefcase, Upload, CheckCircle2, X } from 'lucide-react'
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
import { sendOrganizationSetupEmail } from '@/lib/email'

const COMPANY_SIZES = [
  { value: '1-5', label: '1-5' },
  { value: '6-20', label: '6-20' },
  { value: '21-100', label: '21-100' },
  { value: '100+', label: '100+' },
]

const INDUSTRIES = [
  'Food & Supplement Ingredients',
  'Chemicals & Raw Materials',
  'Pharmaceuticals',
  'Cosmetics & Personal Care',
  'Other',
]

const ROLE_SUGGESTIONS = [
  'Founder',
  'CEO',
  'CTO',
  'COO',
  'Sales Manager',
  'Export Manager',
  'Business Development Manager',
  'Marketing Manager',
  'Product Manager',
  'Operations Manager',
  'Account Manager',
  'Sales Representative',
  'Export Lead',
  'Business Owner',
]

export default function OrganizationSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([])
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    industry: 'Food & Supplement Ingredients',
    companySize: '',
    role: '',
    description: '',
  })

  // Get user email and auto-fill domain
  useEffect(() => {
    const loadUserData = async () => {
      const supabase = createClient()
      
      // Wait a bit for session to be established
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // First check session
      let session = null
      let retries = 0
      while (!session && retries < 3) {
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        session = currentSession
        if (!session) {
          await new Promise(resolve => setTimeout(resolve, 500))
          retries++
        }
      }
      
      if (!session) {
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
        })
        router.push('/')
        return
      }
      
      // Get user from session
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        // Clear invalid session
        await supabase.auth.signOut()
        // Show toast and redirect
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
        })
        router.push('/')
        return
      }
      
      if (user?.email) {
        setUserEmail(user.email)
        const domain = user.email.split('@')[1]
        setFormData(prev => ({ ...prev, domain: domain || '' }))
      } else {
        // Clear session and show toast
        await supabase.auth.signOut()
        toast.error('Session expired', {
          description: 'Please sign in again to continue.',
        })
        router.push('/')
      }
    }
    
    loadUserData()
  }, [router])

  // Filter role suggestions based on input
  useEffect(() => {
    if (formData.role.trim()) {
      const filtered = ROLE_SUGGESTIONS.filter(role =>
        role.toLowerCase().includes(formData.role.toLowerCase())
      )
      setRoleSuggestions(filtered)
      setShowRoleSuggestions(filtered.length > 0 && formData.role !== filtered[0])
    } else {
      setRoleSuggestions([])
      setShowRoleSuggestions(false)
    }
  }, [formData.role])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setLogoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.domain || !formData.companySize) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not found')
      }

      // Upload logo if provided
      let logoUrl = null
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `organizations/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('logos')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Logo upload error:', uploadError)
          toast.error('Failed to upload logo. Continuing without logo...')
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath)
          logoUrl = publicUrl
        }
      }

      // Get or create organization
      const { data: orgData, error: orgError } = await supabase.rpc('get_or_create_organization', {
        email: user.email!,
        company_name: formData.companyName,
        industry: formData.industry,
        company_size: formData.companySize,
        description: formData.description || null,
        use_cases: [],
      })

      if (orgError) {
        throw orgError
      }

      // Complete organization setup
      const { error: setupError } = await supabase.rpc('complete_organization_setup', {
        p_org_id: orgData,
        p_industry: formData.industry,
        p_company_size: formData.companySize,
        p_description: formData.description || null,
        p_use_cases: [],
        p_logo_url: logoUrl,
      })

      if (setupError) {
        throw setupError
      }

      // Update user role if provided
      if (formData.role) {
        const { error: roleError } = await supabase
          .from('user_profiles')
          .update({ org_role: formData.role.toLowerCase().includes('sales') ? 'sales' : 
                   formData.role.toLowerCase().includes('marketing') ? 'marketing' : 'user' })
          .eq('id', user.id)

        if (roleError) {
          console.error('Role update error:', roleError)
        }
      }

      // Send organization setup email (non-blocking)
      if (user.email) {
        sendOrganizationSetupEmail({
          to: user.email,
          userName: user.user_metadata?.full_name || user.email.split('@')[0],
          companyName: formData.companyName,
        }).catch((error) => {
          console.error('Failed to send organization setup email:', error)
          // Don't show error to user, email sending is not critical
        })
      }

      toast.success('Organization created successfully!')

      // Redirect to home after a short delay
      setTimeout(() => {
        router.push('/home')
      }, 1000)
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization. Please try again.')
      setIsLoading(false)
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-foreground/70">Setting up your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Pitchivo</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
              Set up your organization
            </h1>
            <p className="text-base sm:text-lg text-foreground/70">
              Let's personalize your workspace for your company.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name *
              </Label>
              <Input
                id="companyName"
                placeholder="e.g., ABC Ingredients Co."
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="text-base"
                required
              />
            </div>

            {/* Company Domain */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-base font-semibold">
                Company Domain *
              </Label>
              <Input
                id="domain"
                value={formData.domain || (userEmail ? userEmail.split('@')[1] : '')}
                readOnly
                disabled
                className="text-base bg-muted cursor-not-allowed"
                placeholder={userEmail ? `Extracting from ${userEmail}...` : 'Loading...'}
              />
              <p className="text-sm text-foreground/60">
                {userEmail 
                  ? `Automatically detected from your email (${userEmail}). Users with the same domain will automatically join your workspace.`
                  : 'Users with the same domain will automatically join your workspace.'}
              </p>
            </div>

            {/* Industry Type */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-base font-semibold">
                Industry Type *
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, industry: value }))
                }}
              >
                <SelectTrigger id="industry" className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Size */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Company Size *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COMPANY_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, companySize: size.value })}
                    className={`
                      min-h-[44px] px-4 py-3 rounded-lg border-2 text-base font-medium
                      transition-all duration-200 touch-manipulation
                      ${
                        formData.companySize === size.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                      }
                    `}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Role / Title */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Your Role / Title
              </Label>
              <div className="relative">
                <Input
                  id="role"
                  placeholder="e.g., Founder, Sales Manager, Export Lead"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  onFocus={() => {
                    if (formData.role.trim()) {
                      setShowRoleSuggestions(true)
                    }
                  }}
                  className="text-base"
                  autoComplete="off"
                />
                {showRoleSuggestions && roleSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {roleSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, role: suggestion }))
                          setShowRoleSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-accent text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Company Description
              </Label>
              <textarea
                id="description"
                placeholder="Briefly describe what your company does (e.g., supplier of botanical extracts)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="
                  w-full px-3 py-2 text-base rounded-xl border border-border
                  bg-background text-foreground placeholder:text-foreground/40
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors touch-manipulation resize-none
                "
              />
            </div>

            {/* Logo Upload (Optional) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Company Logo (Optional)
              </Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-border overflow-hidden bg-background/50 flex items-center justify-center">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Upload className="h-6 w-6 text-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" size="default" className="min-h-[44px] pointer-events-none">
                      Choose Logo
                    </Button>
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                size="lg"
                className="w-full min-h-[52px] text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Create Organization
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

