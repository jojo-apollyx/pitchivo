'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { sendOrganizationSetupEmail } from '@/lib/emails'

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

// Zod schema for form validation
const organizationSetupSchema = z.object({
  companyName: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s&.,'-]+$/, 'Company name contains invalid characters'),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .regex(
      /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
      'Please enter a valid domain name'
    ),
  industry: z.enum(
    [
      'Food & Supplement Ingredients',
      'Chemicals & Raw Materials',
      'Pharmaceuticals',
      'Cosmetics & Personal Care',
      'Other',
    ],
    {
      required_error: 'Please select an industry',
    }
  ),
  companySize: z.enum(['1-5', '6-20', '21-100', '100+'], {
    required_error: 'Please select a company size',
  }),
  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s&.,'-]+$/, 'Role contains invalid characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
})

type OrganizationSetupFormData = z.infer<typeof organizationSetupSchema>

export default function OrganizationSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([])
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrganizationSetupFormData>({
    resolver: zodResolver(organizationSetupSchema),
    defaultValues: {
      companyName: '',
      domain: '',
      industry: 'Food & Supplement Ingredients',
      companySize: undefined,
      role: '',
      description: '',
    },
  })

  const formData = watch()

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
        if (domain) {
          setValue('domain', domain)
        }
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
  }, [router, setValue])

  // Filter role suggestions based on input
  useEffect(() => {
    const role = formData.role || ''
    if (role.trim()) {
      const filtered = ROLE_SUGGESTIONS.filter(r =>
        r.toLowerCase().includes(role.toLowerCase())
      )
      setRoleSuggestions(filtered)
      setShowRoleSuggestions(filtered.length > 0 && role !== filtered[0])
    } else {
      setRoleSuggestions([])
      setShowRoleSuggestions(false)
    }
  }, [formData.role])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setLogoError('Please select a logo file')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setLogoError('Please upload an image file (PNG, JPG, etc.)')
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('Image size must be less than 5MB')
      toast.error('Image size must be less than 5MB')
      return
    }

    setLogoError(null)
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
    setLogoError(null)
  }

  const onSubmit = async (data: OrganizationSetupFormData) => {
    // Validate logo
    if (!logoFile) {
      setLogoError('Please upload a company logo')
      toast.error('Please upload a company logo')
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

      // Upload logo (required)
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `organizations/${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Logo upload error:', uploadError)
        let errorMessage = 'Failed to upload logo. Please try again.'
        
        // Provide more specific error messages
        if (uploadError.message?.includes('new row violates row-level security policy')) {
          errorMessage = 'Upload failed: Permission denied. Please check your account permissions.'
        } else if (uploadError.message?.includes('file size')) {
          errorMessage = 'File is too large. Maximum size is 5MB.'
        } else if (uploadError.message?.includes('mime type') || uploadError.message?.includes('content type')) {
          errorMessage = 'Invalid file type. Please upload an image (PNG, JPG, WebP, or GIF).'
        } else if (uploadError.message) {
          errorMessage = `Upload failed: ${uploadError.message}`
        }
        
        setLogoError(errorMessage)
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)
      const logoUrl = publicUrl

      // Get or create organization
      const { data: orgId, error: orgError } = await supabase.rpc('get_or_create_organization', {
        email: user.email!,
        company_name: data.companyName,
        industry: data.industry,
        company_size: data.companySize,
        description: data.description || null,
        use_cases: [],
      })

      if (orgError) {
        throw orgError
      }

      if (!orgId) {
        throw new Error('Failed to get or create organization')
      }

      // Update organization with all setup details and mark as completed
      // Use RPC function to bypass RLS restrictions
      const completedAt = new Date().toISOString()
      const { data: updateSuccess, error: updateError } = await supabase.rpc('update_user_organization', {
        p_org_id: orgId,
        p_name: data.companyName,
        p_industry: data.industry,
        p_company_size: data.companySize,
        p_description: data.description || null,
        p_use_cases: [],
        p_logo_url: logoUrl,
        p_onboarding_completed_at: completedAt,
      })

      if (updateError) {
        throw updateError
      }

      if (!updateSuccess) {
        throw new Error('Failed to update organization')
      }

      // Update user role
      const { error: roleError } = await supabase
        .from('user_profiles')
        .update({ org_role: data.role.toLowerCase().includes('sales') ? 'sales' : 
                 data.role.toLowerCase().includes('marketing') ? 'marketing' : 'user' })
        .eq('id', user.id)

      if (roleError) {
        console.error('Role update error:', roleError)
      }

      // Send organization setup email (non-blocking)
      if (user.email) {
        sendOrganizationSetupEmail({
          to: user.email,
          userName: user.user_metadata?.full_name || user.email.split('@')[0],
          companyName: data.companyName,
        }).catch((error) => {
          console.error('Failed to send organization setup email:', error)
          // Don't show error to user, email sending is not critical
        })
      }

      toast.success('Organization created successfully!')

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
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
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Pitchivo</span>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-12">
          <div className="max-w-2xl mx-auto">
            {/* Title Section */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 mb-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  Set up your organization
                </h1>
                <p className="text-base sm:text-lg text-foreground/70">
                  Let's personalize your workspace for your company.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Company Name *
              </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., ABC Ingredients Co."
                  {...register('companyName')}
                  className={`text-base transition-all duration-300 ${errors.companyName ? 'border-destructive' : ''}`}
                />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>

            {/* Company Domain */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-base font-semibold">
                Company Domain *
              </Label>
                <Input
                  id="domain"
                  {...register('domain')}
                  readOnly
                  disabled
                  className={`text-base bg-muted cursor-not-allowed transition-all duration-300 ${errors.domain ? 'border-destructive' : ''}`}
                  placeholder={userEmail ? `Extracting from ${userEmail}...` : 'Loading...'}
                />
              {errors.domain && (
                <p className="text-sm text-destructive">{errors.domain.message}</p>
              )}
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
                  setValue('industry', value as OrganizationSetupFormData['industry'], {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger id="industry" className={`text-base transition-all duration-300 ${errors.industry ? 'border-destructive' : ''}`}>
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry.message}</p>
              )}
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
                    onClick={() => {
                      setValue('companySize', size.value as OrganizationSetupFormData['companySize'], {
                        shouldValidate: true,
                      })
                    }}
                    className={`
                      min-h-[44px] px-4 py-3 rounded-lg border-2 text-base font-medium
                      transition-all duration-300 touch-manipulation hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20
                      ${
                        formData.companySize === size.value
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : errors.companySize
                          ? 'border-destructive hover:border-destructive/50'
                          : 'bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5'
                      }
                    `}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              {errors.companySize && (
                <p className="text-sm text-destructive">{errors.companySize.message}</p>
              )}
            </div>

            {/* Role / Title */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-base font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Your Role / Title *
              </Label>
              <div className="relative">
                <Input
                  id="role"
                  placeholder="e.g., Founder, Sales Manager, Export Lead"
                  {...register('role')}
                  onFocus={() => {
                    if (formData.role?.trim()) {
                      setShowRoleSuggestions(true)
                    }
                  }}
                  className={`text-base transition-all duration-300 ${errors.role ? 'border-destructive' : ''}`}
                  autoComplete="off"
                />
                {showRoleSuggestions && roleSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-auto">
                    {roleSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => {
                          setValue('role', suggestion, { shouldValidate: true })
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
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            {/* Company Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Company Description *
              </Label>
              <textarea
                id="description"
                placeholder="Briefly describe what your company does (e.g., supplier of botanical extracts)"
                {...register('description')}
                rows={4}
                className={`
                  w-full px-3 py-2 text-base rounded-xl border
                  bg-background text-foreground placeholder:text-foreground/40
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-all duration-300 touch-manipulation resize-none
                  ${errors.description ? 'border-destructive' : 'border-border'}
                `}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Logo Upload (Required) */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Company Logo *
              </Label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-24 h-24 rounded-lg border-2 border-dashed overflow-hidden bg-background/50 flex items-center justify-center cursor-pointer transition-colors ${
                    logoError ? 'border-destructive' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleRemoveLogo()
                        }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors z-10"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <Upload className="h-6 w-6 text-foreground/40" />
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    className="min-h-[44px] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Logo
                  </Button>
                  <p className="text-xs text-foreground/60 mt-1">PNG, JPG up to 5MB</p>
                  {logoError && (
                    <p className="text-sm text-destructive mt-1">{logoError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full min-h-[52px] text-base font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl hover:shadow-primary-light/20"
                >
                  Create Organization
                  <CheckCircle2 className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

