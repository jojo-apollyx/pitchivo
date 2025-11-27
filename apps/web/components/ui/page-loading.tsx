'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PageLoadingProps {
  className?: string
  message?: string
}

/**
 * Minimalist dopamine-style page loading animation
 * Features smooth, satisfying animations with elegant progress indication
 */
export function PageLoading({ className, message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-[400px] gap-6',
      className
    )}>
      {/* Main loader container */}
      <div className="relative">
        {/* Outer pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/10"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: 72, height: 72, margin: -12 }}
        />
        
        {/* Main spinner container */}
        <div className="relative w-12 h-12">
          {/* Background circle */}
          <motion.svg
            className="absolute inset-0"
            viewBox="0 0 48 48"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary) / 0.15)"
              strokeWidth="3"
            />
          </motion.svg>
          
          {/* Animated arc */}
          <motion.svg
            className="absolute inset-0"
            viewBox="0 0 48 48"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="100 100"
              strokeDashoffset="75"
              style={{
                filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.4))',
              }}
            />
          </motion.svg>
          
          {/* Center dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-2 h-2 rounded-full bg-primary" />
          </motion.div>
        </div>
      </div>
      
      {/* Loading text with subtle animation */}
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-sm text-muted-foreground font-medium">{message}</span>
        <motion.span
          className="flex gap-0.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-muted-foreground"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.15,
              }}
            />
          ))}
        </motion.span>
      </motion.div>
    </div>
  )
}

/**
 * Inline loading spinner for smaller loading states
 */
export function InlineLoading({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = {
    sm: { container: 'w-4 h-4', stroke: 1.5 },
    md: { container: 'w-6 h-6', stroke: 2 },
    lg: { container: 'w-8 h-8', stroke: 2.5 },
  }
  
  const { container, stroke } = sizeMap[size]
  
  return (
    <motion.svg
      className={cn(container, className)}
      viewBox="0 0 24 24"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="hsl(var(--primary) / 0.2)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray="50 50"
        strokeDashoffset="35"
      />
    </motion.svg>
  )
}

/**
 * Skeleton loading with dopamine shimmer effect
 */
export function SkeletonDopamine({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-md bg-muted', className)}>
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.08), transparent)',
        }}
        animate={{
          translateX: ['calc(-100%)', 'calc(100%)'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

