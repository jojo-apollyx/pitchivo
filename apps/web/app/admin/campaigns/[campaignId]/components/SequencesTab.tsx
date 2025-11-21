'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Download, GripVertical } from 'lucide-react'
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
      
      // Normalize sequence_variants field (Smartlead returns sequence_variants but we use seq_variants internally)
      const normalizedSequences = (Array.isArray(sequencesArray) ? sequencesArray : [sequencesArray]).map((seq: any) => ({
        ...seq,
        sequence_variants: seq.sequence_variants || seq.seq_variants || null,
      }))
      
      console.log('[SequencesTab] Loaded sequences:', {
        count: normalizedSequences.length,
        sequences: normalizedSequences.map((s: any) => ({
          seq_number: s.seq_number,
          has_variants: !!(s.sequence_variants && s.sequence_variants.length > 0),
          variants_count: s.sequence_variants?.length || 0,
        })),
      })
      
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
      email_body: sequence.email_body || '',
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

    // Reorder in local state
    const reordered = [...sequences]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // Update seq_number based on new order (1, 2, 3, ...)
    const updated = reordered.map((sequence, index) => ({
      ...sequence,
      seq_number: index + 1,
    }))

    setSequences(updated)

    // Save to Smartlead
    try {
      setSaving(true)
      const sequencesForApi = updated.map((s: any) => ({
        ...s,
        id: s.id, // Keep existing IDs
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

      toast.success('Sequences reordered')
      await loadSequences()
      onRefresh()
    } catch (error: any) {
      console.error('Error reordering sequences:', error)
      toast.error(error.message || 'Failed to reorder sequences')
      await loadSequences() // Reload to revert
    } finally {
      setSaving(false)
    }
  }

  function handleEditVariant(sequence: Sequence, variant: any | null) {
    setEditingVariant({ sequence, variant })
    if (variant) {
      // Edit existing variant
      setVariantFormData({
        variant_label: variant.variant_label || 'A',
        subject: variant.subject || '',
        email_body: variant.email_body || '',
      })
    } else {
      // Add new variant - find next available label
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
        // Update existing variant
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
        // Add new variant
        updatedVariants = [
          ...existingVariants,
          {
            subject: variantFormData.subject.trim(),
            email_body: variantFormData.email_body.trim(),
            variant_label: variantFormData.variant_label,
          }
        ]
      }

      // Update the sequence with new variants
      // Note: Smartlead API expects 'seq_variants' in POST but returns 'sequence_variants' in GET
      const updatedSequences = sequences.map(s => 
        s.seq_number === sequence.seq_number
          ? { 
              ...s, 
              sequence_variants: updatedVariants,
              seq_variants: updatedVariants, // Also include for API compatibility
            }
          : s
      )
      
      console.log('[SequencesTab] Saving variants:', {
        sequence_number: sequence.seq_number,
        variants_count: updatedVariants.length,
        variants: updatedVariants.map((v: any) => ({
          label: v.variant_label,
          has_subject: !!v.subject,
        })),
      })

      // Convert to format expected by API (use seq_variants for POST)
      const sequencesForApi = updatedSequences.map((s: any) => ({
        ...s,
        seq_variants: s.sequence_variants || s.seq_variants, // Use seq_variants for API
        // Remove sequence_variants to avoid confusion (API expects seq_variants)
        sequence_variants: undefined,
      }))
      
      console.log('[SequencesTab] Sending variants to API:', {
        sequence_number: sequence.seq_number,
        sequences_count: sequencesForApi.length,
        target_sequence: sequencesForApi.find((s: any) => s.seq_number === sequence.seq_number),
      })

      // Save to Smartlead
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

  async function handleDelete(sequence: Sequence) {
    if (!confirm(`Are you sure you want to delete sequence ${sequence.seq_number}? This action cannot be undone.`)) {
      return
    }

    try {
      setSaving(true)

      // Remove the sequence from the list
      const updatedSequences = sequences.filter(s => s.seq_number !== sequence.seq_number)
      
      // If no sequences left, send empty array
      // Otherwise, send all remaining sequences (including the deleted one's ID to tell Smartlead to delete it)
      const sequencesForApi = updatedSequences.length === 0 
        ? []
        : updatedSequences.map((s: any) => ({
            ...s,
            seq_variants: s.sequence_variants || s.seq_variants,
            sequence_variants: undefined,
          }))

      // If sequence has an ID, we need to include it in the delete request
      // Smartlead requires sending all sequences, so we'll send the remaining ones
      // and Smartlead will remove the one not in the list
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

      // Prepare sequence data
      // Preserve existing variants when updating
      const existingSequence = editingSequence
      const sequenceData: Sequence = {
        ...(editingSequence?.id ? { id: editingSequence.id } : {}),
        seq_number: editingSequence?.seq_number || sequences.length + 1, // Auto-assign based on order
        subject: formData.subject.trim() || undefined,
        email_body: formData.email_body.trim(),
        seq_delay_details: {
          delay_in_days: formData.delay_days,
        },
        // Preserve existing variants if any
        sequence_variants: existingSequence?.sequence_variants || undefined,
        seq_variants: existingSequence?.sequence_variants || undefined, // Also include for API
      }

      // Update or add to sequences array
      let updatedSequences: Sequence[]
      if (editingSequence) {
        // Update existing sequence (by ID or by matching seq_number if ID not available)
        updatedSequences = sequences.map(s => {
          if (editingSequence.id && s.id === editingSequence.id) {
            return { ...sequenceData, seq_number: s.seq_number } // Keep existing seq_number
          }
          if (!editingSequence.id && s.seq_number === editingSequence.seq_number) {
            return { ...sequenceData, seq_number: s.seq_number } // Keep existing seq_number
          }
          return s
        })
      } else {
        // Add new sequence - auto-assign next sequence number
        const nextSeqNumber = sequences.length > 0 
          ? Math.max(...sequences.map(s => s.seq_number || 0)) + 1
          : 1
        updatedSequences = [...sequences, { ...sequenceData, seq_number: nextSeqNumber }]
      }
      
      console.log('[SequencesTab] Saving sequences:', {
        sequences_count: updatedSequences.length,
        sequences: updatedSequences.map((s: any) => ({
          seq_number: s.seq_number,
          has_variants: !!(s.sequence_variants || s.seq_variants),
          variants_count: (s.sequence_variants || s.seq_variants)?.length || 0,
        })),
      })

      // Convert to format expected by API (use seq_variants for POST)
      const sequencesForApi = updatedSequences.map((s: any) => ({
        ...s,
        seq_variants: s.sequence_variants || s.seq_variants, // Use seq_variants for API
        // Remove sequence_variants to avoid confusion (API expects seq_variants)
        sequence_variants: undefined,
      }))
      
      console.log('[SequencesTab] Sending to API:', {
        sequences_count: sequencesForApi.length,
        sequences: sequencesForApi.map((s: any) => ({
          seq_number: s.seq_number,
          has_id: !!s.id,
          has_variants: !!s.seq_variants,
          variants_count: s.seq_variants?.length || 0,
        })),
      })

      // Save to Smartlead
      const response = await fetch(`/api/smartlead/campaigns/${campaign.campaign_id}/sequences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequences: sequencesForApi }),
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
          <Alert className="mt-4">
            <AlertDescription>
              <p className="font-medium mb-1">ℹ️ About Subsequences</p>
              <p className="text-sm">
                <strong>Subsequences</strong> are conditional sequences (e.g., "when lead marked as interested") that you can create in Smartlead UI. 
                These are different from regular sequences and A/B test variants. Currently, subsequences are not available via Smartlead API, 
                so they can only be managed directly in the Smartlead dashboard.
              </p>
              <p className="text-sm mt-2">
                To manage subsequences, please visit the Smartlead dashboard and use the "Subsequences" tab in your campaign settings.
              </p>
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex items-center gap-2">
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
            <Card 
              key={sequence.id || index}
              className="group hover:border-primary/50 transition-colors"
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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(sequence)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
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
                
                {/* Show variants (A/B test variants) if they exist */}
                {sequence.sequence_variants && sequence.sequence_variants.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">A/B Test Variants:</p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditVariant(sequence, null)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Variant
                      </Button>
                    </div>
                    {sequence.sequence_variants.map((variant: any, vIndex: number) => (
                      <Card key={variant.id || vIndex} className="bg-muted/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">
                                  Variant {variant.variant_label}
                                </Badge>
                                {variant.subject && (
                                  <span className="text-sm font-medium">{variant.subject}</span>
                                )}
                              </div>
                              {variant.email_body && (
                                <div 
                                  className="prose prose-sm max-w-none text-xs text-muted-foreground line-clamp-2"
                                  dangerouslySetInnerHTML={{ __html: variant.email_body }}
                                />
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditVariant(sequence, variant)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                {/* Show "Add Variant" button if no variants exist */}
                {(!sequence.sequence_variants || sequence.sequence_variants.length === 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditVariant(sequence, null)}
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
            {editingSequence && (
              <div className="space-y-2">
                <Label>Sequence Number</Label>
                <Input
                  value={editingSequence.seq_number}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Sequence number is auto-assigned based on order. Use drag-and-drop to reorder sequences.
                </p>
              </div>
            )}

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
              <div className="flex items-center justify-between">
                <Label htmlFor="email_body">Email Body *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLoadTemplateDialogOpen(true)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Load from Template
                </Button>
              </div>
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

      {/* Load Template Sequence Dialog */}
      <Dialog open={isLoadTemplateDialogOpen} onOpenChange={setIsLoadTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load from Template</DialogTitle>
            <DialogDescription>
              Select a sequence from a global template to load into this form.
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
                  {Object.keys(globalTemplates).map((templateName) => (
                    <SelectItem key={templateName} value={templateName}>
                      {templateName} ({globalTemplates[templateName].length} sequences)
                    </SelectItem>
                  ))}
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

            {selectedTemplateSequence && selectedTemplate && globalTemplates[selectedTemplate] && (
              <Alert>
                <AlertDescription>
                  <p className="text-sm">
                    This will load the template content into the form. You can edit it before saving.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsLoadTemplateDialogOpen(false)
              setSelectedTemplate('')
              setSelectedTemplateSequence('')
            }} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={() => {
              if (selectedTemplate && selectedTemplateSequence && globalTemplates[selectedTemplate]) {
                const seq = globalTemplates[selectedTemplate].find((s: any) => s.template_id.toString() === selectedTemplateSequence)
                if (seq) {
                  setFormData({
                    ...formData,
                    seq_number: seq.seq_number,
                    subject: seq.subject || '',
                    email_body: seq.email_body || '',
                    delay_days: seq.delay_days || 1,
                  })
                  setIsLoadTemplateDialogOpen(false)
                  setSelectedTemplate('')
                  setSelectedTemplateSequence('')
                  toast.success('Template loaded into form')
                }
              }
            }} disabled={saving || !selectedTemplate || !selectedTemplateSequence}>
              <Download className="h-4 w-4 mr-2" />
              Load into Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Variant (A/B Test) Dialog */}
      <Dialog open={isVariantDialogOpen} onOpenChange={setIsVariantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVariant?.variant ? 'Edit A/B Test Variant' : 'Add A/B Test Variant'}
            </DialogTitle>
            <DialogDescription>
              {editingVariant?.variant 
                ? `Edit variant ${editingVariant.variant.variant_label} for sequence ${editingVariant.sequence.seq_number}`
                : `Add a new A/B test variant for sequence ${editingVariant?.sequence.seq_number || ''}. Note: This is for A/B testing different email variations. For conditional sequences (subsequences), please use the Smartlead dashboard.`
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
              <p className="text-xs text-muted-foreground">
                Use different labels (A, B, C) to test different email variations
              </p>
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
              <Label htmlFor="variant_email_body">Email Body *</Label>
              <Textarea
                id="variant_email_body"
                value={variantFormData.email_body}
                onChange={(e) => setVariantFormData({ ...variantFormData, email_body: e.target.value })}
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
            <Button variant="outline" onClick={() => setIsVariantDialogOpen(false)} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveVariant} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : editingVariant?.variant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
