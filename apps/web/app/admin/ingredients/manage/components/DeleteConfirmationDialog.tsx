'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Company {
  id: string
  name: string
  signals: any[]
}

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  target: { type: 'signal' | 'all'; signalId?: string; companyId?: string } | null
  company?: Company
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  target,
  company
}: DeleteConfirmationDialogProps) {
  if (!target) return null

  const isMultipleSignals = target.type === 'all' && company && company.signals.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            {target.type === 'signal' ? (
              'Are you sure you want to delete this signal?'
            ) : isMultipleSignals ? (
              <>
                This will delete all <strong>{company.signals.length} signals</strong> for{' '}
                <strong>{company.name}</strong> related to this ingredient.
                <br />
                <br />
                This company will no longer appear for this ingredient.
              </>
            ) : (
              'Are you sure you want to delete this signal?'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {target.type === 'all' ? 'Delete All Signals' : 'Delete Signal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

