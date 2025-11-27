'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

/**
 * Animated skeleton loading component with dopamine shimmer effect
 */
interface SkeletonProps {
  className?: string
  variant?: 'default' | 'circular' | 'text' | 'button'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        'bg-background-secondary rounded-md overflow-hidden relative',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'button' && 'h-10 rounded-md',
        className
      )}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  )
}

/**
 * Skeleton for a table row
 */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 sm:px-6 py-4">
          <Skeleton variant="text" className={i === 0 ? 'w-32' : 'w-20'} />
        </td>
      ))}
    </motion.tr>
  )
}

/**
 * Skeleton for a card
 */
interface SkeletonCardProps {
  className?: string
  hasImage?: boolean
  lines?: number
}

export function SkeletonCard({ className, hasImage = false, lines = 3 }: SkeletonCardProps) {
  return (
    <motion.div
      className={cn('bg-background-secondary rounded-lg p-4 sm:p-5', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {hasImage && (
        <Skeleton className="w-full h-40 mb-4" />
      )}
      <Skeleton variant="text" className="w-2/3 mb-3 h-5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={cn(
            'mb-2',
            i === lines - 1 ? 'w-1/2' : 'w-full'
          )} 
        />
      ))}
    </motion.div>
  )
}

/**
 * Skeleton for a metric card
 */
export function SkeletonMetricCard() {
  return (
    <motion.div
      className="bg-background-secondary rounded-lg p-4 sm:p-5"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <Skeleton variant="text" className="w-20" />
        <Skeleton variant="circular" className="h-9 w-9" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton variant="text" className="w-24" />
    </motion.div>
  )
}

/**
 * Skeleton for list items
 */
interface SkeletonListItemProps {
  hasAvatar?: boolean
  hasActions?: boolean
}

export function SkeletonListItem({ hasAvatar = true, hasActions = true }: SkeletonListItemProps) {
  return (
    <motion.div
      className="flex items-start gap-3 p-4 sm:p-5"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {hasAvatar && (
        <Skeleton variant="circular" className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <Skeleton variant="text" className="w-1/3 mb-2 h-5" />
        <Skeleton variant="text" className="w-1/2 mb-2" />
        <Skeleton variant="text" className="w-2/3" />
      </div>
      {hasActions && (
        <div className="flex gap-2 flex-shrink-0">
          <Skeleton variant="button" className="w-24" />
          <Skeleton variant="circular" className="h-9 w-9" />
        </div>
      )}
    </motion.div>
  )
}

/**
 * Full page loading skeleton with dopamine animation
 */
interface PageLoadingSkeletonProps {
  title?: boolean
  subtitle?: boolean
  cards?: number
  className?: string
}

export function PageLoadingSkeleton({ 
  title = true, 
  subtitle = true, 
  cards = 3,
  className 
}: PageLoadingSkeletonProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Header skeleton */}
      <section className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {title && <Skeleton className="h-8 w-40 mb-2" />}
              {subtitle && <Skeleton variant="text" className="w-48" />}
            </div>
            <Skeleton variant="button" className="w-32" />
          </div>
        </div>
      </section>

      {/* Content skeleton */}
      <section className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: cards }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
            >
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

/**
 * Inline loading indicator with text
 */
interface LoadingTextProps {
  text?: string
  className?: string
}

export function LoadingText({ text = 'Loading...', className }: LoadingTextProps) {
  return (
    <motion.div
      className={cn('flex items-center gap-2', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="h-4 w-4 rounded-full bg-primary-dark/30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-sm text-muted-foreground">{text}</span>
    </motion.div>
  )
}

/**
 * Staggered list loading
 */
interface StaggeredLoadingProps {
  items?: number
  ItemComponent?: React.ComponentType
  delay?: number
}

export function StaggeredLoading({ 
  items = 5, 
  ItemComponent = SkeletonListItem,
  delay = 0.1 
}: StaggeredLoadingProps) {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: i * delay }}
        >
          <ItemComponent />
        </motion.div>
      ))}
    </div>
  )
}

