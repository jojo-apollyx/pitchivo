'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sparkles, Building2, Users, Briefcase, Upload, CheckCircle2, X, AlertTriangle } from 'lucide-react'
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
import { SetupCompletionAnimation } from '@/components/setup/setup-completion-animation'

const COMPANY_SIZES = [
  { value: '1-5', label: '1-5' },
  { value: '6-20', label: '6-20' },
  { value: '21-100', label: '21-100' },
  { value: '100+', label: '100+' },
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

// Zod schema for form validation - will be made conditional based on isSubsequentUser
const createOrganizationSetupSchema = (isSubsequentUser: boolean, industries: string[]) => z.object({
  companyName: isSubsequentUser 
    ? z.string().optional()
    : z
        .string()
        .min(2, 'Company name must be at least 2 characters')
        .max(100, 'Company name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9\s&.,'-]+$/, 'Company name contains invalid characters'),
  domain: isSubsequentUser
    ? z.string().optional()
    : z
        .string()
        .min(1, 'Domain is required')
        .regex(
          /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
          'Please enter a valid domain name'
        ),
  industry: industries.length > 0 
    ? z.enum(industries as [string, ...string[]], {
        required_error: 'Please select an industry',
      })
    : z.string().min(1, 'Please select an industry'),
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

type OrganizationSetupFormData = z.infer<ReturnType<typeof createOrganizationSetupSchema>>

export default function OrganizationSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false)
  const [pitchivoDomain, setPitchivoDomain] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([])
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false)
  const [isSubsequentUser, setIsSubsequentUser] = useState(false)
  const [existingOrgId, setExistingOrgId] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [industries, setIndustries] = useState<string[]>([])
  const [industryMap, setIndustryMap] = useState<Record<string, string>>({}) // code -> name mapping
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Memoize schema to update when isSubsequentUser or industries change
  const schema = useMemo(() => createOrganizationSetupSchema(isSubsequentUser, industries), [isSubsequentUser, industries])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrganizationSetupFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      domain: '',
      industry: '' as any,
      companySize: undefined,
      role: '',
      description: '',
    },
  })

  const formData = watch()

  // Update default industry value when industries are loaded
  useEffect(() => {
    if (industries.length > 0 && !formData.industry) {
      setValue('industry', industries[0] as OrganizationSetupFormData['industry'])
    }
  }, [industries, setValue, formData.industry])

  // Load supported industries from database
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('industries')
          .select('industry_code, industry_name')
          .eq('is_enabled', true)
          .order('industry_name', { ascending: true })

        if (error) {
          console.error('Error loading industries:', error)
          // Fallback to default industries if database query fails
          const fallbackCodes = [
            'supplements_food_ingredients',
            'chemicals_raw_materials',
            'pharmaceuticals',
            'cosmetics_personal_care',
            'other',
          ]
          const fallbackMap: Record<string, string> = {
            'supplements_food_ingredients': 'Nutritional Supplements / Food Ingredients',
            'chemicals_raw_materials': 'Chemicals & Raw Materials',
            'pharmaceuticals': 'Pharmaceuticals',
            'cosmetics_personal_care': 'Cosmetics & Personal Care',
            'other': 'Other',
          }
          setIndustries(fallbackCodes)
          setIndustryMap(fallbackMap)
        } else {
          const industryCodes = data?.map((item) => item.industry_code) || []
          const map: Record<string, string> = {}
          data?.forEach((item) => {
            map[item.industry_code] = item.industry_name
          })
          if (industryCodes.length > 0) {
            setIndustries(industryCodes)
            setIndustryMap(map)
          } else {
            // Fallback
            const fallbackCodes = [
              'supplements_food_ingredients',
              'chemicals_raw_materials',
              'pharmaceuticals',
              'cosmetics_personal_care',
              'other',
            ]
            const fallbackMap: Record<string, string> = {
              'supplements_food_ingredients': 'Nutritional Supplements / Food Ingredients',
              'chemicals_raw_materials': 'Chemicals & Raw Materials',
              'pharmaceuticals': 'Pharmaceuticals',
              'cosmetics_personal_care': 'Cosmetics & Personal Care',
              'other': 'Other',
            }
            setIndustries(fallbackCodes)
            setIndustryMap(fallbackMap)
          }
        }
      } catch (error) {
        console.error('Error loading industries:', error)
        // Fallback to default industries
        const fallbackCodes = [
          'supplements_food_ingredients',
          'chemicals_raw_materials',
          'pharmaceuticals',
          'cosmetics_personal_care',
          'other',
        ]
        const fallbackMap: Record<string, string> = {
          'supplements_food_ingredients': 'Nutritional Supplements / Food Ingredients',
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
    }

    loadIndustries()
  }, [])

  // Get user email and auto-fill domain, and load existing organization data
  useEffect(() => {
    const loadUserData = async () => {
      try {
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

          // Check if organization exists for this domain and if onboarding is completed
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('organization_id, metadata, org_role')
            .eq('id', user.id)
            .single()

          // Check if organization exists for this domain
          const { data: orgByDomain } = await supabase
            .from('organizations')
            .select('id, name, industry, company_size, description, logo_url, onboarding_completed_at')
            .eq('domain', domain)
            .single()

          if (orgByDomain) {
            setExistingOrgId(orgByDomain.id)
            
            // If onboarding is already completed, this is a subsequent user
            if (orgByDomain.onboarding_completed_at) {
              setIsSubsequentUser(true)
              
              // Populate form with existing data (for subsequent users)
              if (orgByDomain.industry && industries.includes(orgByDomain.industry)) {
                setValue('industry', orgByDomain.industry as OrganizationSetupFormData['industry'])
              } else if (industries.length > 0) {
                setValue('industry', industries[0] as OrganizationSetupFormData['industry'])
              }
              if (orgByDomain.company_size) {
                setValue('companySize', orgByDomain.company_size as OrganizationSetupFormData['companySize'])
              }
              if (orgByDomain.description) {
                setValue('description', orgByDomain.description)
              }
              if (orgByDomain.logo_url) {
                setLogoPreview(orgByDomain.logo_url)
              }
              
              // Load user's role from org_role if exists
              if (profile?.org_role) {
                setValue('role', profile.org_role)
              }
            } else if (profile?.organization_id && !orgByDomain.onboarding_completed_at) {
              // Organization exists but onboarding not completed - populate all fields (first user continuing setup)
              const { data: organization } = await supabase
                .from('organizations')
                .select('name, industry, company_size, description, logo_url')
                .eq('id', profile.organization_id)
                .single()

              if (organization) {
                if (organization.name) {
                  setValue('companyName', organization.name)
                }
                if (organization.industry && industries.includes(organization.industry)) {
                  setValue('industry', organization.industry as OrganizationSetupFormData['industry'])
                } else if (industries.length > 0) {
                  setValue('industry', industries[0] as OrganizationSetupFormData['industry'])
                }
                if (organization.company_size) {
                  setValue('companySize', organization.company_size as OrganizationSetupFormData['companySize'])
                }
                if (organization.description) {
                  setValue('description', organization.description)
                }
                if (organization.logo_url) {
                  setLogoPreview(organization.logo_url)
                }
              }
            }
          }
        } else {
          // Clear session and show toast
          await supabase.auth.signOut()
          toast.error('Session expired', {
            description: 'Please sign in again to continue.',
          })
          router.push('/')
        }
      } finally {
        setIsInitializing(false)
      }
    }

    loadUserData()
  }, [router, setValue, industries])

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
    // For subsequent users, logo is optional
    if (!isSubsequentUser && !logoFile && !logoPreview) {
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

      let logoUrl: string | null = null

      // Upload logo only if a new file was selected
      if (logoFile) {
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
        logoUrl = publicUrl
      } else if (logoPreview) {
        // Use existing logo URL if no new file was uploaded
        logoUrl = logoPreview
      }

      let orgId: string

      if (isSubsequentUser && existingOrgId) {
        // For subsequent users, just update the existing organization
        orgId = existingOrgId
        
        // Ensure company name is not being updated (safeguard)
        // Subsequent users cannot change company name
        if (data.companyName) {
          console.warn('Subsequent user attempted to update company name - ignoring')
        }
        
        // Update organization (don't mark onboarding as completed, don't update name)
        const { data: updateSuccess, error: updateError } = await supabase.rpc('update_user_organization', {
          p_org_id: orgId,
          p_industry: data.industry,
          p_company_size: data.companySize,
          p_description: data.description || null,
          p_use_cases: [],
          p_logo_url: logoUrl || null, // Only update if new logo uploaded
          // Explicitly don't pass p_name to prevent any updates
        })

        if (updateError) {
          throw updateError
        }

        if (!updateSuccess) {
          throw new Error('Failed to update organization')
        }
      } else {
        // For first user, get or create organization
        // Ensure companyName is provided for first user
        if (!data.companyName) {
          toast.error('Company name is required')
          setIsLoading(false)
          return
        }
        
        const { data: createdOrgId, error: orgError } = await supabase.rpc('get_or_create_organization', {
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

        if (!createdOrgId) {
          throw new Error('Failed to get or create organization')
        }

        orgId = createdOrgId

        // Update organization with all setup details and mark as completed
        const completedAt = new Date().toISOString()
        const { data: updateSuccess, error: updateError } = await supabase.rpc('update_user_organization', {
          p_org_id: orgId,
          p_name: data.companyName || null,
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

        // Fetch the updated organization to get pitchivo_domain (only for first user)
        const { data: updatedOrg } = await supabase
          .from('organizations')
          .select('pitchivo_domain')
          .eq('id', orgId)
          .single()

        if (updatedOrg?.pitchivo_domain) {
          setPitchivoDomain(updatedOrg.pitchivo_domain)
        }
      }

      // Save actual role title to org_role (used for admin display)
      const { error: roleError } = await supabase
        .from('user_profiles')
        .update({ 
          org_role: data.role // Save actual role title (e.g., "Sales Manager", "Founder")
        })
        .eq('id', user.id)

      if (roleError) {
        console.error('Role update error:', roleError)
      }

      // Send organization setup email (non-blocking) - only for first user
      if (!isSubsequentUser && user.email && data.companyName) {
        sendOrganizationSetupEmail({
          to: user.email,
          userName: user.user_metadata?.full_name || user.email.split('@')[0],
          companyName: data.companyName,
        }).catch((error) => {
          console.error('Failed to send organization setup email:', error)
          // Don't show error to user, email sending is not critical
        })
      }

      // For subsequent users, redirect directly to dashboard
      if (isSubsequentUser) {
        toast.success('Profile updated successfully!')
        router.push('/dashboard')
        return
      }

      // Show completion animation for first user
      setIsLoading(false)
      setShowCompletionAnimation(true)
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Failed to create organization. Please try again.')
      setIsLoading(false)
    }
  }

  const handleAnimationComplete = () => {
    router.push('/dashboard')
  }

  if (showCompletionAnimation) {
    return (
      <SetupCompletionAnimation
        onComplete={handleAnimationComplete}
        pitchivoDomain={pitchivoDomain}
      />
    )
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-foreground/70">Loading...</p>
        </div>
      </div>
    )
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
                  {isSubsequentUser ? 'Complete your profile' : 'Set up your organization'}
                </h1>
                <p className="text-base sm:text-lg text-foreground/70">
                  {isSubsequentUser 
                    ? 'Update your profile information to get started.'
                    : "Let's personalize your workspace for your company."}
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
            {/* Company Name - Only show for first user */}
            {!isSubsequentUser && (
              <>
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
                  {/* Warning about company name being non-editable */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm">
                    <AlertTriangle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                    <p className="text-foreground/80">
                      <span className="font-semibold text-foreground">Important:</span> Company name cannot be changed after setup. Please pay attention to capitalization and spelling.
                    </p>
                  </div>
                </div>

                {/* Company Domain - Only show for first user */}
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
              </>
            )}

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

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">
                Company Logo {isSubsequentUser || logoPreview ? '' : '*'}
              </Label>
              {logoPreview && (
                <p className="text-sm text-foreground/60">
                  Logo already uploaded. Upload a new one to replace it.
                </p>
              )}
              {isSubsequentUser && (
                <p className="text-sm text-foreground/60">
                  Optional: Upload a new logo to update the company logo.
                </p>
              )}
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
                  {isSubsequentUser ? 'Update Profile' : 'Create Organization'}
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

