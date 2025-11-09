'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Trash2, CheckCircle, Shield } from 'lucide-react'
import { createSortableHeader, createDateColumn } from '@/components/data-table/column-helpers'
import type { BlockedDomain } from './types'

export const createDomainsColumns = (
  onUnblock: (domain: BlockedDomain) => void,
  onRemove: (domain: BlockedDomain) => void
): ColumnDef<BlockedDomain>[] => [
  createSortableHeader<BlockedDomain>('Domain', 'domain'),
  {
    accessorKey: 'is_public_domain',
    header: 'Type',
    cell: ({ row }) => {
      const isPublic = row.getValue('is_public_domain') as boolean
      return (
        <Badge variant={isPublic ? 'default' : 'outline'}>
          {isPublic ? 'Public' : 'Custom'}
        </Badge>
      )
    },
  },
  createDateColumn<BlockedDomain>('created_at', 'Added At'),
  {
    accessorKey: 'reason',
    header: 'Reason',
    cell: ({ row }) => row.getValue('reason') || '-',
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const domain = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          {!domain.is_public_domain && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnblock(domain)}
                  className="min-h-[36px] px-2 text-primary hover:text-primary"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unblock domain</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(domain)}
                className="min-h-[36px] px-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remove domain</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  },
]

