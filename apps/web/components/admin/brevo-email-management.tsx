'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Mail, 
  Send, 
  Sparkles, 
  FileText, 
  CalendarDays,
  CheckCircle,
  Info,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EmailQualityChecker } from '@/components/admin/email-quality-checker'
import { EmailTemplateManager } from '@/components/admin/email-template-manager'
import { BatchEmailScheduler } from '@/components/admin/batch-email-scheduler'
import { ScheduledEmailsViewer } from '@/components/admin/scheduled-emails-viewer'

interface Campaign {
  campaign_id: string
  campaign_name: string
  status: string
}

interface BrevoEmailManagementProps {
  campaignId?: string
}

export function BrevoEmailManagement({ campaignId: initialCampaignId }: BrevoEmailManagementProps) {
  const [activeTab, setActiveTab] = useState('send')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(initialCampaignId || '')
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('campaign_id, campaign_name, status')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setCampaigns(data || [])
      
      // Set first campaign as default if none selected
      if (!selectedCampaignId && data && data.length > 0) {
        setSelectedCampaignId(data[0].campaign_id)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoadingCampaigns(false)
    }
  }
  
  // Send email state
  const [testEmail, setTestEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  
  async function handleSendTestEmail() {
    if (!testEmail || !subject || !content) {
      toast.error('Please fill in all fields')
      return
    }

    // Basic email validation
    if (!testEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          to: testEmail,
          subject,
          content,
          isTest: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      toast.success(`Test email sent successfully to ${testEmail}!`)
      setTestEmail('')
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error(error.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  function handleLoadTemplate(template: any) {
    setSubject(template.subject)
    setContent(template.content)
    toast.success('Template loaded successfully!')
    setActiveTab('send')
  }

  if (loadingCampaigns) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Loading campaigns...
      </div>
    )
  }

  if (campaigns.length === 0) {
    return (
      <div className="py-12 text-center">
        <Mail className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground">No campaigns available</p>
        <p className="text-sm text-muted-foreground mt-2">Create a campaign first to use email management features</p>
      </div>
    )
  }

  if (!selectedCampaignId) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Please select a campaign</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-xl p-6 border border-primary/20">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">Brevo Email Management</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Send emails, check quality, manage templates, and schedule batch campaigns through Brevo
            </p>
            
            <div className="max-w-md">
              <Label htmlFor="campaign-select" className="text-sm mb-2 block">
                Select Campaign
              </Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger id="campaign-select">
                  <SelectValue placeholder="Choose a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.campaign_name} ({campaign.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Send Email</span>
            <span className="sm:hidden">Send</span>
          </TabsTrigger>
          <TabsTrigger value="quality" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Quality Check</span>
            <span className="sm:hidden">Quality</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
            <span className="sm:hidden">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Batch Schedule</span>
            <span className="sm:hidden">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Scheduled</span>
            <span className="sm:hidden">Scheduled</span>
          </TabsTrigger>
        </TabsList>

        {/* Send Email Tab */}
        <TabsContent value="send" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Send Test Email
                </h3>
                <p className="text-sm text-muted-foreground">
                  Send a test email to any address to check deliverability and inbox placement
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Placeholder Variables Available:</p>
                    <ul className="space-y-0.5 text-xs">
                      <li>• <code className="bg-blue-100 px-1 rounded">{`{{product_name}}`}</code> - Product name from campaign</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">{`{{product_link}}`}</code> - Full product URL</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">{`{{buyer_name}}`}</code> - Recipient company name</li>
                      <li>• <code className="bg-blue-100 px-1 rounded">{`{{org_name}}`}</code> - Your organization name</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="testEmail">Recipient Email</Label>
                  <Input
                    id="testEmail"
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Email Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter email content..."
                    className="min-h-[200px] font-mono text-sm"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use placeholders like {`{{product_name}}`} for dynamic content
                  </p>
                </div>

                <Button 
                  onClick={handleSendTestEmail} 
                  disabled={sending || !testEmail || !subject || !content}
                  className="w-full gap-2"
                >
                  {sending ? (
                    <>
                      <Send className="h-4 w-4 animate-pulse" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email Immediately
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Emails sent via Brevo</p>
                <p className="text-xs">
                  All emails are routed through Brevo's SMTP service for optimal deliverability. 
                  Placeholders will be automatically replaced with actual campaign data before sending.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Quality Check Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card className="p-6">
            <EmailQualityChecker
              subject={subject}
              content={content}
              onSubjectChange={setSubject}
              onContentChange={setContent}
            />
          </Card>

          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Quality Checker Tips</p>
                <ul className="space-y-1 text-xs">
                  <li>• Aim for a score of 80+ for best deliverability</li>
                  <li>• Keep spam risk level "low" to avoid filters</li>
                  <li>• Review and fix all high-severity issues</li>
                  <li>• Test emails across different providers (Gmail, Outlook, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card className="p-6">
            <EmailTemplateManager
              campaignId={selectedCampaignId}
              onSelectTemplate={handleLoadTemplate}
            />
          </Card>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-800">
                <p className="font-semibold mb-1">Template Best Practices</p>
                <ul className="space-y-1 text-xs">
                  <li>• Save successful email templates for reuse</li>
                  <li>• Set a default template for batch campaigns</li>
                  <li>• Use placeholders for personalization</li>
                  <li>• Test templates before scheduling batch sends</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Batch Schedule Tab */}
        <TabsContent value="batch" className="space-y-4">
          <Card className="p-6">
            <BatchEmailScheduler
              campaignId={selectedCampaignId}
              onScheduleComplete={() => {
                toast.success('Switching to scheduled emails view...')
                setTimeout(() => setActiveTab('scheduled'), 1000)
              }}
            />
          </Card>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Smart Scheduling Features</p>
                <ul className="space-y-1 text-xs">
                  <li>• Automatically avoids weekends and non-business hours</li>
                  <li>• Distributes emails evenly to appear natural</li>
                  <li>• Respects daily and hourly sending limits</li>
                  <li>• Randomizes send times to avoid spam filters</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Scheduled Emails Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card className="p-6">
            <ScheduledEmailsViewer campaignId={selectedCampaignId} />
          </Card>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Automated Sending</p>
                <p className="text-xs">
                  Scheduled emails are automatically sent by our cron job at their designated times. 
                  You can also send any pending email immediately using the "Send Now" button.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

