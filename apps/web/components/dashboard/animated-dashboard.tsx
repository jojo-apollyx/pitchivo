'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Animated wrapper for dashboard sections
 */
interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/**
 * Animated welcome header with staggered children
 */
interface AnimatedWelcomeProps {
  userName: string
  organizationName: string
}

export function AnimatedWelcome({ userName, organizationName }: AnimatedWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.h1 
        className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Welcome back, {userName}{' '}
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', damping: 10 }}
          className="inline-block"
        >
          👋
        </motion.span>
      </motion.h1>
      <motion.p 
        className="text-sm text-muted-foreground mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {organizationName}
      </motion.p>
    </motion.div>
  )
}

/**
 * Animated metric card with hover effects and entrance animation
 */
interface AnimatedMetricCardProps {
  label: string
  value: string
  icon: LucideIcon
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  index: number
  id: string
}

export function AnimatedMetricCard({
  label,
  value,
  icon: Icon,
  change,
  changeType,
  index,
  id,
}: AnimatedMetricCardProps) {
  return (
    <motion.div
      id={id}
      className="bg-background-secondary rounded-lg p-4 sm:p-5 transition-colors duration-200 hover:bg-accent-surface group"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        delay: 0.1 + index * 0.05,
        ease: 'easeOut'
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">
          {label}
        </p>
        <motion.div 
          className="h-9 w-9 rounded-md bg-accent-surface flex items-center justify-center transition-colors duration-200 group-hover:bg-primary-dark/10"
          whileHover={{ rotate: 5, scale: 1.1 }}
        >
          <Icon className="h-4 w-4 text-primary-dark" />
        </motion.div>
      </div>
      <motion.div 
        className="text-2xl sm:text-3xl font-semibold text-foreground"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 + index * 0.05, type: 'spring', damping: 15 }}
      >
        {value}
      </motion.div>
      <p className={cn(
        'text-sm mt-1',
        changeType === 'positive' && 'text-semantic-success',
        changeType === 'negative' && 'text-semantic-error',
        changeType === 'neutral' && 'text-muted-foreground'
      )}>
        {change}
      </p>
    </motion.div>
  )
}

/**
 * Animated quick action button for desktop
 */
interface AnimatedQuickActionProps {
  icon: LucideIcon
  label: string
  variant: 'default' | 'outline'
  index: number
  id: string
}

export function AnimatedQuickAction({
  icon: Icon,
  label,
  variant,
  index,
  id,
}: AnimatedQuickActionProps) {
  return (
    <motion.button
      id={id}
      className={cn(
        'gap-2 h-10 rounded-md px-4 py-2 inline-flex items-center justify-center font-medium transition-colors duration-200',
        variant === 'default' 
          ? 'bg-primary-dark text-primary-foreground hover:bg-primary-dark/90' 
          : 'border border-border bg-background hover:bg-accent-surface'
      )}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Icon className="h-4 w-4" />
      {label}
    </motion.button>
  )
}

/**
 * Animated mobile quick action card
 */
interface AnimatedMobileActionProps {
  icon: LucideIcon
  label: string
  index: number
  id: string
}

export function AnimatedMobileAction({
  icon: Icon,
  label,
  index,
  id,
}: AnimatedMobileActionProps) {
  return (
    <motion.div
      id={id}
      className="bg-background-secondary rounded-lg p-4 flex flex-col items-center justify-center gap-2 h-full min-h-[100px] transition-colors duration-200 hover:bg-accent-surface touch-manipulation group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="h-10 w-10 rounded-md bg-accent-surface flex items-center justify-center flex-shrink-0 transition-colors duration-200 group-hover:bg-primary-dark/10"
        whileHover={{ rotate: 5 }}
      >
        <Icon className="h-5 w-5 text-primary-dark" />
      </motion.div>
      <p className="text-xs text-center font-medium leading-tight text-foreground">
        {label}
      </p>
    </motion.div>
  )
}

/**
 * Animated activity item
 */
interface AnimatedActivityItemProps {
  children: ReactNode
  index: number
  id: string
  href?: string
}

export function AnimatedActivityItem({
  children,
  index,
  id,
}: AnimatedActivityItemProps) {
  return (
    <motion.div
      id={id}
      className="p-4 sm:p-5 hover:bg-background-secondary transition-colors duration-200 group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Empty activity state with dopamine animation
 */
export function EmptyActivityState() {
  return (
    <motion.div 
      className="p-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-surface flex items-center justify-center"
        animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          className="w-8 h-8 rounded-full bg-primary-dark/20"
          animate={{ scale: [1, 0.9, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
      </motion.div>
      <p className="text-sm text-muted-foreground">No recent activity</p>
      <p className="text-xs text-muted-foreground/70 mt-1">
        Your activity will appear here as you use Pitchivo
      </p>
    </motion.div>
  )
}

/**
 * Animated section title
 */
interface AnimatedSectionTitleProps {
  children: ReactNode
  delay?: number
}

export function AnimatedSectionTitle({ children, delay = 0 }: AnimatedSectionTitleProps) {
  return (
    <motion.h2
      className="text-lg font-semibold mb-4 text-foreground"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.h2>
  )
}

/**
 * Staggered container for animated children
 */
interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggerContainer({ children, className, staggerDelay = 0.1 }: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

