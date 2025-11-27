'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LoadingIllustrationProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  progress?: number // 0-100
}

const sizeMap = {
  sm: { width: 96, height: 96, strokeWidth: 2 },
  md: { width: 128, height: 128, strokeWidth: 2.5 },
  lg: { width: 160, height: 160, strokeWidth: 3 },
}

/**
 * Minimalistic loading illustration with dopamine-style progress animation
 * Features smooth, satisfying animations with a progress indicator
 */
export function LoadingIllustration({ 
  className, 
  size = 'md',
  progress = 0 
}: LoadingIllustrationProps) {
  const { width, height, strokeWidth } = sizeMap[size]
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.3
  const circumference = 2 * Math.PI * radius
  const progressOffset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      {/* Main illustration container */}
      <div className="relative" style={{ width, height }}>
        {/* Progress ring with background pulse */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0 -rotate-90"
        >
          {/* Background circle with subtle pulse */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius + 8}
            fill="none"
            stroke="hsl(var(--primary) / 0.1)"
            strokeWidth={strokeWidth * 0.5}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary) / 0.15)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progressOffset }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 100,
              duration: 0.5,
            }}
            style={{
              filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))',
            }}
          />
        </svg>

        {/* Central icon - database/search illustration */}
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="absolute inset-0"
        >
          {/* Database cylinder */}
          <motion.ellipse
            cx={centerX}
            cy={centerY + 8}
            rx={radius * 0.6}
            ry={radius * 0.4}
            fill="hsl(var(--accent-surface))"
            stroke="hsl(var(--primary) / 0.3)"
            strokeWidth={strokeWidth * 0.8}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0.6, 0.8, 0.6],
              scale: [0.95, 1, 0.95],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Database top */}
          <motion.ellipse
            cx={centerX}
            cy={centerY - 8}
            rx={radius * 0.6}
            ry={radius * 0.25}
            fill="hsl(var(--background-secondary))"
            stroke="hsl(var(--primary) / 0.4)"
            strokeWidth={strokeWidth * 0.8}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.7, 0.9, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
          />

          {/* Data points - animated */}
          {[0, 1, 2].map((i) => (
            <motion.circle
              key={i}
              cx={centerX - radius * 0.3 + (i * radius * 0.3)}
              cy={centerY + 12}
              r={strokeWidth * 0.8}
              fill="hsl(var(--primary) / 0.4)"
              initial={{ opacity: 0, y: centerY + 8 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [centerY + 8, centerY - 4, centerY - 4],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 0.3,
              }}
            />
          ))}

          {/* Sparkle accents */}
          {[
            { x: centerX - radius * 1.2, y: centerY - radius * 0.8 },
            { x: centerX + radius * 1.2, y: centerY - radius * 0.6 },
            { x: centerX - radius * 0.8, y: centerY + radius * 1.1 },
          ].map((pos, i) => (
            <motion.path
              key={i}
              d={`M${pos.x} ${pos.y}L${pos.x + 2} ${pos.y + 2}L${pos.x + 4} ${pos.y}L${pos.x + 2} ${pos.y - 2}Z`}
              fill="hsl(var(--primary) / 0.3)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </svg>
      </div>

      {/* Progress text */}
      <motion.div
        className="text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.span
          key={Math.floor(progress)}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {progress > 0 ? `${Math.floor(progress)}%` : 'Searching...'}
        </motion.span>
      </motion.div>
    </div>
  )
}

