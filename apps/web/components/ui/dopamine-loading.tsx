'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface DopamineLoadingProps {
  className?: string
  message?: string
  variant?: 'default' | 'products' | 'campaigns' | 'rfqs' | 'analytics' | 'dashboard'
}

/**
 * Full-page dopamine loading animation with engaging minimalist visuals
 * Features smooth, satisfying animations that match the theme
 */
export function DopamineLoading({ 
  className, 
  message = 'Loading...', 
  variant = 'default' 
}: DopamineLoadingProps) {
  return (
    <div className={cn(
      'min-h-[60vh] flex flex-col items-center justify-center relative overflow-hidden',
      className
    )}>
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      
      {/* Main animation container */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Animated illustration based on variant */}
        <LoadingIllustration variant={variant} />
        
        {/* Loading text with bounce animation */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.p 
            className="text-base font-medium text-foreground mb-2"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {message}
          </motion.p>
          
          {/* Animated dots */}
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-primary"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Floating particles in background */}
      <FloatingParticles />
    </div>
  )
}

function LoadingIllustration({ variant }: { variant: DopamineLoadingProps['variant'] }) {
  const baseSize = 120
  
  return (
    <div className="relative" style={{ width: baseSize, height: baseSize }}>
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />
      
      {/* Middle ring */}
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-primary/20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.2, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.2,
        }}
      />
      
      {/* Main circle with rotating dashes */}
      <svg 
        className="absolute inset-0" 
        viewBox="0 0 120 120"
        fill="none"
      >
        {/* Static background circle */}
        <circle
          cx="60"
          cy="60"
          r="48"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Animated arc 1 */}
        <motion.circle
          cx="60"
          cy="60"
          r="48"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="75 226"
          fill="none"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ 
            transformOrigin: 'center',
            filter: 'drop-shadow(0 0 8px hsl(var(--primary) / 0.4))',
          }}
        />
        
        {/* Animated arc 2 - opposite direction */}
        <motion.circle
          cx="60"
          cy="60"
          r="38"
          stroke="hsl(var(--primary) / 0.4)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="50 188"
          fill="none"
          animate={{ rotate: -360 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      
      {/* Center icon based on variant */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-12 h-12 rounded-xl bg-accent-surface flex items-center justify-center"
          animate={{
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <CenterIcon variant={variant} />
        </motion.div>
      </div>
      
      {/* Orbiting dots */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-primary"
          style={{
            left: '50%',
            top: '50%',
            marginLeft: -6,
            marginTop: -6,
          }}
          animate={{
            x: [0, Math.cos((i * 120) * Math.PI / 180) * 55, 0],
            y: [0, Math.sin((i * 120) * Math.PI / 180) * 55, 0],
            scale: [0.6, 1, 0.6],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  )
}

function CenterIcon({ variant }: { variant: DopamineLoadingProps['variant'] }) {
  const iconClass = "w-6 h-6 text-primary"
  
  switch (variant) {
    case 'products':
      return (
        <motion.svg 
          className={iconClass} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
          />
          <motion.polyline
            points="3.27 6.96 12 12.01 20.73 6.96"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 1, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.line
            x1="12" y1="22.08" x2="12" y2="12"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 0.5, delay: 1, repeat: Infinity, repeatDelay: 1.5 }}
          />
        </motion.svg>
      )
    case 'campaigns':
      return (
        <motion.svg 
          className={iconClass} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
          />
          <motion.polyline
            points="22,6 12,13 2,6"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 0.8, delay: 0.5, repeat: Infinity, repeatDelay: 1.2 }}
          />
        </motion.svg>
      )
    case 'rfqs':
      return (
        <motion.svg 
          className={iconClass} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            animate={{ pathLength: [0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.8 }}
          />
          {/* Animated typing dots */}
          <motion.circle cx="8" cy="10" r="1" fill="currentColor"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.circle cx="12" cy="10" r="1" fill="currentColor"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle cx="16" cy="10" r="1" fill="currentColor"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </motion.svg>
      )
    case 'analytics':
      return (
        <motion.svg 
          className={iconClass} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Bar chart bars with staggered animation */}
          <motion.rect x="4" y="14" width="4" height="8" rx="1"
            animate={{ scaleY: [0, 1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect x="10" y="8" width="4" height="14" rx="1"
            animate={{ scaleY: [0, 1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
            style={{ transformOrigin: 'bottom' }}
          />
          <motion.rect x="16" y="4" width="4" height="18" rx="1"
            animate={{ scaleY: [0, 1, 0.8, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
            style={{ transformOrigin: 'bottom' }}
          />
        </motion.svg>
      )
    case 'dashboard':
      return (
        <motion.svg 
          className={iconClass} 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.rect x="3" y="3" width="7" height="7" rx="1"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.rect x="14" y="3" width="7" height="7" rx="1"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.rect x="14" y="14" width="7" height="7" rx="1"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
          <motion.rect x="3" y="14" width="7" height="7" rx="1"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
          />
        </motion.svg>
      )
    default:
      return (
        <motion.div
          className="w-4 h-4 rounded-full bg-primary"
          animate={{ scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )
  }
}

function FloatingParticles() {
  // Create floating particles for ambient effect
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 3 + 3,
    delay: Math.random() * 2,
    x: Math.random() * 100,
  }))
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            bottom: '-10px',
          }}
          animate={{
            y: [0, -400],
            x: [0, Math.sin(particle.id) * 50],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

/**
 * Inline loading for smaller areas
 */
export function DopamineLoadingInline({ 
  className, 
  message 
}: { 
  className?: string
  message?: string 
}) {
  return (
    <div className={cn('flex items-center justify-center gap-3 py-8', className)}>
      <div className="relative w-10 h-10">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 flex items-center justify-center"
          animate={{ scale: [0.9, 1.1, 0.9] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2 h-2 rounded-full bg-primary" />
        </motion.div>
      </div>
      {message && (
        <motion.span
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message}
        </motion.span>
      )}
    </div>
  )
}

/**
 * Card-level loading skeleton with dopamine shimmer
 */
export function DopamineCardSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn(
        'rounded-lg border border-border/30 bg-background-secondary overflow-hidden',
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Shimmer overlay */}
      <div className="relative p-4 space-y-3">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Title skeleton */}
        <div className="h-5 bg-muted rounded w-3/4" />
        
        {/* Content skeletons */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded w-full" />
          <div className="h-3 bg-muted rounded w-5/6" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        
        {/* Action skeleton */}
        <div className="flex gap-2 pt-2">
          <div className="h-8 bg-muted rounded w-20" />
          <div className="h-8 bg-muted rounded w-20" />
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Table loading with staggered row animations
 */
export function DopamineTableSkeleton({ 
  rows = 5,
  columns = 4,
  className 
}: { 
  rows?: number
  columns?: number
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-background-secondary"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: rowIndex * 0.1 }}
        >
          {/* Avatar skeleton */}
          <motion.div
            className="w-10 h-10 rounded-md bg-muted"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: rowIndex * 0.1 }}
          />
          
          {/* Column skeletons */}
          <div className="flex-1 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <motion.div
                key={colIndex}
                className={cn(
                  'h-4 bg-muted rounded',
                  colIndex === 0 ? 'flex-1' : 'w-20'
                )}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: (rowIndex * 0.1) + (colIndex * 0.05) 
                }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

