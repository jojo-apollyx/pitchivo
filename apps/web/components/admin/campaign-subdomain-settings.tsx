'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { CheckCircle2, Info, Mail, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface CampaignSubdomainSettingsProps {
  campaignId: string
}

const AVAILABLE_SUBDOMAINS = [
  { value: 'news', label: 'news@', description: 'News and updates' },
  { value: 'updates', label: 'updates@', description: 'Product updates' },
  { value: 'info', label: 'info@', description: 'General information' },
  { value: 'alerts', label: 'alerts@', description: 'Important alerts' }
]

export function CampaignSubdomainSettings({ campaignId }: CampaignSubdomainSettingsProps) {
  const [senderSubdomains, setSenderSubdomains] = useState<string[]>(['news', 'updates', 'info', 'alerts'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [orgDomain, setOrgDomain] = useState('yourcompany.pitchivo.com')
  const supabase = createClient()

  useEffect(() => {
    loadCampaignSettings()
  }, [campaignId])

  async function loadCampaignSettings() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('sender_subdomains, organizations(domain)')
        .eq('campaign_id', campaignId)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        // Use organization domain if available
        if (data.organizations && typeof data.organizations === 'object' && 'domain' in data.organizations) {
          const orgDomain = (data.organizations as { domain: string }).domain
          if (orgDomain) {
            setOrgDomain(orgDomain)
          }
        }
        
        if (data.sender_subdomains && Array.isArray(data.sender_subdomains)) {
          setSenderSubdomains(data.sender_subdomains)
        }
      }
    } catch (error) {
      console.error('Error loading campaign settings:', error)
      toast.error('Failed to load campaign settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (senderSubdomains.length === 0) {
      toast.error('Please select at least one subdomain')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ 
          sender_subdomains: senderSubdomains,
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaignId)

      if (error) throw error
      
      toast.success('Subdomain settings saved successfully!')
    } catch (error) {
      console.error('Error saving subdomain settings:', error)
      toast.error('Failed to save subdomain settings')
    } finally {
      setSaving(false)
    }
  }

  function toggleSubdomain(value: string) {
    if (senderSubdomains.includes(value)) {
      // Don't allow deselecting if it's the only one selected
      if (senderSubdomains.length > 1) {
        setSenderSubdomains(senderSubdomains.filter(s => s !== value))
      } else {
        toast.warning('At least one subdomain must be selected')
      }
    } else {
      setSenderSubdomains([...senderSubdomains, value])
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Email Sending Subdomains</h3>
        <p className="text-sm text-muted-foreground">
          Configure which Pitchivo subdomains to use for sending campaign emails. 
          Emails will be distributed evenly across selected subdomains.
        </p>
      </div>

      {/* Current Selection Summary */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/20">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-sm mb-2">Currently Selected</div>
            <div className="flex flex-wrap gap-2">
              {senderSubdomains.map(subdomain => (
                <Badge key={subdomain} variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {subdomain}@{orgDomain}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {senderSubdomains.length} subdomain{senderSubdomains.length !== 1 ? 's' : ''} active
            </div>
          </div>
        </div>
      </div>

      {/* Subdomain Selection */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          Available Subdomains
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_SUBDOMAINS.map((subdomain) => {
            const isSelected = senderSubdomains.includes(subdomain.value)
            return (
              <button
                key={subdomain.value}
                type="button"
                onClick={() => toggleSubdomain(subdomain.value)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "flex items-center justify-center w-5 h-5 rounded border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border"
                )}>
                  {isSelected && (
                    <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">
                    {subdomain.label}<span className="text-muted-foreground">{orgDomain}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {subdomain.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-900 dark:text-blue-100">
            <strong>How it works:</strong>
            <ul className="mt-2 space-y-1 text-blue-700 dark:text-blue-200">
              <li>• Emails are automatically distributed evenly across selected subdomains</li>
              <li>• Using multiple subdomains improves deliverability and reduces spam flags</li>
              <li>• Changes take effect immediately for new scheduled emails</li>
              <li>• Already sent emails are not affected</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-border/30">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

