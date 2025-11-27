'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface PageWrapperProps {
  children: ReactNode
  className?: string
}

/**
 * Reusable page wrapper with Framer Motion animations
 * Use this for consistent page transitions
 */
export function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Standardized page layout component for consistent dashboard pages
 * Provides sticky header, max-width content, and consistent spacing
 */
interface PageLayoutProps {
  children: ReactNode
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  noPadding?: boolean
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function PageLayout({
  children,
  title,
  description,
  icon: Icon,
  actions,
  className,
  maxWidth = '7xl',
  noPadding = false,
}: PageLayoutProps) {
  return (
    <main className={cn('min-h-screen bg-background', className)}>
      <div className="relative">
        {/* Page Header - Sticky */}
        <motion.section 
          className="sticky top-0 bg-background/98 backdrop-blur-sm z-10 border-b border-border/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className={cn('px-4 sm:px-6 lg:px-8 py-4 sm:py-6', maxWidthMap[maxWidth], 'mx-auto')}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                {Icon && (
                  <motion.div 
                    className="h-10 w-10 rounded-lg bg-accent-surface flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    <Icon className="h-5 w-5 text-primary-dark" />
                  </motion.div>
                )}
                <div>
                  <motion.h1 
                    className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {title}
                  </motion.h1>
                  {description && (
                    <motion.p 
                      className="text-sm text-muted-foreground mt-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
              </div>
              
              {actions && (
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  {actions}
                </motion.div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Page Content */}
        <motion.div
          className={cn(
            !noPadding && 'px-4 sm:px-6 lg:px-8 py-6',
            maxWidthMap[maxWidth],
            'mx-auto'
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {children}
        </motion.div>
      </div>
    </main>
  )
}

/**
 * Page section with optional title and consistent spacing
 */
interface PageSectionProps {
  children: ReactNode
  title?: string
  description?: string
  className?: string
  contentClassName?: string
  hasBorder?: boolean
}

export function PageSection({
  children,
  title,
  description,
  className,
  contentClassName,
  hasBorder = false,
}: PageSectionProps) {
  return (
    <motion.section 
      className={cn(
        hasBorder && 'border-b border-border/30 pb-6 mb-6',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className={contentClassName}>
        {children}
      </div>
    </motion.section>
  )
}

/**
 * Empty state component with dopamine animation
 */
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div 
      className={cn('text-center py-16 px-4', className)}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {icon && (
        <motion.div 
          className="mb-6 flex justify-center"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {icon}
        </motion.div>
      )}
      <motion.h2 
        className="text-xl font-semibold text-foreground mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p 
          className="text-muted-foreground mb-6 max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

/**
 * Stats card component with dopamine animation
 */
interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  className?: string
  delay?: number
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  className,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      className={cn(
        'bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <motion.div 
            className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10"
            whileHover={{ rotate: 5 }}
          >
            <Icon className="h-4 w-4 text-primary-dark" />
          </motion.div>
        )}
      </div>
      <motion.div 
        className="text-2xl sm:text-3xl font-semibold text-foreground"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: delay + 0.1, type: 'spring', damping: 15 }}
      >
        {value}
      </motion.div>
      {change && (
        <p className={cn(
          'text-sm mt-1',
          changeType === 'positive' && 'text-semantic-success',
          changeType === 'negative' && 'text-semantic-error',
          changeType === 'neutral' && 'text-muted-foreground'
        )}>
          {change}
        </p>
      )}
    </motion.div>
  )
}

/**
 * Content card with optional animation
 */
interface ContentCardProps {
  children: ReactNode
  className?: string
  animate?: boolean
  delay?: number
}

export function ContentCard({
  children,
  className,
  animate = true,
  delay = 0,
}: ContentCardProps) {
  const content = (
    <div className={cn(
      'bg-background-secondary rounded-lg transition-colors duration-200',
      className
    )}>
      {children}
    </div>
  )
  
  if (!animate) return content
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      {content}
    </motion.div>
  )
}

