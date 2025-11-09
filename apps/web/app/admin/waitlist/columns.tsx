'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Mail, CheckCircle, Shield, RotateCcw } from 'lucide-react'
import { createSortableHeader, createDateColumn } from '@/components/data-table/column-helpers'
import type { WaitlistEntry } from './types'

const getStatusBadge = (status: string) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    invited: 'default',
    approved: 'secondary',
    rejected: 'destructive',
  }
  return variants[status] || 'outline'
}

export const createWaitlistColumns = (
  onInvite: (entry: WaitlistEntry) => void,
  onApprove: (entry: WaitlistEntry) => void,
  onResendInvite: (entry: WaitlistEntry) => void,
  onBlock: (entry: WaitlistEntry) => void,
  onRestore: (entry: WaitlistEntry) => void
): ColumnDef<WaitlistEntry>[] => [
  createSortableHeader<WaitlistEntry>('Email', 'email'),
  createSortableHeader<WaitlistEntry>('Name', 'full_name'),
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => row.getValue('role') || '-',
  },
  createDateColumn<WaitlistEntry>('created_at', 'Created At'),
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={getStatusBadge(status)} className="text-xs">
          {status}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const entry = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          {entry.status === 'pending' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInvite(entry)}
                    className="min-h-[36px] px-2"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Send invitation email</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApprove(entry)}
                    className="min-h-[36px] px-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Approve and move to whitelist</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
          {entry.status === 'invited' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onResendInvite(entry)}
                  className="min-h-[36px] px-2"
                >
                  <Mail className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Resend invitation email</p>
              </TooltipContent>
            </Tooltip>
          )}
          {entry.status === 'rejected' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRestore(entry)}
                  className="min-h-[36px] px-2 text-primary hover:text-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Restore to pending status</p>
              </TooltipContent>
            </Tooltip>
          )}
          {entry.status !== 'rejected' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onBlock(entry)}
                  className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                >
                  <Shield className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Block domain and reject entry</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
  },
]

