'use client'

import { cn } from '@/lib/utils'

interface IllustrationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: { width: 64, height: 64 },
  md: { width: 96, height: 96 },
  lg: { width: 128, height: 128 },
}

/**
 * Empty inbox/no messages illustration
 */
export function EmptyInboxIllustration({ className, size = 'md' }: IllustrationProps) {
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
}

/**
 * Empty products/no items illustration
 */
export function EmptyProductsIllustration({ className, size = 'md' }: IllustrationProps) {
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
}

/**
 * Empty campaigns/rocket illustration
 */
export function EmptyCampaignsIllustration({ className, size = 'md' }: IllustrationProps) {
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
}

/**
 * Empty search/no results illustration
 */
export function EmptySearchIllustration({ className, size = 'md' }: IllustrationProps) {
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
}

/**
 * Empty data/analytics illustration
 */
export function EmptyDataIllustration({ className, size = 'md' }: IllustrationProps) {
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
      {/* Chart background */}
      <rect x="24" y="32" width="80" height="64" rx="4" fill="hsl(var(--accent-surface))" />
      
      {/* Grid lines */}
      <path
        d="M32 56H96M32 72H96M32 88H96"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="1"
        opacity="0.1"
      />
      
      {/* Bar chart bars */}
      <rect x="36" y="64" width="12" height="24" rx="2" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <rect x="52" y="52" width="12" height="36" rx="2" fill="hsl(var(--primary-dark))" opacity="0.3" />
      <rect x="68" y="58" width="12" height="30" rx="2" fill="hsl(var(--primary-dark))" opacity="0.25" />
      <rect x="84" y="48" width="12" height="40" rx="2" fill="hsl(var(--primary-dark))" opacity="0.35" />
      
      {/* Trend line */}
      <path
        d="M40 76L58 64L76 70L92 52"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        opacity="0.4"
      />
      
      {/* Sparkle */}
      <circle cx="96" cy="28" r="3" fill="hsl(var(--primary-dark))" opacity="0.2" />
    </svg>
  )
}

/**
 * Success/celebration illustration
 */
export function SuccessIllustration({ className, size = 'md' }: IllustrationProps) {
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
      {/* Outer glow */}
      <circle cx="64" cy="64" r="40" fill="hsl(var(--accent-surface))" />
      
      {/* Main circle */}
      <circle cx="64" cy="64" r="32" fill="hsl(var(--background-secondary))" stroke="hsl(var(--primary-dark))" strokeWidth="2" opacity="0.8" />
      
      {/* Checkmark */}
      <path
        d="M48 64L58 74L80 52"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      
      {/* Confetti dots */}
      <circle cx="32" cy="40" r="3" fill="hsl(var(--primary-dark))" opacity="0.3" />
      <circle cx="96" cy="48" r="2" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <circle cx="88" cy="88" r="2.5" fill="hsl(var(--primary-dark))" opacity="0.25" />
      <circle cx="36" cy="80" r="2" fill="hsl(var(--primary-dark))" opacity="0.2" />
      
      {/* Sparkles */}
      <path
        d="M104 32L106 36L110 38L106 40L104 44L102 40L98 38L102 36L104 32Z"
        fill="hsl(var(--primary-dark))"
        opacity="0.35"
      />
      <path
        d="M24 56L25 58L27 59L25 60L24 62L23 60L21 59L23 58L24 56Z"
        fill="hsl(var(--primary-dark))"
        opacity="0.25"
      />
    </svg>
  )
}

/**
 * Generic empty state illustration
 */
export function EmptyStateIllustration({ className, size = 'md' }: IllustrationProps) {
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
      {/* Abstract shapes */}
      <circle cx="48" cy="56" r="24" fill="hsl(var(--accent-surface))" />
      <circle cx="72" cy="72" r="20" fill="hsl(var(--primary-dark))" opacity="0.15" />
      <circle cx="80" cy="48" r="12" fill="hsl(var(--primary-dark))" opacity="0.1" />
      
      {/* Dashed circle outline */}
      <circle 
        cx="64" 
        cy="64" 
        r="36" 
        stroke="hsl(var(--primary-dark))" 
        strokeWidth="2" 
        strokeDasharray="8 6"
        opacity="0.2"
        fill="none"
      />
      
      {/* Plus in center */}
      <path
        d="M64 52V76M52 64H76"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      
      {/* Decorative dots */}
      <circle cx="96" cy="32" r="2" fill="hsl(var(--primary-dark))" opacity="0.2" />
      <circle cx="28" cy="80" r="2" fill="hsl(var(--primary-dark))" opacity="0.15" />
    </svg>
  )
}

/**
 * User/team empty state illustration
 */
export function EmptyTeamIllustration({ className, size = 'md' }: IllustrationProps) {
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
      {/* Background shapes */}
      <circle cx="64" cy="64" r="36" fill="hsl(var(--accent-surface))" />
      
      {/* Person 1 (center) */}
      <circle cx="64" cy="48" r="12" fill="hsl(var(--background-secondary))" stroke="hsl(var(--primary-dark))" strokeWidth="2" opacity="0.8" />
      <path
        d="M44 88C44 76 52 68 64 68C76 68 84 76 84 88"
        fill="hsl(var(--background-secondary))"
        stroke="hsl(var(--primary-dark))"
        strokeWidth="2"
        opacity="0.8"
      />
      
      {/* Person 2 (left, smaller) */}
      <circle cx="36" cy="56" r="8" fill="hsl(var(--primary-dark))" opacity="0.15" />
      <path
        d="M24 80C24 72 28 68 36 68C44 68 48 72 48 80"
        fill="hsl(var(--primary-dark))"
        opacity="0.1"
      />
      
      {/* Person 3 (right, smaller) */}
      <circle cx="92" cy="56" r="8" fill="hsl(var(--primary-dark))" opacity="0.15" />
      <path
        d="M80 80C80 72 84 68 92 68C100 68 104 72 104 80"
        fill="hsl(var(--primary-dark))"
        opacity="0.1"
      />
      
      {/* Sparkle */}
      <circle cx="100" cy="28" r="2" fill="hsl(var(--primary-dark))" opacity="0.25" />
    </svg>
  )
}

