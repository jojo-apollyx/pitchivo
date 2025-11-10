'use client'

import { LazyMotion, domAnimation } from 'framer-motion'
import { ReactNode } from 'react'

interface MotionProviderProps {
  children: ReactNode
}

/**
 * LazyMotion provider to prevent framer-motion hydration issues
 * Loads animation features only on the client side
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  )
}

