'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

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

