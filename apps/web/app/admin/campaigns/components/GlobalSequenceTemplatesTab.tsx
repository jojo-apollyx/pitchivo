'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit, Trash2, Save, X, Copy, GripVertical } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    loadTemplates()
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Global Sequence Templates</h3>
          <p className="text-sm text-muted-foreground">
            Create default sequence templates that can be used across all campaigns. Use placeholders like {'{{product_url}}'}, {'{{product_name}}'}, {'{{user_org_name}}'}
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Placeholder Info */}
      <Alert>
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium">Available Placeholders (replaced when template is applied):</p>
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
            <p className="text-xs mt-2">These templates can be used as defaults for campaigns. Campaigns can override with custom sequences.</p>
          </div>
        </AlertDescription>
      </Alert>

      {templateNames.length === 0 ? (
        <Alert>
          <AlertDescription>
            No global sequence templates found. Click "New Template" to create one.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {templateNames.map((templateName) => {
            const sequences = templates[templateName].sort((a, b) => a.seq_number - b.seq_number)
            return (
              <Card key={templateName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{templateName}</CardTitle>
                      <CardDescription>
                        {sequences.length} sequence{sequences.length !== 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sequences.map((template, index) => (
                      <div 
                        key={template.template_id} 
                        className="border rounded-lg p-4 space-y-2 group hover:border-primary/50 transition-colors"
                        draggable
                        onDragStart={(e) => {
                          setDraggedTemplate(template.template_id)
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          if (draggedTemplate && draggedTemplate !== template.template_id) {
                            const draggedIndex = sequences.findIndex(t => t.template_id === draggedTemplate)
                            if (draggedIndex !== -1) {
                              handleReorder(templateName, draggedIndex, index)
                            }
                          }
                          setDraggedTemplate(null)
                        }}
                        onDragEnd={() => setDraggedTemplate(null)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Badge>Sequence {template.seq_number}</Badge>
                            {template.delay_days > 0 && (
                              <Badge variant="outline">
                                {template.delay_days} day{template.delay_days !== 1 ? 's' : ''} delay
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(template)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {template.subject && (
                          <p className="text-sm font-medium">Subject: {template.subject}</p>
                        )}
                        <div 
                          className="prose prose-sm max-w-none text-sm text-muted-foreground line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: template.email_body }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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

            {editingTemplate && (
              <div className="space-y-2">
                <Label>Sequence Number</Label>
                <Input
                  value={editingTemplate.seq_number}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Sequence number is auto-assigned based on order. Use drag-and-drop to reorder templates.
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

