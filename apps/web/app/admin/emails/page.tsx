'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Mail, Send, Sparkles, FileText } from 'lucide-react'
import { EmailQualityChecker } from '@/components/admin/email-quality-checker'
import { EmailTemplateManager } from '@/components/admin/email-template-manager'

export default function BrevoEmailsPage() {
  const [activeTab, setActiveTab] = useState('send')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSendEmail() {
    if (!recipientEmail || !subject || !content) {
      toast.error('Please fill in all fields')
      return
    }

    if (!recipientEmail.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/admin/brevo/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject,
          content
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      toast.success(`Email sent successfully to ${recipientEmail}!`)
      setRecipientEmail('')
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
    toast.success('Template loaded!')
    setActiveTab('send')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-primary-light/20 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-10 w-48 h-48 bg-primary-light/15 rounded-full blur-3xl pointer-events-none -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative">
        {/* Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-semibold tracking-tight">
                Brevo Email Management
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Send transactional emails via Brevo - No campaign placeholders
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-5xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                <TabsTrigger value="send" className="gap-2">
                  <Send className="h-4 w-4" />
                  Send Email
                </TabsTrigger>
                <TabsTrigger value="quality" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Quality Check
                </TabsTrigger>
                <TabsTrigger value="templates" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Templates
                </TabsTrigger>
              </TabsList>

              {/* Send Email Tab */}
              <TabsContent value="send" className="space-y-4">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 pb-4 border-b border-border/30">
                      <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold mb-1">Send Transactional Email</h2>
                        <p className="text-sm text-muted-foreground">
                          Send emails to any recipient via Brevo. Pure content only - no campaign placeholders.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="recipient">Recipient Email *</Label>
                        <Input
                          id="recipient"
                          type="email"
                          placeholder="recipient@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject Line *</Label>
                        <Input
                          id="subject"
                          placeholder="Enter email subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="content">Email Content *</Label>
                        <Textarea
                          id="content"
                          placeholder="Enter email content (plain text or HTML)..."
                          className="min-h-[300px] font-mono text-sm"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Pure transactional content - No placeholders like {`{{product_name}}`} will be replaced
                        </p>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          onClick={handleSendEmail} 
                          disabled={sending || !recipientEmail || !subject || !content}
                          className="gap-2"
                        >
                          {sending ? (
                            <>
                              <Send className="h-4 w-4 animate-pulse" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Send Email
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">Transactional Emails via Brevo</p>
                      <p className="text-xs">
                        These emails are sent immediately through Brevo's API. Use this for:
                        welcome emails, notifications, alerts, password resets, etc.
                        <br />
                        <strong>Not for campaigns</strong> - campaigns use Smartlead.
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
                    <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold mb-1">Quality Check Tips</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Aim for a score of 80+ for best deliverability</li>
                        <li>• Keep spam risk level "low" to avoid spam folders</li>
                        <li>• Review and fix all high-severity issues before sending</li>
                        <li>• Test emails across different providers (Gmail, Outlook, etc.)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Templates Tab */}
              <TabsContent value="templates" className="space-y-4">
                <Card className="p-6">
                  <EmailTemplateManager onSelectTemplate={handleLoadTemplate} />
                </Card>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-semibold mb-1">Template Management</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Save frequently used email templates for reuse</li>
                        <li>• Templates are global and available for all transactional emails</li>
                        <li>• Organize templates by category (welcome, notification, alert, etc.)</li>
                        <li>• No campaign placeholders - pure content only</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </main>
  )
}

