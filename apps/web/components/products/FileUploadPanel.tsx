'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, RefreshCw, Eye, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export interface ExtractedField {
  fieldName: string
  value: string | number | string[]
  confidence: number
  section: string
}

export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'analyzing' | 'completed' | 'error'
  progress?: number
  extractedFields?: ExtractedField[]
  documentType?: string
  url?: string
  error?: string
}

interface FileUploadPanelProps {
  files: UploadedFile[]
  onFilesUpload: (files: File[]) => Promise<void>
  onFileDelete: (fileId: string) => void
  onFileReanalyze: (fileId: string) => Promise<void>
  onApplyFields: (fileId: string, fields: ExtractedField[]) => void
  isProcessing?: boolean
}

export function FileUploadPanel({
  files,
  onFilesUpload,
  onFileDelete,
  onFileReanalyze,
  onApplyFields,
  isProcessing = false,
}: FileUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null)
  const [editingFields, setEditingFields] = useState<Record<string, ExtractedField[]>>({})

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) {
        await onFilesUpload(droppedFiles)
      }
    },
    [onFilesUpload]
  )

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : []
      if (selectedFiles.length > 0) {
        await onFilesUpload(selectedFiles)
      }
      e.target.value = '' // Reset input
    },
    [onFilesUpload]
  )

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-600'
      case 'analyzing':
        return 'text-purple-600'
      case 'completed':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusText = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return `Uploading... ${file.progress || 0}%`
      case 'analyzing':
        return 'Extracting data with AI...'
      case 'completed':
        return `Extracted ${file.extractedFields?.length || 0} fields`
      case 'error':
        return file.error || 'Failed to process'
      default:
        return ''
    }
  }

  const handleFieldEdit = (fileId: string, fieldIndex: number, newValue: string) => {
    setEditingFields((prev) => {
      const fileFields = prev[fileId] || files.find((f) => f.id === fileId)?.extractedFields || []
      const updatedFields = [...fileFields]
      updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], value: newValue }
      return { ...prev, [fileId]: updatedFields }
    })
  }

  const handleApplyToForm = (fileId: string) => {
    const fields = editingFields[fileId] || files.find((f) => f.id === fileId)?.extractedFields || []
    onApplyFields(fileId, fields)
    toast.success('Fields applied to form successfully')
  }

  const toggleExpand = (fileId: string) => {
    setExpandedFileId(expandedFileId === fileId ? null : fileId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl transition-all duration-300',
          'flex flex-col items-center justify-center p-8 text-center',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging && 'border-primary bg-primary/10 scale-[1.02]',
          !isDragging && 'border-border/50'
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300',
            isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10'
          )}
        >
          <Upload className={cn('h-8 w-8 text-primary', isDragging && 'animate-bounce')} />
        </div>
        <h3 className="text-lg font-semibold mb-2">Upload Documents</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Drop files here or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Supports PDF, DOCX, XLSX (COA, TDS, MSDS, Certificates)
        </p>
        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            disabled={isProcessing}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xlsx,.xls"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3 flex-1 overflow-y-auto">
          <h3 className="text-sm font-semibold text-foreground/70 px-1">
            Uploaded Files ({files.length})
          </h3>
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                'rounded-xl border border-border/30 overflow-hidden transition-all duration-300',
                'bg-card hover:border-primary/30',
                file.status === 'completed' && 'animate-in fade-in duration-500',
                expandedFileId === file.id && 'ring-2 ring-primary/20'
              )}
            >
              {/* File Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{file.name}</h4>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span>{formatFileSize(file.size)}</span>
                          {file.documentType && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs px-1.5 py-0">
                                {file.documentType}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {file.status === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpand(file.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onFileReanalyze(file.id)}
                              className="h-8 w-8 p-0"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onFileDelete(file.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={file.status === 'uploading'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Status */}
                    <div className={cn('flex items-center gap-2 mt-2', getStatusColor(file.status))}>
                      {getStatusIcon(file.status)}
                      <span className="text-xs font-medium">{getStatusText(file)}</span>
                    </div>
                    {/* Progress Bar */}
                    {file.status === 'uploading' && file.progress !== undefined && (
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Extracted Fields (Expandable) */}
              {file.status === 'completed' && expandedFileId === file.id && file.extractedFields && (
                <div className="border-t border-border/30 bg-muted/30 p-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Extracted Fields</h4>
                    <Button
                      size="sm"
                      onClick={() => handleApplyToForm(file.id)}
                      className="h-8"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Apply to Form
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {file.extractedFields.map((field, index) => (
                      <div
                        key={index}
                        className="bg-background rounded-lg p-3 border border-border/30"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {field.fieldName}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs px-1.5 py-0',
                              field.confidence > 0.9 && 'border-green-500/50 text-green-700',
                              field.confidence > 0.7 && field.confidence <= 0.9 && 'border-yellow-500/50 text-yellow-700',
                              field.confidence <= 0.7 && 'border-orange-500/50 text-orange-700'
                            )}
                          >
                            {Math.round(field.confidence * 100)}%
                          </Badge>
                        </div>
                        <input
                          type="text"
                          value={
                            editingFields[file.id]?.[index]?.value?.toString() ||
                            field.value?.toString() ||
                            ''
                          }
                          onChange={(e) => handleFieldEdit(file.id, index, e.target.value)}
                          className="w-full px-2 py-1.5 text-sm rounded border border-border/50 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

