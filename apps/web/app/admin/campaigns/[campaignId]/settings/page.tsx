'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Mail, Send, Sparkles, FileText, Zap, CalendarDays, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { EmailQualityChecker } from '@/components/admin/email-quality-checker'
import { EmailTemplateManager } from '@/components/admin/email-template-manager'
import { BatchEmailScheduler } from '@/components/admin/batch-email-scheduler'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
  organizations?: {
    name: string
  }
  products?: {
    product_name: string
    product_id: string
  }
}

interface EmailTemplate {
  template_id: string
  template_name: string
  subject: string
  content: string
  is_default: boolean
}

export default function CampaignSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const campaignId = params.campaignId as string
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [defaultTemplate, setDefaultTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'send' | 'quality' | 'templates' | 'schedule'>('send')
  
  // Email form state
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [sending, setSending] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadCampaign()
    loadDefaultTemplate()
  }, [campaignId])

  useEffect(() => {
    // Auto-populate from default template
    if (defaultTemplate && !emailSubject && !emailContent) {
      setEmailSubject(defaultTemplate.subject)
      setEmailContent(defaultTemplate.content)
    }
  }, [defaultTemplate])

  async function loadCampaign() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, organizations(name), products(product_name, product_id)')
        .eq('campaign_id', campaignId)
        .single()

      if (error) throw error
      setCampaign(data)
    } catch (error) {
      console.error('Error loading campaign:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadDefaultTemplate() {
    try {
      const response = await fetch(`/api/admin/campaigns/templates?campaignId=${campaignId}`)
      if (!response.ok) return
      
      const data = await response.json()
      const defaultTpl = data.templates?.find((t: EmailTemplate) => t.is_default)
      
      if (defaultTpl) {
        setDefaultTemplate(defaultTpl)
      }
    } catch (error) {
      console.error('Error loading default template:', error)
    }
  }

  async function handleSendEmail() {
    if (!campaign || !emailTo || !emailSubject || !emailContent) {
      toast.error('Please fill in all fields')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.campaign_id,
          to: emailTo,
          subject: emailSubject,
          content: emailContent
        })
      })

      if (!response.ok) throw new Error('Failed to send email')

      toast.success('Email sent successfully!')
      setEmailTo('')
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  function handleLoadTemplate(template: EmailTemplate) {
    setEmailSubject(template.subject)
    setEmailContent(template.content)
    setActiveTab('send')
    toast.success(`Template "${template.template_name}" loaded!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Campaign not found</p>
          <Button onClick={() => router.push('/admin/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/admin/campaigns')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold">
                  {campaign.campaign_name}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Email management and settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Current Template Indicator */}
          {defaultTemplate && (
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 mb-6 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-primary fill-current" />
                  <div>
                    <div className="font-semibold text-sm">Default Email Template</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Currently using: <span className="font-medium text-foreground">{defaultTemplate.template_name}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLoadTemplate(defaultTemplate)}
                >
                  Load Template
                </Button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-card/50 rounded-xl border border-border/30">
            <div className="border-b border-border/30 px-6 pt-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                  variant={activeTab === 'send' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('send')}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  variant={activeTab === 'quality' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('quality')}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Quality Check
                </Button>
                <Button
                  variant={activeTab === 'templates' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('templates')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Templates
                </Button>
                <Button
                  variant={activeTab === 'schedule' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('schedule')}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Batch Schedule
                </Button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'send' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Send Test Email</h3>
                    {defaultTemplate && (
                      <Badge variant="outline" className="gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Using: {defaultTemplate.template_name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="emailTo">Recipient Email</Label>
                    <Input
                      id="emailTo"
                      type="email"
                      placeholder="test@example.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Send to any email to test inbox placement
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="emailSubject">Subject Line</Label>
                    <Input
                      id="emailSubject"
                      type="text"
                      placeholder="Email subject"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailContent">Email Content</Label>
                    <textarea
                      id="emailContent"
                      className="w-full min-h-[250px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      placeholder="Email content..."
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                    />
                    <div className="mt-2 bg-primary/5 rounded-lg p-3 border border-primary/20">
                      <p className="text-xs font-semibold text-primary mb-2">📝 Available Placeholders:</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{product_link}}'}</code>
                          <span>→ Product URL</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{product_name}}'}</code>
                          <span>→ Product name</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{buyer_name}}'}</code>
                          <span>→ Buyer company</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <code className="bg-background px-1.5 py-0.5 rounded font-mono text-primary">{'{{org_name}}'}</code>
                          <span>→ Your org name</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        ✅ Placeholders are automatically replaced when email is sent
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendEmail}
                    disabled={sending || !emailTo || !emailSubject || !emailContent}
                    className="w-full gap-2 min-h-[44px]"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending...' : 'Send Email Immediately'}
                  </Button>
                </div>
              )}

              {activeTab === 'quality' && (
                <EmailQualityChecker
                  subject={emailSubject}
                  content={emailContent}
                  onSubjectChange={setEmailSubject}
                  onContentChange={setEmailContent}
                />
              )}

              {activeTab === 'templates' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-4">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">
                          How Templates Work
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Create templates to reuse email content</li>
                          <li>• Set one template as &quot;default&quot; - it auto-loads when sending</li>
                          <li>• Click &quot;Use&quot; on any template to load it into the send form</li>
                          <li>• Templates support all placeholders (&#123;&#123;product_name&#125;&#125;, etc.)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <EmailTemplateManager
                    campaignId={campaignId}
                    onSelectTemplate={handleLoadTemplate}
                  />
                </div>
              )}

              {activeTab === 'schedule' && (
                <BatchEmailScheduler
                  campaignId={campaignId}
                  onScheduleComplete={() => router.push(`/admin/campaigns/${campaignId}/tracking`)}
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

