'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/**
 * Helper to create sortable column headers
 */
export function createSortableHeader<T>(
  label: string,
  accessorKey: string
): ColumnDef<T> {
  return {
    accessorKey,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 hover:bg-transparent"
        >
          {label}
          {column.getIsSorted() === 'asc' ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === 'desc' ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      )
    },
  }
}

/**
 * Helper to create status badge column
 */
export function createStatusColumn<T>(
  accessorKey: string,
  statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>
): ColumnDef<T> {
  return {
    accessorKey,
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue(accessorKey) as string
      const statusConfig = statusMap[status] || { label: status, variant: 'default' as const }
      return (
        <Badge variant={statusConfig.variant}>
          {statusConfig.label}
        </Badge>
      )
    },
  }
}

/**
 * Helper to format date column
 */
export function createDateColumn<T>(accessorKey: string, label: string = 'Date'): ColumnDef<T> {
  return {
    accessorKey,
    header: label,
    cell: ({ row }) => {
      const date = row.getValue(accessorKey) as string
      if (!date) return '-'
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    },
  }
}

