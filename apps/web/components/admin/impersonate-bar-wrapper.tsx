'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImpersonateBar } from './impersonate-bar'

export function ImpersonateBarWrapper() {
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [impersonateOrg, setImpersonateOrg] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const impersonateOrgId = searchParams.get('impersonate')
    
    if (impersonateOrgId) {
      loadOrganization(impersonateOrgId)
    } else {
      setImpersonateOrg(null)
      setLoading(false)
    }
  }, [searchParams])

  const loadOrganization = async (orgId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', orgId)
        .single()

      if (error) throw error

      if (data) {
        setImpersonateOrg({ id: data.id, name: data.name })
      } else {
        setImpersonateOrg(null)
      }
    } catch (error) {
      console.error('Error loading organization:', error)
      setImpersonateOrg(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !impersonateOrg) {
    return null
  }

  return (
    <ImpersonateBar 
      organizationName={impersonateOrg.name} 
      organizationId={impersonateOrg.id}
    />
  )
}

