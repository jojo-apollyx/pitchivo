'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { FileText, Plus, Edit, Trash, Save, Tag } from 'lucide-react'

interface EmailTemplate {
  template_id: string
  template_name: string
  subject: string
  content: string
  category: string
  description: string | null
  created_at: string
  updated_at: string
}

interface EmailTemplateManagerProps {
  onSelectTemplate?: (template: EmailTemplate) => void
}

export function EmailTemplateManager({ onSelectTemplate }: EmailTemplateManagerProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  
  // Form state
  const [templateName, setTemplateName] = useState('')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    try {
      const response = await fetch('/api/admin/templates')
      if (!response.ok) throw new Error('Failed to load templates')
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveTemplate() {
    if (!templateName || !subject || !content) {
      toast.error('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const url = '/api/admin/templates'
      const method = editingTemplate ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingTemplate
            ? {
                templateId: editingTemplate.template_id,
                templateName,
                subject,
                content,
                category,
                description
              }
            : {
                templateName,
                subject,
                content,
                category,
                isDefault: false // New templates are not default by default
              }
        )
      })

      if (!response.ok) throw new Error('Failed to save template')

      toast.success(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`)
      
      // Reset form
      setTemplateName('')
      setSubject('')
      setContent('')
      setIsDefault(false)
      setEditingTemplate(null)
      setShowForm(false)
      
      // Reload templates
      await loadTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteClick(templateId: string) {
    setTemplateToDelete(templateId)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteTemplate() {
    if (!templateToDelete) return

    setDeleteDialogOpen(false)
    try {
      const response = await fetch(`/api/admin/campaigns/templates?templateId=${templateToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete template')

      toast.success('Template deleted successfully!')
      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    } finally {
      setTemplateToDelete(null)
    }
  }

  function handleEditTemplate(template: EmailTemplate) {
    setEditingTemplate(template)
    setTemplateName(template.template_name)
    setSubject(template.subject)
    setContent(template.content)
    setIsDefault(template.is_default)
    setShowForm(true)
  }

  function handleCancelEdit() {
    setEditingTemplate(null)
    setTemplateName('')
    setSubject('')
    setContent('')
    setIsDefault(false)
    setShowForm(false)
  }

  async function handleUseTemplate(template: EmailTemplate) {
    try {
      // Set as default template
      if (!template.is_default) {
        const response = await fetch('/api/admin/campaigns/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: template.template_id,
            isDefault: true
          })
        })

        if (!response.ok) throw new Error('Failed to set default template')
        
        // Update local state
        setTemplates(prev => prev.map(t => 
          t.template_id === template.template_id 
            ? { ...t, is_default: true }
            : { ...t, is_default: false }
        ))
      }

      // Load template into send form
      if (onSelectTemplate) {
        onSelectTemplate(template)
      }

      toast.success(`Template "${template.template_name}" set as default and loaded!`)
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('Failed to set default template')
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading templates...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Transactional Email Templates
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pure templates for transactional emails (welcome, notifications, etc.) - sent via Brevo
          </p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant={showForm ? 'outline' : 'default'}
          className="gap-2"
        >
          {!showForm && <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'New Template'}
        </Button>
      </div>

      {/* Template Form */}
      {showForm && (
        <div className="bg-card/50 rounded-xl p-4 border border-border/30 space-y-4">
          <h4 className="font-semibold">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h4>
          
          <div>
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Initial Outreach"
            />
          </div>

          <div>
            <Label htmlFor="templateDescription">Description (Optional)</Label>
            <Input
              id="templateDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of template purpose"
            />
          </div>

          <div>
            <Label htmlFor="templateCategory">Category</Label>
            <Input
              id="templateCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., outreach, follow-up, announcement"
            />
          </div>

          <div>
            <Label htmlFor="templateSubject">Subject Line</Label>
            <Input
              id="templateSubject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label htmlFor="templateContent">Email Content</Label>
            <textarea
              id="templateContent"
              className="w-full min-h-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter email content (plain text or HTML)..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pure transactional email content - no campaign placeholders
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveTemplate} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Save Template'}
            </Button>
          </div>
        </div>
      )}

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No templates yet. Create one to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.template_id}
              className="bg-background/60 rounded-lg p-4 border border-border/20 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{template.template_name}</h4>
                    {template.category && (
                      <Badge variant="outline" className="gap-1 bg-blue-100 text-blue-700 border-blue-300">
                        <Tag className="h-3 w-3" />
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Subject:</strong> {template.subject}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.content.substring(0, 150)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  {onSelectTemplate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClick(template.template_id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Template Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

