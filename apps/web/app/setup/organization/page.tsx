'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Building2, Users, Briefcase, Upload, CheckCircle2 } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

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

const USE_CASES = [
  { id: 'promote', label: 'Promote products' },
  { id: 'buyers', label: 'Find buyers' },
  { id: 'team', label: 'Manage team' },
  { id: 'analytics', label: 'Track analytics' },
]

export default function OrganizationSetup() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    domain: '',
    industry: 'Food & Supplement Ingredients',
    companySize: '',
    role: '',
    description: '',
    useCases: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.companyName || !formData.domain || !formData.companySize) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      // TODO: Call API to create/update organization
      await new Promise((resolve) => setTimeout(resolve, 2000))

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

  const handleUseCaseToggle = (caseId: string) => {
    setFormData((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(caseId)
        ? prev.useCases.filter((id) => id !== caseId)
        : [...prev.useCases, caseId],
    }))
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
                placeholder="e.g., abcingredients.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="text-base"
                required
              />
              <p className="text-sm text-foreground/60">
                Users with the same domain will join your workspace automatically.
              </p>
            </div>

            {/* Industry Type */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-base font-semibold">
                Industry Type *
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
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
              <Input
                id="role"
                placeholder="e.g., Founder, Sales Manager, Export Lead"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="text-base"
              />
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
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-background/50">
                  <Upload className="h-6 w-6 text-foreground/40" />
                </div>
                <Button type="button" variant="outline" size="default" className="min-h-[44px]">
                  Upload Logo
                </Button>
              </div>
            </div>

            {/* Primary Use Case */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                What will you use Pitchivo for? (Select all that apply)
              </Label>
              <div className="space-y-3">
                {USE_CASES.map((useCase) => (
                  <div
                    key={useCase.id}
                    className="flex items-center space-x-3 min-h-[44px] px-4 py-3 rounded-lg border border-border hover:bg-accent/50 transition-colors touch-manipulation"
                    onClick={() => handleUseCaseToggle(useCase.id)}
                  >
                    <Checkbox
                      id={useCase.id}
                      checked={formData.useCases.includes(useCase.id)}
                      onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                      className="h-5 w-5"
                    />
                    <label
                      htmlFor={useCase.id}
                      className="text-base font-medium cursor-pointer flex-1"
                    >
                      {useCase.label}
                    </label>
                  </div>
                ))}
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

