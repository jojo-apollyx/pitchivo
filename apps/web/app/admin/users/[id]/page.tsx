'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Mail, Users, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface OrganizationDetails {
  id: string
  name: string
  domain: string
  slug: string
  logo_url?: string
  industry?: string
  company_size?: string
  description?: string
  use_cases?: string[]
  primary_color: string
  secondary_color: string
  accent_color: string
  onboarding_completed_at?: string
  created_at: string
  updated_at: string
}

interface Member {
  id: string
  email: string
  full_name?: string
  org_role?: 'marketing' | 'sales' | 'user'
  is_pitchivo_admin: boolean
  created_at: string
}

export default function OrganizationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const { id } = use(params)
  const [organization, setOrganization] = useState<OrganizationDetails | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrganizationDetails()
  }, [id])

  const loadOrganizationDetails = async () => {
    try {
      setLoading(true)
      
      // Load organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError) throw orgError

      setOrganization(orgData)

      // Load organization members
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, org_role, is_pitchivo_admin, created_at')
        .eq('organization_id', id)
        .order('created_at', { ascending: false })

      if (membersError) throw membersError

      setMembers(membersData || [])
    } catch (error) {
      console.error('Error loading organization details:', error)
      toast.error('Failed to load organization details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 flex items-center justify-center">
        <div className="text-center bg-card/50 backdrop-blur-sm rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
          <h2 className="text-xl font-semibold text-foreground mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-4">The organization you're looking for doesn't exist.</p>
          <Button
            onClick={() => router.push('/admin/users')}
            className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
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
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/users')}
                className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-primary-light/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">{organization.name}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Organization details and members
            </p>
          </div>
        </section>

        {/* Organization Details */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid gap-6 max-w-6xl">
            {/* Basic Information */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">Basic Information</h2>
              </div>
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                    <p className="text-base mt-1">{organization.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Domain</label>
                    <p className="text-base mt-1">{organization.domain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Slug</label>
                    <p className="text-base mt-1">{organization.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Industry</label>
                    <p className="text-base mt-1">{organization.industry || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Company Size</label>
                    <p className="text-base mt-1">{organization.company_size || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Members</label>
                    <p className="text-base mt-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {members.length}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-base mt-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(organization.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Onboarding Status</label>
                    <p className="text-base mt-1">
                      {organization.onboarding_completed_at ? (
                        <Badge variant="success" className="text-xs">Completed</Badge>
                      ) : (
                        <Badge variant="warning" className="text-xs">Pending</Badge>
                      )}
                    </p>
                  </div>
                </div>
                {organization.description && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <p className="text-base mt-1">{organization.description}</p>
                  </div>
                )}
                {organization.use_cases && organization.use_cases.length > 0 && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">Use Cases</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {organization.use_cases.map((useCase, index) => (
                        <Badge key={index} variant="info" className="text-xs">
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Theme Colors */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Theme Colors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Primary Color</label>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-10 h-10 rounded-md border border-border transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20"
                      style={{ backgroundColor: organization.primary_color }}
                    />
                    <span className="text-sm font-mono">{organization.primary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Secondary Color</label>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-10 h-10 rounded-md border border-border transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20"
                      style={{ backgroundColor: organization.secondary_color }}
                    />
                    <span className="text-sm font-mono">{organization.secondary_color}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Accent Color</label>
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="w-10 h-10 rounded-md border border-border transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary-light/20"
                      style={{ backgroundColor: organization.accent_color }}
                    />
                    <span className="text-sm font-mono">{organization.accent_color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Members */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 sm:p-8 transition-all duration-300 hover:shadow-lg hover:shadow-primary-light/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20 hover:shadow-lg hover:shadow-primary-light/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">Organization Members</h2>
              </div>
              <div className="overflow-x-auto">
                <div className="divide-y divide-border/30">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="py-4 hover:bg-primary/5 transition-all duration-300 group"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium group-hover:text-primary transition-colors duration-300">{member.email}</span>
                          </div>
                          <div>{member.full_name || '-'}</div>
                          <div>
                            {member.org_role ? (
                              <Badge variant="info" className="text-xs">
                                {member.org_role}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                          <div>
                            {member.is_pitchivo_admin ? (
                              <Badge variant="warning" className="text-xs">
                                Admin
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No members found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

