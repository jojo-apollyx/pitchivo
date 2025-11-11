'use client'

import { useState, useEffect } from 'react'
import { FileText, Edit, Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { TemplateSchema } from '@/lib/api/template-validation'

interface Template {
  template_id: string
  industry_code: string
  template_name: string | null
  schema_json: TemplateSchema
  version: string | null
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
  industries: {
    industry_name: string
    description: string | null
  } | null
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedTemplate, setEditedTemplate] = useState<Partial<Template> | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/templates', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to load templates')
      }

      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingId(template.template_id)
    setEditedTemplate({
      template_name: template.template_name || '',
      version: template.version || '',
      is_active: template.is_active,
      is_default: template.is_default,
      schema_json: template.schema_json,
    })
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditedTemplate(null)
  }

  const handleSave = async (templateId: string) => {
    if (!editedTemplate) return

    try {
      const response = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          template_id: templateId,
          ...editedTemplate,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      toast.success('Template updated successfully')
      setEditingId(null)
      setEditedTemplate(null)
      loadTemplates()
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update template')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/20 via-background to-primary-light/10 relative overflow-hidden">
      <div className="relative">
        {/* Page Header */}
        <section className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">Product Templates</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  Manage product templates for all industries
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Templates List */}
        <section className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="space-y-4">
            {templates.length === 0 ? (
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No templates found</p>
              </div>
            ) : (
              templates.map((template) => {
                const isEditing = editingId === template.template_id
                const industryName = template.industries?.industry_name || template.industry_code

                return (
                  <div
                    key={template.template_id}
                    className="bg-card/50 backdrop-blur-sm rounded-xl p-6 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {isEditing ? (
                              <Input
                                value={editedTemplate?.template_name || ''}
                                onChange={(e) =>
                                  setEditedTemplate({
                                    ...editedTemplate,
                                    template_name: e.target.value,
                                  })
                                }
                                placeholder="Template name"
                                className="max-w-md"
                              />
                            ) : (
                              template.template_name || `Template for ${industryName}`
                            )}
                          </h3>
                          {template.is_default && (
                            <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              Default
                            </span>
                          )}
                          {!template.is_active && (
                            <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <strong>Industry:</strong> {industryName} ({template.industry_code})
                          </p>
                          <p>
                            <strong>Version:</strong>{' '}
                            {isEditing ? (
                              <Input
                                value={editedTemplate?.version || ''}
                                onChange={(e) =>
                                  setEditedTemplate({
                                    ...editedTemplate,
                                    version: e.target.value,
                                  })
                                }
                                placeholder="1.0.0"
                                className="inline-block w-32 ml-2"
                              />
                            ) : (
                              template.version || 'N/A'
                            )}
                          </p>
                          <p>
                            <strong>Sections:</strong>{' '}
                            {template.schema_json?.sections?.length || 0}
                          </p>
                          <p>
                            <strong>Created:</strong>{' '}
                            {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleSave(template.template_id)}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(template)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="border-t border-border/50 pt-4 space-y-4">
                        <div className="flex items-center gap-4">
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editedTemplate?.is_active ?? false}
                              onChange={(e) =>
                                setEditedTemplate({
                                  ...editedTemplate,
                                  is_active: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            Active
                          </Label>
                          <Label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editedTemplate?.is_default ?? false}
                              onChange={(e) =>
                                setEditedTemplate({
                                  ...editedTemplate,
                                  is_default: e.target.checked,
                                })
                              }
                              className="rounded"
                            />
                            Default Template
                          </Label>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <Label className="text-sm font-medium mb-2 block">
                            Template Schema (JSON)
                          </Label>
                          <pre className="text-xs overflow-auto max-h-96 bg-background p-4 rounded border border-border">
                            {JSON.stringify(editedTemplate?.schema_json, null, 2)}
                          </pre>
                          <p className="text-xs text-muted-foreground mt-2">
                            Note: Schema editing requires JSON knowledge. Edit with caution.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

