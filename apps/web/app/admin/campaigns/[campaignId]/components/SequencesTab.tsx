'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

interface SequencesTabProps {
  campaign: any
  onRefresh: () => void
}

interface Sequence {
  id?: number
  seq_number: number
  subject?: string
  email_body: string
  seq_delay_details?: { delay_in_days: number }
  delay_days?: number
  sequence_variants?: Array<{
    id?: number
    subject: string
    email_body: string
    variant_label: string
  }>
}

export function SequencesTab({ campaign, onRefresh }: SequencesTabProps) {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [globalTemplates, setGlobalTemplates] = useState<Record<string, any[]>>({})
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [formData, setFormData] = useState<{
    seq_number: number
    subject: string
    email_body: string
    delay_days: number
  }>({
    seq_number: 1,
    subject: '',
    email_body: '',
    delay_days: 1,
  })

  useEffect(() => {
    loadSequences()
    loadGlobalTemplates()
  }, [campaign.smartlead_campaign_id])

  async function loadSequences() {
    if (!campaign.smartlead_campaign_id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load sequences')
      }
      
      const data = await response.json()
      const sequencesArray = data.sequences || []
      setSequences(Array.isArray(sequencesArray) ? sequencesArray : [sequencesArray])
    } catch (error) {
      console.error('Error loading sequences:', error)
      toast.error('Failed to load sequences')
    } finally {
      setLoading(false)
    }
  }

  async function loadGlobalTemplates() {
    try {
      setLoadingTemplates(true)
      const response = await fetch('/api/admin/sequence-templates')
      
      if (!response.ok) {
        throw new Error('Failed to load global templates')
      }
      
      const data = await response.json()
      setGlobalTemplates(data.templates || {})
    } catch (error) {
      console.error('Error loading global templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function handleUseGlobalTemplate() {
    if (!selectedTemplate) {
      toast.error('Please select a template')
      return
    }

    const templateSequences = globalTemplates[selectedTemplate]
    if (!templateSequences || templateSequences.length === 0) {
      toast.error('Selected template has no sequences')
      return
    }

    try {
      setSaving(true)

      // Convert global template sequences to Smartlead format
      const sequencesToSave: Sequence[] = templateSequences.map((t: any) => ({
        seq_number: t.seq_number,
        subject: t.subject || undefined,
        email_body: t.email_body,
        seq_delay_details: {
          delay_in_days: t.delay_days || 1,
        },
      }))

      // Save to Smartlead (placeholders will be replaced automatically)
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to apply template')
      }

      toast.success('Global template applied successfully')
      setIsTemplateDialogOpen(false)
      setSelectedTemplate('')
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error applying template:', error)
      toast.error(error.message || 'Failed to apply template')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(sequence: Sequence) {
    setEditingSequence(sequence)
    setFormData({
      seq_number: sequence.seq_number || 1,
      subject: sequence.subject || '',
      email_body: sequence.email_body || '',
      delay_days: sequence.seq_delay_details?.delay_in_days || sequence.delay_days || 1,
    })
    setIsDialogOpen(true)
  }

  function handleAddNew() {
    const nextSeqNumber = sequences.length > 0 
      ? Math.max(...sequences.map(s => s.seq_number || 0)) + 1
      : 1
    
    setEditingSequence(null)
    setFormData({
      seq_number: nextSeqNumber,
      subject: '',
      email_body: '',
      delay_days: 1,
    })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.email_body.trim()) {
      toast.error('Email body is required')
      return
    }

    try {
      setSaving(true)

      // Prepare sequence data
      const sequenceData: Sequence = {
        ...(editingSequence?.id ? { id: editingSequence.id } : {}),
        seq_number: formData.seq_number,
        subject: formData.subject.trim() || undefined,
        email_body: formData.email_body.trim(),
        seq_delay_details: {
          delay_in_days: formData.delay_days,
        },
      }

      // Update or add to sequences array
      let updatedSequences: Sequence[]
      if (editingSequence) {
        // Update existing
        updatedSequences = sequences.map(s => 
          s.seq_number === formData.seq_number ? sequenceData : s
        )
      } else {
        // Add new
        updatedSequences = [...sequences, sequenceData]
      }

      // Save to Smartlead
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: updatedSequences }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save sequence')
      }

      toast.success('Sequence saved successfully')
      setIsDialogOpen(false)
      setEditingSequence(null)
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error saving sequence:', error)
      toast.error(error.message || 'Failed to save sequence')
    } finally {
      setSaving(false)
    }
  }

  if (!campaign.smartlead_campaign_id) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Campaign not synced with Smartlead</p>
        <p className="text-sm text-muted-foreground mt-2">Sequences are only available for synced campaigns</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Sequences</h3>
          <p className="text-sm text-muted-foreground">
            Manage your campaign email sequences. Use placeholders like {'{{product_url}}'}, {'{{product_name}}'}, {'{{user_org_name}}'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Use Global Template
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Sequence
          </Button>
        </div>
      </div>

      {/* Placeholder Info */}
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">Available Placeholders (replaced when sequence is saved):</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li><code className="bg-muted px-1 rounded">{"{{product_url}}"}</code> - Full URL to the product page</li>
              <li><code className="bg-muted px-1 rounded">{"{{product_name}}"}</code> - Name of the product</li>
              <li><code className="bg-muted px-1 rounded">{"{{user_org_name}}"}</code> - Organization name</li>
              <li><code className="bg-muted px-1 rounded">{"{{user_name}}"}</code> - Campaign creator name</li>
              <li><code className="bg-muted px-1 rounded">{"{{campaign_name}}"}</code> - Campaign display name</li>
            </ul>
            <p className="text-xs mt-2 font-medium">Smartlead Native Merge Tags (replaced automatically by Smartlead):</p>
            <ul className="list-disc list-inside text-xs space-y-1 mt-1">
              <li><code className="bg-muted px-1 rounded">{"{first_name}"}</code>, <code className="bg-muted px-1 rounded">{"{last_name}"}</code>, <code className="bg-muted px-1 rounded">{"{full_name}"}</code> - Lead name</li>
              <li><code className="bg-muted px-1 rounded">{"{company_name}"}</code> - Lead company</li>
              <li><code className="bg-muted px-1 rounded">{"{email}"}</code> - Lead email</li>
              <li><code className="bg-muted px-1 rounded">{"{Title}"}</code> - Lead job title (from custom fields)</li>
            </ul>
            <p className="text-xs mt-2">Placeholders will be automatically replaced when sequences are saved to Smartlead.</p>
          </div>
        </AlertDescription>
      </Alert>

      {sequences.length === 0 ? (
        <Alert>
          <AlertDescription>
            No sequences found for this campaign. Click "Add Sequence" to create one.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {sequences.map((sequence, index) => (
            <Card key={sequence.id || index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">
                        Email {sequence.seq_number || index + 1}
                      </CardTitle>
                      {sequence.seq_delay_details?.delay_in_days && (
                        <Badge variant="outline">
                          {sequence.seq_delay_details.delay_in_days} day{sequence.seq_delay_details.delay_in_days !== 1 ? 's' : ''} delay
                        </Badge>
                      )}
                      {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                        <Badge variant="secondary">
                          {sequence.sequence_variants.length} Variant{sequence.sequence_variants.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                    {sequence.subject && (
                      <CardDescription>
                        Subject: {sequence.subject}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sequence)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sequence.email_body && (
                  <div 
                    className="prose prose-sm max-w-none text-sm text-muted-foreground line-clamp-3"
                    dangerouslySetInnerHTML={{ __html: sequence.email_body }}
                  />
                )}
                
                {/* Show variants if they exist */}
                {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <p className="text-sm font-medium">Variants:</p>
                    {sequence.sequence_variants.map((variant: any, vIndex: number) => (
                      <div key={variant.id || vIndex} className="text-sm">
                        <Badge variant="outline" className="mr-2">
                          Variant {variant.variant_label}
                        </Badge>
                        <span className="text-muted-foreground">{variant.subject}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? 'Edit Sequence' : 'Add New Sequence'}
            </DialogTitle>
            <DialogDescription>
              Edit the email sequence. Placeholders will be replaced automatically when sending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="seq_number">Sequence Number</Label>
              <Input
                id="seq_number"
                type="number"
                min="1"
                value={formData.seq_number}
                onChange={(e) => setFormData({ ...formData, seq_number: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delay_days">Delay (days)</Label>
              <Input
                id="delay_days"
                type="number"
                min="0"
                value={formData.delay_days}
                onChange={(e) => setFormData({ ...formData, delay_days: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                Number of days to wait before sending this email after the previous one
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line (optional)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line (leave empty for same-thread follow-ups)"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to send as a reply in the same thread
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_body">Email Body *</Label>
              <Textarea
                id="email_body"
                value={formData.email_body}
                onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                placeholder="Enter your email content here. Use placeholders like {{product_url}}, {{product_name}}, {{user_org_name}}"
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                You can use HTML formatting. Placeholders: {"{{product_url}}"}, {"{{product_name}}"}, {"{{user_org_name}}"}, {"{{user_name}}"}, {"{{campaign_name}}"}. 
                Also use Smartlead merge tags: {"{first_name}"}, {"{company_name}"}, {"{Title}"}, etc.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Sequence'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Use Global Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use Global Template</DialogTitle>
            <DialogDescription>
              Select a global sequence template to apply to this campaign. This will replace all existing sequences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(globalTemplates).map((templateName) => (
                    <SelectItem key={templateName} value={templateName}>
                      {templateName} ({globalTemplates[templateName].length} sequences)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && globalTemplates[selectedTemplate] && (
              <Alert>
                <AlertDescription>
                  <p className="font-medium mb-2">This template contains:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {globalTemplates[selectedTemplate].map((seq: any) => (
                      <li key={seq.template_id}>
                        Sequence {seq.seq_number} - {seq.delay_days} day{seq.delay_days !== 1 ? 's' : ''} delay
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleUseGlobalTemplate} disabled={saving || !selectedTemplate}>
              <Download className="h-4 w-4 mr-2" />
              {saving ? 'Applying...' : 'Apply Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
