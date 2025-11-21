'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Copy, GripVertical, ChevronDown, ChevronUp, Info, CheckCircle2, ArrowRight, MoveVertical } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Template {
  template_id: string
  template_name: string
  seq_number: number
  subject?: string | null
  email_body: string
  delay_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export function GlobalSequenceTemplatesTab() {
  const [templates, setTemplates] = useState<Record<string, Template[]>>({})
  const [allTemplates, setAllTemplates] = useState<Template[]>([])
  const [defaultSequences, setDefaultSequences] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPlaceholders, setShowPlaceholders] = useState(false)
  const [formData, setFormData] = useState<{
    template_name: string
    subject: string
    email_body: string
    delay_days: number
  }>({
    template_name: '',
    subject: '',
    email_body: '',
    delay_days: 1,
  })
  const [draggedTemplate, setDraggedTemplate] = useState<string | null>(null)
  const [draggedDefaultIndex, setDraggedDefaultIndex] = useState<number | null>(null)

  useEffect(() => {
    loadTemplates()
    loadDefaultSequences()
  }, [])

  async function loadTemplates() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sequence-templates')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || {})
      setAllTemplates(data.allTemplates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  async function loadDefaultSequences() {
    try {
      const response = await fetch('/api/admin/sequence-templates/defaults')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load default sequences')
      }
      
      const data = await response.json()
      setDefaultSequences(data.defaults || [])
    } catch (error) {
      console.error('Error loading default sequences:', error)
      // Don't show error toast, defaults are optional
    }
  }

  async function saveDefaultSequences(newDefaults: Template[]) {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/sequence-templates/defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaults: newDefaults.map(t => t.template_id)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save default sequences')
      }

      toast.success('Default sequences updated')
      await loadDefaultSequences()
    } catch (error: any) {
      console.error('Error saving default sequences:', error)
      toast.error(error.message || 'Failed to save default sequences')
    } finally {
      setSaving(false)
    }
  }

  function addToDefaults(template: Template) {
    const newDefaults = [...defaultSequences, template]
    setDefaultSequences(newDefaults)
    saveDefaultSequences(newDefaults)
  }

  function removeFromDefaults(templateId: string) {
    const newDefaults = defaultSequences.filter(t => t.template_id !== templateId)
    setDefaultSequences(newDefaults)
    saveDefaultSequences(newDefaults)
  }

  function reorderDefaults(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
        fromIndex >= defaultSequences.length || toIndex >= defaultSequences.length) {
      return
    }

    const reordered = [...defaultSequences]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)
    
    setDefaultSequences(reordered)
    saveDefaultSequences(reordered)
  }

  function isInDefaults(templateId: string): boolean {
    return defaultSequences.some(t => t.template_id === templateId)
  }

  function handleAddNew() {
    setEditingTemplate(null)
    setFormData({
      template_name: '',
      subject: '',
      email_body: '',
      delay_days: 1,
    })
    setIsDialogOpen(true)
  }

  async function handleReorder(templateName: string, fromIndex: number, toIndex: number) {
    const templateList = templates[templateName] || []
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= templateList.length || toIndex >= templateList.length) {
      return
    }

    // Reorder in local state
    const reordered = [...templateList]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(toIndex, 0, moved)

    // Update seq_number based on new order (1, 2, 3, ...)
    const updated = reordered.map((template, index) => ({
      ...template,
      seq_number: index + 1,
    }))

    setTemplates({
      ...templates,
      [templateName]: updated,
    })

    // Update in database
    try {
      setSaving(true)
      
      // Update all sequences in the template with new seq_numbers
      await Promise.all(
        updated.map((template, index) =>
          fetch(`/api/admin/sequence-templates/${template.template_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              template_name: templateName,
              seq_number: index + 1,
              subject: template.subject || null,
              email_body: template.email_body,
              delay_days: template.delay_days,
              is_active: template.is_active,
            })
          })
        )
      )

      toast.success('Template order updated')
      await loadTemplates()
    } catch (error: any) {
      console.error('Error reordering templates:', error)
      toast.error('Failed to update template order')
      await loadTemplates() // Reload to revert
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(template: Template) {
    setEditingTemplate(template)
    setFormData({
      template_name: template.template_name,
      subject: template.subject || '',
      email_body: template.email_body,
      delay_days: template.delay_days,
    })
    setIsDialogOpen(true)
  }

  async function handleSave() {
    if (!formData.template_name.trim() || !formData.email_body.trim()) {
      toast.error('Template name and email body are required')
      return
    }

    try {
      setSaving(true)

      if (editingTemplate) {
        // Update existing - keep existing seq_number
        const response = await fetch(`/api/admin/sequence-templates/${editingTemplate.template_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            seq_number: editingTemplate.seq_number, // Keep existing order
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to update template')
        }
        toast.success('Template updated successfully')
      } else {
        // Create new - auto-assign seq_number based on existing count
        const existingSequences = allTemplates.filter(
          t => t.template_name === formData.template_name && t.is_active
        )
        const nextSeqNumber = existingSequences.length + 1

        const response = await fetch('/api/admin/sequence-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            seq_number: nextSeqNumber, // Auto-assign based on order
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create template')
        }
        toast.success('Template created successfully')
      }

      setIsDialogOpen(false)
      setEditingTemplate(null)
      await loadTemplates()
    } catch (error: any) {
      console.error('Error saving template:', error)
      toast.error(error.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(template: Template) {
    if (!confirm(`Are you sure you want to delete this template?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/sequence-templates/${template.template_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete template')
      }

      toast.success('Template deleted successfully')
      await loadTemplates()
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
    }
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

  const templateNames = Object.keys(templates)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Global Sequence Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create templates and select default sequences for new campaigns
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Collapsible Placeholder Info */}
      <Collapsible open={showPlaceholders} onOpenChange={setShowPlaceholders}>
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Available Placeholders & Merge Tags</span>
                </div>
                {showPlaceholders ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Pitchivo Placeholders</p>
                  <div className="space-y-1">
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{"{{product_url}}"}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Full URL to the product page</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{"{{product_name}}"}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Name of the product</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{"{{user_org_name}}"}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Organization name</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{"{{user_name}}"}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Campaign creator name</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">{"{{campaign_name}}"}</code>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Campaign display name</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Smartlead Merge Tags</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded">{"{first_name}"}</code>
                      <code className="bg-muted px-2 py-0.5 rounded">{"{last_name}"}</code>
                      <code className="bg-muted px-2 py-0.5 rounded">{"{full_name}"}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded">{"{company_name}"}</code>
                      <code className="bg-muted px-2 py-0.5 rounded">{"{email}"}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-0.5 rounded">{"{Title}"}</code>
                      <span className="text-muted-foreground">(from custom fields)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Two-Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column: All Templates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">All Sequence Templates</CardTitle>
            <CardDescription>
              Click <ArrowRight className="h-3 w-3 inline mx-1" /> to add to defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
            {templateNames.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No templates found. Click "New Template" to create one.
                </AlertDescription>
              </Alert>
            ) : (
              templateNames.map((templateName) => {
                const sequences = templates[templateName].sort((a, b) => a.seq_number - b.seq_number)
                return (
                  <div key={templateName} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{templateName}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {sequences.length} seq
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {sequences.map((template) => {
                        const inDefaults = isInDefaults(template.template_id)
                        return (
                          <div 
                            key={template.template_id} 
                            className="border rounded-lg p-3 space-y-2 group hover:border-primary/50 transition-colors bg-card"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Badge variant="outline" className="text-xs shrink-0">
                                  #{template.seq_number}
                                </Badge>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-wrap">
                                  <span>{template.delay_days}d delay</span>
                                  {inDefaults && (
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!inDefaults && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 w-7 p-0"
                                    onClick={() => addToDefaults(template)}
                                    title="Add to defaults"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleEdit(template)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-destructive"
                                  onClick={() => handleDelete(template)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            {template.subject && (
                              <p className="text-xs font-medium truncate" title={template.subject}>
                                📧 {template.subject}
                              </p>
                            )}
                            <div 
                              className="text-xs text-muted-foreground line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: template.email_body }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Column: Default Sequences */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Default Sequences
            </CardTitle>
            <CardDescription>
              Auto-applied to new campaigns (drag to reorder)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
            {defaultSequences.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  No default sequences selected. Add sequences from the left panel.
                </AlertDescription>
              </Alert>
            ) : (
              defaultSequences.map((template, index) => (
                <div 
                  key={template.template_id}
                  className="border-2 border-primary/20 rounded-lg p-3 space-y-2 group hover:border-primary/50 transition-colors bg-primary/5 cursor-move"
                  draggable
                  onDragStart={(e) => {
                    setDraggedDefaultIndex(index)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = 'move'
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (draggedDefaultIndex !== null && draggedDefaultIndex !== index) {
                      reorderDefaults(draggedDefaultIndex, index)
                    }
                    setDraggedDefaultIndex(null)
                  }}
                  onDragEnd={() => setDraggedDefaultIndex(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Badge className="text-xs shrink-0 bg-primary">
                        Seq {index + 1}
                      </Badge>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {template.template_name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {template.delay_days}d
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeFromDefaults(template.template_id)}
                        title="Remove from defaults"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {template.subject && (
                    <p className="text-xs font-medium truncate ml-6" title={template.subject}>
                      📧 {template.subject}
                    </p>
                  )}
                  <div 
                    className="text-xs text-muted-foreground line-clamp-2 ml-6"
                    dangerouslySetInnerHTML={{ __html: template.email_body }}
                  />
                </div>
              ))
            )}
            {defaultSequences.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <MoveVertical className="h-3 w-3" />
                  Drag to reorder • Click <X className="h-3 w-3 inline" /> to remove
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create New Template'}
            </DialogTitle>
            <DialogDescription>
              Create a global sequence template. These can be used as defaults for campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">Template Name *</Label>
              <Input
                id="template_name"
                value={formData.template_name}
                onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                placeholder="e.g., Default Outreach, Product Launch"
                disabled={!!editingTemplate}
              />
              <p className="text-xs text-muted-foreground">
                {editingTemplate ? 'Template name cannot be changed' : 'Group sequences by template name'}
              </p>
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
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

