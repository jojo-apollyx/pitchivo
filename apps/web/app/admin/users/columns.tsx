'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserCog, UserX, Eye, UserCheck } from 'lucide-react'
import { createSortableHeader, createDateColumn } from '@/components/data-table/column-helpers'
import type { User } from './types'

export const createUsersColumns = (
  onImpersonate: (user: User) => void,
  onSuspend: (user: User) => void,
  onUnsuspend: (user: User) => void,
  onViewDetails: (userId: string) => void
): ColumnDef<User>[] => [
  createSortableHeader<User>('Email', 'email'),
  createSortableHeader<User>('Name', 'full_name'),
  {
    accessorKey: 'organization_name',
    header: 'Organization',
    cell: ({ row }) => row.getValue('organization_name') || '-',
  },
  {
    accessorKey: 'org_role',
    header: 'Role',
    cell: ({ row }) => {
      const role = row.getValue('org_role') as string
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : '-'
    },
  },
  {
    accessorKey: 'is_pitchivo_admin',
    header: 'Admin',
    cell: ({ row }) => {
      const isAdmin = row.getValue('is_pitchivo_admin') as boolean
      return (
        <Badge variant={isAdmin ? 'default' : 'outline'}>
          {isAdmin ? 'Yes' : 'No'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant={status === 'active' ? 'default' : 'destructive'}>
          {status}
        </Badge>
      )
    },
  },
  createDateColumn<User>('created_at', 'Created At'),
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center justify-end gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewDetails(user.id)}
                className="min-h-[36px] px-2"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View details</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onImpersonate(user)}
                className="min-h-[36px] px-2"
              >
                <UserCog className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Impersonate user</p>
            </TooltipContent>
          </Tooltip>
          {user.status === 'active' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSuspend(user)}
                  className="min-h-[36px] px-2 text-destructive hover:text-destructive"
                >
                  <UserX className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Suspend user</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnsuspend(user)}
                  className="min-h-[36px] px-2 text-primary hover:text-primary"
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unsuspend user</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )
    },
  },
]

