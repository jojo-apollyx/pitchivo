'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animate?: boolean
}

const sizeMap = {
  sm: { width: 64, height: 64 },
  md: { width: 96, height: 96 },
  lg: { width: 128, height: 128 },
  xl: { width: 160, height: 160 },
}

/**
 * Empty inbox/no messages illustration with animation
 */
export function EmptyInboxIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const content = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Envelope body */}
      <rect x="24" y="40" width="80" height="56" rx="4" fill="hsl(var(--accent-surface))" />
      <rect x="24" y="40" width="80" height="56" rx="4" stroke="hsl(var(--primary-dark))" strokeWidth="2" opacity="0.3" />
      
      {/* Envelope flap */}
      <path
        d="M24 44L64 72L104 44"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      
      {/* Decorative dots */}
      <circle cx="40" cy="60" r="3" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <circle cx="52" cy="60" r="3" fill="hsl(var(--primary-dark))" opacity="0.15" />
      <circle cx="64" cy="60" r="3" fill="hsl(var(--primary-dark))" opacity="0.1" />
      
      {/* Sparkle accent */}
      <path
        d="M100 28L102 32L106 34L102 36L100 40L98 36L94 34L98 32L100 28Z"
        fill="hsl(var(--primary-dark))"
        opacity="0.4"
      />
    </svg>
  )
  
  if (!animate) return content
  
  return (
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {content}
    </motion.div>
  )
}

/**
 * Empty products/no items illustration with animation
 */
export function EmptyProductsIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const content = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Box back */}
      <rect x="32" y="44" width="64" height="52" rx="4" fill="hsl(var(--accent-surface))" />
      
      {/* Box front face */}
      <path
        d="M32 52C32 49.79 33.79 48 36 48H92C94.21 48 96 49.79 96 52V92C96 94.21 94.21 96 92 96H36C33.79 96 32 94.21 32 92V52Z"
        fill="hsl(var(--background-secondary))"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        opacity="0.8"
      />
      
      {/* Box opening flap */}
      <path
        d="M36 48L64 32L92 48"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      {/* Plus symbol */}
      <path
        d="M64 64V80M56 72H72"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      {/* Sparkle */}
      <circle cx="88" cy="36" r="4" fill="hsl(var(--primary-dark))" opacity="0.2" />
    </svg>
  )
  
  if (!animate) return content
  
  return (
    <motion.div
      animate={{ scale: [1, 1.02, 1], rotate: [0, 1, -1, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {content}
    </motion.div>
  )
}

/**
 * Empty campaigns/rocket illustration with animation
 */
export function EmptyCampaignsIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const content = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Rocket body */}
      <ellipse cx="64" cy="64" rx="16" ry="32" fill="hsl(var(--accent-surface))" transform="rotate(-45 64 64)" />
      <ellipse cx="64" cy="64" rx="14" ry="28" fill="hsl(var(--background-secondary))" stroke="hsl(var(--primary-dark))" strokeWidth="2" opacity="0.8" transform="rotate(-45 64 64)" />
      
      {/* Rocket window */}
      <circle cx="58" cy="58" r="6" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <circle cx="58" cy="58" r="4" fill="hsl(var(--accent-surface))" />
      
      {/* Rocket fins */}
      <path
        d="M78 78L90 90L82 82"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      
      {/* Flame trail */}
      <ellipse cx="82" cy="82" rx="4" ry="8" fill="hsl(var(--primary-dark))" opacity="0.15" transform="rotate(-45 82 82)" />
      <ellipse cx="88" cy="88" rx="3" ry="6" fill="hsl(var(--primary-dark))" opacity="0.1" transform="rotate(-45 88 88)" />
      
      {/* Stars */}
      <circle cx="32" cy="40" r="2" fill="hsl(var(--primary-dark))" opacity="0.3" />
      <circle cx="96" cy="32" r="2" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <circle cx="40" cy="88" r="1.5" fill="hsl(var(--primary-dark))" opacity="0.25" />
    </svg>
  )
  
  if (!animate) return content
  
  return (
    <motion.div
      animate={{ 
        y: [0, -8, 0],
        rotate: [-2, 2, -2],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {content}
    </motion.div>
  )
}

/**
 * Empty search/no results illustration with animation
 */
export function EmptySearchIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const content = (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Magnifying glass circle */}
      <circle cx="52" cy="52" r="24" fill="hsl(var(--accent-surface))" />
      <circle cx="52" cy="52" r="20" fill="hsl(var(--background-secondary))" stroke="hsl(var(--primary-dark))" strokeWidth="3" opacity="0.8" />
      
      {/* Glass handle */}
      <path
        d="M68 68L88 88"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.6"
      />
      
      {/* Question mark or empty indicator */}
      <path
        d="M48 46C48 42 50 40 52 40C54 40 56 42 56 44C56 46 54 48 52 50"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <circle cx="52" cy="58" r="2" fill="hsl(var(--primary-dark))" opacity="0.3" />
      
      {/* Sparkle */}
      <path
        d="M92 36L94 40L98 42L94 44L92 48L90 44L86 42L90 40L92 36Z"
        fill="hsl(var(--primary-dark))"
        opacity="0.25"
      />
    </svg>
  )
  
  if (!animate) return content
  
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      {content}
    </motion.div>
  )
}

/**
 * Empty data/analytics illustration with animation
 */
export function EmptyDataIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const bars = [
    { x: 36, y: 64, height: 24, opacity: 0.2, delay: 0 },
    { x: 52, y: 52, height: 36, opacity: 0.3, delay: 0.1 },
    { x: 68, y: 58, height: 30, opacity: 0.25, delay: 0.2 },
    { x: 84, y: 48, height: 40, opacity: 0.35, delay: 0.3 },
  ]
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Chart background */}
      <rect x="24" y="32" width="80" height="64" rx="4" fill="hsl(var(--accent-surface))" />
      
      {/* Grid lines */}
      <path
        d="M32 56H96M32 72H96M32 88H96"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="1"
        opacity="0.1"
      />
      
      {/* Bar chart bars with animation */}
      {bars.map((bar, i) => (
        <motion.rect
          key={i}
          x={bar.x}
          y={bar.y}
          width="12"
          height={bar.height}
          rx="2"
          fill="hsl(var(--primary-dark))"
          initial={{ opacity: bar.opacity * 0.5, scaleY: 0.8 }}
          animate={animate ? { 
            opacity: [bar.opacity * 0.5, bar.opacity, bar.opacity * 0.5], 
            scaleY: [0.8, 1, 0.8] 
          } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: bar.delay, ease: 'easeInOut' }}
          style={{ transformOrigin: `${bar.x + 6}px 88px` }}
        />
      ))}
      
      {/* Trend line */}
      <motion.path
        d="M40 76L58 64L76 70L92 52"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        initial={{ opacity: 0.4, pathLength: 0 }}
        animate={animate ? { opacity: [0.2, 0.5, 0.2], pathLength: [0.5, 1, 0.5] } : { pathLength: 1 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Sparkle with pulse */}
      <motion.circle
        cx="96"
        cy="28"
        r="3"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.2 }}
        animate={animate ? { opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

/**
 * Success/celebration illustration with animation
 */
export function SuccessIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  const confetti = [
    { cx: 32, cy: 40, r: 3, opacity: 0.3, delay: 0 },
    { cx: 96, cy: 48, r: 2, opacity: 0.2, delay: 0.2 },
    { cx: 88, cy: 88, r: 2.5, opacity: 0.25, delay: 0.4 },
    { cx: 36, cy: 80, r: 2, opacity: 0.2, delay: 0.6 },
  ]
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Outer glow with pulse */}
      <motion.circle
        cx="64"
        cy="64"
        r="40"
        fill="hsl(var(--accent-surface))"
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Main circle */}
      <circle cx="64" cy="64" r="32" fill="hsl(var(--background-secondary))" stroke="hsl(var(--primary-dark))" strokeWidth="2" opacity="0.8" />
      
      {/* Checkmark with draw animation */}
      <motion.path
        d="M48 64L58 74L80 52"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0.8 }}
        animate={animate ? { pathLength: [0, 1, 1], opacity: [0.5, 0.8, 0.8] } : { pathLength: 1 }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeOut' }}
      />
      
      {/* Confetti dots with bounce */}
      {confetti.map((dot, i) => (
        <motion.circle
          key={i}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill="hsl(var(--primary-dark))"
          initial={{ opacity: dot.opacity, y: 0 }}
          animate={animate ? { 
            opacity: [dot.opacity * 0.5, dot.opacity, dot.opacity * 0.5],
            y: [-3, 3, -3]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
        />
      ))}
      
      {/* Sparkles with rotation */}
      <motion.path
        d="M104 32L106 36L110 38L106 40L104 44L102 40L98 38L102 36L104 32Z"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.35, rotate: 0 }}
        animate={animate ? { opacity: [0.2, 0.5, 0.2], rotate: [0, 180, 360] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '104px 38px' }}
      />
      <motion.path
        d="M24 56L25 58L27 59L25 60L24 62L23 60L21 59L23 58L24 56Z"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.25, rotate: 0 }}
        animate={animate ? { opacity: [0.15, 0.35, 0.15], rotate: [0, -180, -360] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '24px 59px' }}
      />
    </svg>
  )
}

/**
 * Generic empty state illustration with animation
 */
export function EmptyStateIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Abstract shapes with gentle movement */}
      <motion.circle
        cx="48"
        cy="56"
        r="24"
        fill="hsl(var(--accent-surface))"
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="72"
        cy="72"
        r="20"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.15 }}
        animate={animate ? { opacity: [0.1, 0.2, 0.1], scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />
      <motion.circle
        cx="80"
        cy="48"
        r="12"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.1 }}
        animate={animate ? { opacity: [0.05, 0.15, 0.05], scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      
      {/* Dashed circle outline with rotation */}
      <motion.circle 
        cx="64" 
        cy="64" 
        r="36" 
        stroke="hsl(var(--primary-dark))" 
        strokeWidth="2" 
        strokeDasharray="8 6"
        opacity="0.2"
        fill="none"
        initial={{ rotate: 0 }}
        animate={animate ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '64px 64px' }}
      />
      
      {/* Plus in center with pulse */}
      <motion.path
        d="M64 52V76M52 64H76"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ opacity: 0.3 }}
        animate={animate ? { opacity: [0.2, 0.4, 0.2] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Decorative dots with float */}
      <motion.circle
        cx="96"
        cy="32"
        r="2"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.2 }}
        animate={animate ? { opacity: [0.1, 0.3, 0.1], y: [-2, 2, -2] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="28"
        cy="80"
        r="2"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.15 }}
        animate={animate ? { opacity: [0.1, 0.25, 0.1], y: [2, -2, 2] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </svg>
  )
}

/**
 * User/team empty state illustration with animation
 */
export function EmptyTeamIllustration({ className, size = 'md', animate = true }: IllustrationProps) {
  const { width, height } = sizeMap[size]
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('drop-shadow-sm', className)}
    >
      {/* Background shapes with pulse */}
      <motion.circle
        cx="64"
        cy="64"
        r="36"
        fill="hsl(var(--accent-surface))"
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Person 1 (center) - main focus */}
      <motion.circle
        cx="64"
        cy="48"
        r="12"
        fill="hsl(var(--background-secondary))"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        initial={{ opacity: 0.8 }}
        animate={animate ? { opacity: [0.7, 0.9, 0.7] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M44 88C44 76 52 68 64 68C76 68 84 76 84 88"
        fill="hsl(var(--background-secondary))"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        initial={{ opacity: 0.8 }}
        animate={animate ? { opacity: [0.7, 0.9, 0.7] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* Person 2 (left, smaller) with gentle sway */}
      <motion.g
        initial={{ x: 0 }}
        animate={animate ? { x: [-2, 2, -2] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.circle
          cx="36"
          cy="56"
          r="8"
          fill="hsl(var(--primary-dark))"
          initial={{ opacity: 0.15 }}
          animate={animate ? { opacity: [0.1, 0.2, 0.1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        />
        <path
          d="M24 80C24 72 28 68 36 68C44 68 48 72 48 80"
          fill="hsl(var(--primary-dark))"
          opacity="0.1"
        />
      </motion.g>
      
      {/* Person 3 (right, smaller) with gentle sway */}
      <motion.g
        initial={{ x: 0 }}
        animate={animate ? { x: [2, -2, 2] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        <motion.circle
          cx="92"
          cy="56"
          r="8"
          fill="hsl(var(--primary-dark))"
          initial={{ opacity: 0.15 }}
          animate={animate ? { opacity: [0.1, 0.2, 0.1] } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
        />
        <path
          d="M80 80C80 72 84 68 92 68C100 68 104 72 104 80"
          fill="hsl(var(--primary-dark))"
          opacity="0.1"
        />
      </motion.g>
      
      {/* Sparkle with pulse */}
      <motion.circle
        cx="100"
        cy="28"
        r="2"
        fill="hsl(var(--primary-dark))"
        initial={{ opacity: 0.25 }}
        animate={animate ? { opacity: [0.15, 0.4, 0.15], scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  )
}

