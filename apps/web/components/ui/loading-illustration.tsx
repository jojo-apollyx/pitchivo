'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingIllustrationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  progress?: number // 0-100
  message?: string
}

const sizeMap = {
  sm: { width: 120, height: 120 },
  md: { width: 160, height: 160 },
  lg: { width: 200, height: 200 },
}

/**
 * Minimalist loading illustration with dopamine-style progress animation
 * Features clean, satisfying animations that match the design system
 */
export function LoadingIllustration({ 
  className, 
  size = 'md',
  progress = 0,
  message
}: LoadingIllustrationProps) {
  const { width, height } = sizeMap[size]
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = width * 0.35
  const innerRadius = width * 0.28
  const circumference = 2 * Math.PI * outerRadius
  const progressOffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center justify-center gap-6', className)}>
      {/* Main illustration container */}
      <div className="relative" style={{ width, height }}>
        {/* Background glow pulse */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/5"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* SVG illustration */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          className="relative z-10"
        >
          {/* Outer decorative ring - dashed, slowly rotating */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={outerRadius + 12}
            stroke="hsl(var(--primary-dark) / 0.1)"
            strokeWidth="1"
            strokeDasharray="6 10"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{ transformOrigin: 'center' }}
          />

          {/* Background track circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            stroke="hsl(var(--accent-surface))"
            strokeWidth="8"
            fill="none"
          />

          {/* Progress circle with glow */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            stroke="hsl(var(--primary-dark))"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 120,
            }}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
              filter: progress > 0 ? 'drop-shadow(0 0 6px hsl(var(--primary-dark) / 0.4))' : 'none',
            }}
          />

          {/* Inner soft circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="hsl(var(--accent-surface))"
          />

          {/* Minimalist search/users icon */}
          <g>
            {/* Person 1 - center */}
            <motion.circle
              cx={centerX}
              cy={centerY - 8}
              r={10}
              fill="hsl(var(--background-secondary))"
              stroke="hsl(var(--primary-dark))"
              strokeWidth="2"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.path
              d={`M${centerX - 16} ${centerY + 20} Q${centerX} ${centerY + 4} ${centerX + 16} ${centerY + 20}`}
              fill="hsl(var(--background-secondary))"
              stroke="hsl(var(--primary-dark))"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Small person left - staggered animation */}
            <motion.circle
              cx={centerX - 28}
              cy={centerY}
              r={6}
              fill="hsl(var(--primary-dark))"
              opacity="0.2"
              animate={{ 
                opacity: [0.1, 0.25, 0.1],
                x: [-2, 2, -2],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
            />

            {/* Small person right - staggered animation */}
            <motion.circle
              cx={centerX + 28}
              cy={centerY}
              r={6}
              fill="hsl(var(--primary-dark))"
              opacity="0.2"
              animate={{ 
                opacity: [0.1, 0.25, 0.1],
                x: [2, -2, 2],
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            />
          </g>

          {/* Orbiting dot accents */}
          {[0, 1, 2].map((i) => {
            const angle = (i * 120 - 90) * (Math.PI / 180)
            const orbitRadius = outerRadius + 24
            return (
              <motion.circle
                key={i}
                cx={centerX + Math.cos(angle) * orbitRadius}
                cy={centerY + Math.sin(angle) * orbitRadius}
                r={3}
                fill="hsl(var(--primary-dark))"
                animate={{
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            )
          })}

          {/* Sparkle accents */}
          <motion.path
            d={`M${centerX + outerRadius + 8} ${centerY - outerRadius - 8}
                l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z`}
            fill="hsl(var(--primary-dark))"
            opacity="0.3"
            animate={{
              opacity: [0.1, 0.4, 0.1],
              scale: [0.8, 1.1, 0.8],
              rotate: [0, 90, 180],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: `${centerX + outerRadius + 8}px ${centerY - outerRadius - 8}px` }}
          />
        </svg>
      </div>

      {/* Progress text and message */}
      <div className="text-center space-y-2">
        {progress > 0 && (
          <motion.div
            className="text-2xl font-semibold text-foreground tabular-nums"
            key={Math.floor(progress)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {Math.floor(progress)}%
          </motion.div>
        )}
        
        <motion.p
          className="text-sm text-muted-foreground"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {message || 'Searching potential buyers...'}
        </motion.p>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-dark"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
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
      </div>
    </div>
  )
}
