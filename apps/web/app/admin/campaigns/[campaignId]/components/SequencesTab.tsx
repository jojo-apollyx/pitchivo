'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Download, GripVertical, AlertCircle, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { CollapsibleInfo } from '@/components/ui/collapsible-info'
import { toast } from 'sonner'
import { cleanHtmlForEditor, extractPlainText } from '@/lib/utils/html-converter'
import { cn } from '@/lib/utils'

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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [selectedTemplateSequence, setSelectedTemplateSequence] = useState<string>('')
  const [isLoadTemplateDialogOpen, setIsLoadTemplateDialogOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<{ sequence: Sequence; variant: any | null } | null>(null)
  const [isVariantDialogOpen, setIsVariantDialogOpen] = useState(false)
  const [variantFormData, setVariantFormData] = useState<{
    variant_label: string
    subject: string
    email_body: string
  }>({
    variant_label: 'A',
    subject: '',
    email_body: '',
  })
  const [formData, setFormData] = useState<{
    subject: string
    email_body: string
    delay_days: number
  }>({
    subject: '',
    email_body: '',
    delay_days: 1,
  })
  const [draggedSequence, setDraggedSequence] = useState<number | null>(null)
  const [deleteConfirmSequence, setDeleteConfirmSequence] = useState<Sequence | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
      
      // Normalize sequence_variants field
      const normalizedSequences = (Array.isArray(sequencesArray) ? sequencesArray : [sequencesArray]).map((seq: any) => ({
        ...seq,
        sequence_variants: seq.sequence_variants || seq.seq_variants || null,
      }))
      
      setSequences(normalizedSequences)
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

  function handleEdit(sequence: Sequence) {
    setEditingSequence(sequence)
    setFormData({
      subject: sequence.subject || '',
      email_body: cleanHtmlForEditor(sequence.email_body || ''),
      delay_days: sequence.seq_delay_details?.delay_in_days || sequence.delay_days || 1,
    })
    setIsDialogOpen(true)
  }

  function handleAddNew() {
    setEditingSequence(null)
    setFormData({
      subject: '',
      email_body: '',
      delay_days: 1,
    })
    setIsDialogOpen(true)
  }

  async function handleReorder(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= sequences.length || toIndex >= sequences.length) {
      return
    }

    const reordered = [...sequences]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    const updated = reordered.map((sequence, index) => ({
      ...sequence,
      seq_number: index + 1,
    }))

    setSequences(updated)

    try {
      setSaving(true)
      const sequencesForApi = updated.map((s: any) => ({
        ...s,
        id: s.id,
        seq_number: s.seq_number,
        seq_delay_details: { delay_in_days: s.seq_delay_details?.delay_in_days || s.delay_days || 1 },
        subject: s.subject || undefined,
        email_body: s.email_body,
        seq_variants: s.sequence_variants || s.seq_variants,
        sequence_variants: undefined,
      }))

      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesForApi }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to reorder sequences')
      }

      toast.success('Sequences reordered successfully')
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error reordering sequences:', error)
      toast.error(error.message || 'Failed to reorder sequences')
      await loadSequences()
    } finally {
      setSaving(false)
    }
  }

  function handleEditVariant(sequence: Sequence, variant: any | null) {
    setEditingVariant({ sequence, variant })
    if (variant) {
      setVariantFormData({
        variant_label: variant.variant_label || 'A',
        subject: variant.subject || '',
        email_body: cleanHtmlForEditor(variant.email_body || ''),
      })
    } else {
      const existingLabels = (sequence.sequence_variants || []).map((v: any) => v.variant_label)
      const nextLabel = ['A', 'B', 'C', 'D', 'E'].find(label => !existingLabels.includes(label)) || 'A'
      setVariantFormData({
        variant_label: nextLabel,
        subject: '',
        email_body: '',
      })
    }
    setIsVariantDialogOpen(true)
  }

  async function handleSaveVariant() {
    if (!editingVariant || !variantFormData.email_body.trim()) {
      toast.error('Email body is required')
      return
    }

    try {
      setSaving(true)

      const sequence = editingVariant.sequence
      const existingVariants = sequence.sequence_variants || []
      
      let updatedVariants: any[]
      if (editingVariant.variant) {
        updatedVariants = existingVariants.map((v: any) => 
          v.variant_label === editingVariant.variant.variant_label
            ? {
                ...v,
                subject: variantFormData.subject.trim(),
                email_body: variantFormData.email_body.trim(),
                variant_label: variantFormData.variant_label,
              }
            : v
        )
      } else {
        updatedVariants = [
          ...existingVariants,
          {
            subject: variantFormData.subject.trim(),
            email_body: variantFormData.email_body.trim(),
            variant_label: variantFormData.variant_label,
          }
        ]
      }

      const updatedSequences = sequences.map(s => 
        s.seq_number === sequence.seq_number
          ? { 
              ...s, 
              sequence_variants: updatedVariants,
              seq_variants: updatedVariants,
            }
          : s
      )

      const sequencesForApi = updatedSequences.map((s: any) => ({
        ...s,
        seq_variants: s.sequence_variants || s.seq_variants,
        sequence_variants: undefined,
      }))

      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesForApi }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save variant')
      }

      toast.success('A/B test variant saved successfully')
      setIsVariantDialogOpen(false)
      setEditingVariant(null)
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error saving variant:', error)
      toast.error(error.message || 'Failed to save variant')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick(sequence: Sequence) {
    setDeleteConfirmSequence(sequence)
    setIsDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirmSequence) return

    try {
      setSaving(true)

      const updatedSequences = sequences.filter(s => s.seq_number !== deleteConfirmSequence.seq_number)
      
      const sequencesForApi = updatedSequences.length === 0 
        ? []
        : updatedSequences.map((s: any) => ({
            ...s,
            seq_variants: s.sequence_variants || s.seq_variants,
            sequence_variants: undefined,
          }))

      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesForApi }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete sequence')
      }

      toast.success('Sequence deleted successfully')
      setIsDeleteDialogOpen(false)
      setDeleteConfirmSequence(null)
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting sequence:', error)
      toast.error(error.message || 'Failed to delete sequence')
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!formData.email_body.trim()) {
      toast.error('Email body is required')
      return
    }

    try {
      setSaving(true)

      const existingSequence = editingSequence
      const sequenceData: Sequence = {
        ...(editingSequence?.id ? { id: editingSequence.id } : {}),
        seq_number: editingSequence?.seq_number || sequences.length + 1,
        subject: formData.subject.trim() || undefined,
        email_body: formData.email_body.trim(),
        seq_delay_details: {
          delay_in_days: formData.delay_days,
        },
        sequence_variants: existingSequence?.sequence_variants || undefined,
        seq_variants: existingSequence?.sequence_variants || undefined,
      }

      let updatedSequences: Sequence[]
      if (editingSequence) {
        updatedSequences = sequences.map(s => {
          if (editingSequence.id && s.id === editingSequence.id) {
            return { ...sequenceData, seq_number: s.seq_number }
          }
          if (!editingSequence.id && s.seq_number === editingSequence.seq_number) {
            return { ...sequenceData, seq_number: s.seq_number }
          }
          return s
        })
      } else {
        const nextSeqNumber = sequences.length > 0 
          ? Math.max(...sequences.map(s => s.seq_number || 0)) + 1
          : 1
        updatedSequences = [...sequences, { ...sequenceData, seq_number: nextSeqNumber }]
      }

      const sequencesForApi = updatedSequences.map((s: any) => ({
        ...s,
        seq_variants: s.sequence_variants || s.seq_variants,
        sequence_variants: undefined,
      }))

      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesForApi }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save sequence')
      }

      toast.success(`Sequence ${editingSequence ? 'updated' : 'created'} successfully`)
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
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted p-3 mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Campaign Not Configured</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Sequences are only available for active campaigns. 
          Please configure this campaign first to manage email sequences.
        </p>
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">Email Sequences</h3>
          <p className="text-sm text-muted-foreground">
            Manage your campaign email sequences with rich formatting and placeholders
          </p>
        </div>
        <Button onClick={handleAddNew} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Add Sequence</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* Collapsible Instructions */}
      <div className="space-y-3">
        <CollapsibleInfo title="Available Placeholders" variant="muted">
          <div className="space-y-3">
            <div>
              <p className="font-medium text-foreground mb-2">Pitchivo Placeholders:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{{product_url}}'}</code> - Product page URL</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{{product_name}}'}</code> - Product name</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{{user_org_name}}'}</code> - Organization name</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{{user_name}}'}</code> - Creator name</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{{campaign_name}}'}</code> - Campaign name</div>
              </div>
            </div>
            <div>
              <p className="font-medium text-foreground mb-2">Smartlead Merge Tags:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{first_name}'}</code> - Lead first name</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{last_name}'}</code> - Lead last name</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{company_name}'}</code> - Lead company</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{email}'}</code> - Lead email</div>
                <div><code className="bg-background px-1.5 py-0.5 rounded">{'{Title}'}</code> - Lead job title</div>
              </div>
            </div>
          </div>
        </CollapsibleInfo>

        <CollapsibleInfo title="About Subsequences & A/B Testing" variant="muted">
          <div className="space-y-2 text-xs">
            <p>
              <strong className="text-foreground">A/B Test Variants:</strong> Test different email variations 
              within the same sequence. Add variants to any sequence to test subject lines and content.
            </p>
            <p>
              <strong className="text-foreground">Subsequences:</strong> Conditional sequences (e.g., "when lead 
              marked as interested") can only be managed in the Smartlead dashboard. They are not available via 
              the API.
            </p>
          </div>
        </CollapsibleInfo>
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Sequences Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Create your first email sequence to start engaging with leads. 
              You can add multiple follow-ups with custom delays.
            </p>
            <Button onClick={handleAddNew} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create First Sequence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sequences.map((sequence, index) => (
            <Card 
              key={sequence.id || index}
              className={cn(
                "group hover:border-primary/50 transition-all",
                draggedSequence === (sequence.seq_number || index) && "opacity-50"
              )}
              draggable
              onDragStart={(e) => {
                setDraggedSequence(sequence.seq_number || index)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedSequence !== null && draggedSequence !== (sequence.seq_number || index)) {
                  const draggedIndex = sequences.findIndex(s => (s.seq_number || sequences.indexOf(s) + 1) === draggedSequence)
                  if (draggedIndex !== -1) {
                    handleReorder(draggedIndex, index)
                  }
                }
                setDraggedSequence(null)
              }}
              onDragEnd={() => setDraggedSequence(null)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-base">
                          Email {sequence.seq_number || index + 1}
                        </CardTitle>
                        {sequence.seq_delay_details?.delay_in_days !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            {sequence.seq_delay_details.delay_in_days === 0 
                              ? 'Immediate' 
                              : `${sequence.seq_delay_details.delay_in_days} day${sequence.seq_delay_details.delay_in_days !== 1 ? 's' : ''}`
                            }
                          </Badge>
                        )}
                        {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {sequence.sequence_variants.length} Variant{sequence.sequence_variants.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      {sequence.subject && (
                        <CardDescription className="truncate">
                          {sequence.subject}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(sequence)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(sequence)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Body Preview */}
                {sequence.email_body && (
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {extractPlainText(sequence.email_body, 200)}
                  </div>
                )}
                
                {/* A/B Test Variants */}
                {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">A/B Test Variants:</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditVariant(sequence, null)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Variant
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {sequence.sequence_variants.map((variant: any, vIndex: number) => (
                        <Card key={variant.id || vIndex} className="bg-muted/30 border-muted">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    Variant {variant.variant_label}
                                  </Badge>
                                </div>
                                {variant.subject && (
                                  <p className="text-xs font-medium mb-1 truncate">{variant.subject}</p>
                                )}
                                {variant.email_body && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {extractPlainText(variant.email_body, 100)}
                                  </p>
                                )}
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditVariant(sequence, variant)}
                                className="h-7 w-7 p-0 shrink-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add Variant Button (when no variants) */}
                {(!sequence.sequence_variants || sequence.sequence_variants.length === 0) && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditVariant(sequence, null)}
                      className="h-8"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add A/B Test Variant
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Add Sequence Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSequence ? `Edit Email ${editingSequence.seq_number}` : 'Add New Email Sequence'}
            </DialogTitle>
            <DialogDescription>
              {editingSequence 
                ? 'Update your email sequence with rich formatting and placeholders'
                : 'Create a new email sequence. The sequence number will be assigned automatically based on order.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delay_days">Delay (days) *</Label>
                <Input
                  id="delay_days"
                  type="number"
                  min="0"
                  value={formData.delay_days}
                  onChange={(e) => setFormData({ ...formData, delay_days: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">
                  Days to wait after previous email (use 0 for immediate)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Leave empty for same-thread reply"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to reply in the same thread
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Email Body *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLoadTemplateDialogOpen(true)}
                  className="h-8"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Load Template
                </Button>
              </div>
              <RichTextEditor
                value={formData.email_body}
                onChange={(html) => setFormData({ ...formData, email_body: html })}
                placeholder="Start typing your email content... Use the toolbar to format text, add links, images, and more."
                minHeight="300px"
              />
              <p className="text-xs text-muted-foreground">
                Use the "Insert Placeholder" button in the editor toolbar to add dynamic content
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingSequence ? 'Update Sequence' : 'Create Sequence'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Template Dialog */}
      <Dialog open={isLoadTemplateDialogOpen} onOpenChange={setIsLoadTemplateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Load from Template</DialogTitle>
            <DialogDescription>
              Select a sequence from a global template to load into the form
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={(value) => {
                setSelectedTemplate(value)
                setSelectedTemplateSequence('')
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(globalTemplates).length === 0 ? (
                    <SelectItem value="none" disabled>No templates available</SelectItem>
                  ) : (
                    Object.keys(globalTemplates).map((templateName) => (
                      <SelectItem key={templateName} value={templateName}>
                        {templateName} ({globalTemplates[templateName].length} sequences)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate && globalTemplates[selectedTemplate] && (
              <div className="space-y-2">
                <Label>Select Sequence</Label>
                <Select value={selectedTemplateSequence} onValueChange={setSelectedTemplateSequence}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a sequence..." />
                  </SelectTrigger>
                  <SelectContent>
                    {globalTemplates[selectedTemplate].map((seq: any) => (
                      <SelectItem key={seq.template_id} value={seq.template_id.toString()}>
                        Sequence {seq.seq_number} - {seq.delay_days} day{seq.delay_days !== 1 ? 's' : ''} delay
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsLoadTemplateDialogOpen(false)
              setSelectedTemplate('')
              setSelectedTemplateSequence('')
            }}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedTemplate && selectedTemplateSequence && globalTemplates[selectedTemplate]) {
                  const seq = globalTemplates[selectedTemplate].find((s: any) => s.template_id.toString() === selectedTemplateSequence)
                  if (seq) {
                    setFormData({
                      ...formData,
                      subject: seq.subject || '',
                      email_body: cleanHtmlForEditor(seq.email_body || ''),
                      delay_days: seq.delay_days || 1,
                    })
                    setIsLoadTemplateDialogOpen(false)
                    setSelectedTemplate('')
                    setSelectedTemplateSequence('')
                    toast.success('Template loaded successfully')
                  }
                }
              }} 
              disabled={!selectedTemplate || !selectedTemplateSequence}
            >
              <Download className="h-4 w-4 mr-2" />
              Load Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant?.variant ? `Edit Variant ${editingVariant.variant.variant_label}` : 'Add A/B Test Variant'}
            </DialogTitle>
            <DialogDescription>
              {editingVariant?.variant 
                ? `Update variant ${editingVariant.variant.variant_label} for Email ${editingVariant.sequence.seq_number}`
                : `Create a new A/B test variant for Email ${editingVariant?.sequence.seq_number || ''}. Test different subject lines and content.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="variant_label">Variant Label</Label>
              <Select 
                value={variantFormData.variant_label} 
                onValueChange={(value) => setVariantFormData({ ...variantFormData, variant_label: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['A', 'B', 'C', 'D', 'E'].map(label => (
                    <SelectItem key={label} value={label}>Variant {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant_subject">Subject Line *</Label>
              <Input
                id="variant_subject"
                value={variantFormData.subject}
                onChange={(e) => setVariantFormData({ ...variantFormData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>

            <div className="space-y-2">
              <Label>Email Body *</Label>
              <RichTextEditor
                value={variantFormData.email_body}
                onChange={(html) => setVariantFormData({ ...variantFormData, email_body: html })}
                placeholder="Start typing your email content for this variant..."
                minHeight="300px"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveVariant} disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {editingVariant?.variant ? 'Update Variant' : 'Add Variant'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Sequence?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Email {deleteConfirmSequence?.seq_number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteDialogOpen(false)
              setDeleteConfirmSequence(null)
            }} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={saving}>
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Sequence
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
