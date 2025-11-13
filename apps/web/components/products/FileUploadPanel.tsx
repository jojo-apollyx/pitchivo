'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2, CheckCircle, XCircle, Trash2, Eye, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ReviewFieldsModal, type ReviewField } from './ReviewFieldsModal'
import type { DocumentExtraction } from '@/lib/database.types'

export interface FileWithExtraction {
  extraction: DocumentExtraction
  displayStatus: 'uploading' | 'analyzing' | 'completed' | 'error'
  progress?: number
}

interface FileUploadPanelProps {
  files: FileWithExtraction[]
  onFilesUpload: (files: File[]) => Promise<void>
  onFileDelete: (fileId: string) => void
  onApplyFields: (fileId: string, fields: Record<string, any>) => Promise<void>
  onApplyAll?: () => Promise<void>
  isProcessing?: boolean
}

export function FileUploadPanel({
  files,
  onFilesUpload,
  onFileDelete,
  onApplyFields,
  onApplyAll,
  isProcessing = false,
}: FileUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [reviewingFileId, setReviewingFileId] = useState<string | null>(null)

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

  const getStatusColor = (status: FileWithExtraction['displayStatus']) => {
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

  const getStatusIcon = (status: FileWithExtraction['displayStatus']) => {
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

  const getStatusText = (file: FileWithExtraction) => {
    const { displayStatus, extraction, progress } = file
    
    switch (displayStatus) {
      case 'uploading':
        return `Uploading... ${progress || 0}%`
      case 'analyzing':
        return 'Extracting data with AI...'
      case 'completed':
        const fieldCount = extraction.extracted_values 
          ? Object.keys(extraction.extracted_values).filter(k => {
              const val = (extraction.extracted_values as Record<string, any>)?.[k]
              return val !== null && val !== undefined
            }).length
          : 0
        return `Extracted ${fieldCount} fields${extraction.review_status === 'reviewed' ? ' (Reviewed)' : ''}`
      case 'error':
        return extraction.error_message || 'Failed to process'
      default:
        return ''
    }
  }

  const handleReview = (fileId: string) => {
    setReviewingFileId(fileId)
  }

  const handleApply = async (fileId: string, fields: Record<string, any>) => {
    await onApplyFields(fileId, fields)
  }

  const handleQuickApply = async (fileId: string) => {
    const file = files.find(f => f.extraction.id === fileId)
    if (!file || file.displayStatus !== 'completed') return
    
    // Use reviewed_values if available, otherwise use extracted_values
    const fields = (file.extraction.reviewed_values || file.extraction.extracted_values || {}) as Record<string, any>
    
    // Remove _grouped key if it exists as a top-level key (it's metadata)
    const fieldsToApply = { ...fields }
    if ('_grouped' in fieldsToApply && typeof fieldsToApply._grouped === 'object') {
      // Keep _grouped for processing, but the API will handle it
    }
    
    await onApplyFields(fileId, fieldsToApply)
  }

  const reviewingFile = files.find(f => f.extraction.id === reviewingFileId)
  
  // Transform grouped extracted data into ReviewField format
  const reviewFields: ReviewField[] = reviewingFile ? (() => {
    const values = (reviewingFile.extraction.reviewed_values || reviewingFile.extraction.extracted_values || {}) as Record<string, any>
    const fields: ReviewField[] = []
    
    // Helper to check if value is valid (not null, undefined, empty, or "Unknown")
    const isValidValue = (value: any): boolean => {
      if (value === null || value === undefined || value === '') return false
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed === '' || trimmed.toLowerCase() === 'unknown') return false
      }
      // Skip objects (they should be processed differently or extracted to specific values)
      if (typeof value === 'object' && !Array.isArray(value)) return false
      // Empty arrays are not valid
      if (Array.isArray(value) && value.length === 0) return false
      return true
    }
    
    // Check if data is grouped (has _grouped property)
    if (values._grouped && typeof values._grouped === 'object') {
      // Process grouped data
      Object.entries(values._grouped as Record<string, any>).forEach(([groupKey, groupData]) => {
        if (groupData && typeof groupData === 'object') {
          Object.entries(groupData).forEach(([fieldKey, fieldValue]) => {
            if (isValidValue(fieldValue)) {
              fields.push({
                key: `${groupKey}.${fieldKey}`,
                label: fieldKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, l => l.toUpperCase()).trim(),
                value: fieldValue,
                confidence: 0.85,
                section: groupKey,
                group: groupKey
              })
            }
          })
        }
      })
    } else {
      // Fallback: flat structure
      Object.entries(values)
        .filter(([key, value]) => key !== '_grouped' && isValidValue(value))
        .forEach(([key, value]) => {
          fields.push({
            key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value,
            confidence: 0.85,
            section: 'basic'
          })
        })
    }
    
    return fields
  })() : []

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sticky Upload Zone */}
      <div className="flex-shrink-0 pb-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-xl transition-all duration-300',
            'flex flex-col items-center justify-center p-6 text-center',
            'hover:border-primary/50 hover:bg-primary/5',
            isDragging && 'border-primary bg-primary/10 scale-[1.02]',
            !isDragging && 'border-border/50'
          )}
        >
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-all duration-300',
              isDragging ? 'bg-primary/20 scale-110' : 'bg-primary/10'
            )}
          >
            <Upload className={cn('h-7 w-7 text-primary', isDragging && 'animate-bounce')} />
          </div>
          <h3 className="text-base font-semibold mb-1.5">Upload Documents</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            PDF, DOCX, XLSX, Images (JPG, PNG, GIF, WEBP) • COA, TDS, MSDS, Spec Sheets
          </p>
          <label htmlFor="file-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
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
            accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-between px-1">
            <div className="text-sm font-semibold text-foreground/70">
              Uploaded Files ({files.length})
            </div>
            {onApplyAll && files.some(f => f.displayStatus === 'completed') && (
              <Button
                size="sm"
                variant="outline"
                onClick={onApplyAll}
                disabled={isProcessing}
                className="h-7 text-xs gap-1.5"
              >
                <Sparkles className="h-3 w-3" />
                Apply All
              </Button>
            )}
          </div>
        )}
      </div>

      {/* File List - Scrollable */}
      {files.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-8 min-h-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {files.map((file) => (
            <div
              key={file.extraction.id}
              className={cn(
                'rounded-xl border overflow-hidden transition-all duration-300',
                'bg-card hover:border-primary/30',
                file.displayStatus === 'completed' && 'animate-in fade-in duration-500',
                'border-border/30'
              )}
            >
              {/* File Header */}
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Name, Review, Delete in same row */}
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-medium truncate flex-1 min-w-0">{file.extraction.filename}</h4>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        {file.displayStatus === 'completed' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickApply(file.extraction.id)}
                              className="h-8 w-8 p-0 text-primary hover:text-primary hover:bg-primary/10"
                              title="Quick Apply - Apply all extracted fields from this file to the form"
                              disabled={isProcessing}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                            {file.extraction.review_status !== 'reviewed' && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1.5 py-0 border-yellow-500/50 text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                                onClick={() => handleReview(file.extraction.id)}
                                title="Click to review"
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                Review
                              </Badge>
                            )}
                            {file.extraction.review_status === 'reviewed' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReview(file.extraction.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                title="View/Edit reviewed fields"
                                disabled={isProcessing}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onFileDelete(file.extraction.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          disabled={file.displayStatus === 'uploading'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* Metadata below */}
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span>{formatFileSize(file.extraction.file_size)}</span>
                      {file.extraction.file_summary && typeof file.extraction.file_summary === 'object' && (file.extraction.file_summary as any).document_type && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            {(file.extraction.file_summary as any).document_type}
                          </Badge>
                        </>
                      )}
                    </div>
                    {/* Status */}
                    <div className={cn('flex items-center gap-2 mt-2', getStatusColor(file.displayStatus))}>
                      {getStatusIcon(file.displayStatus)}
                      <span className="text-xs font-medium">{getStatusText(file)}</span>
                    </div>
                    {/* Progress Bar */}
                    {file.displayStatus === 'uploading' && file.progress !== undefined && (
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
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewingFile && (
        <ReviewFieldsModal
          isOpen={reviewingFileId !== null}
          onClose={() => setReviewingFileId(null)}
          fields={reviewFields}
          filename={reviewingFile.extraction.filename}
          documentType={(reviewingFile.extraction.file_summary as any)?.document_type}
          isAlreadyReviewed={reviewingFile.extraction.review_status === 'reviewed'}
          onApply={(fields) => handleApply(reviewingFile.extraction.id, fields)}
        />
      )}
    </div>
  )
}
