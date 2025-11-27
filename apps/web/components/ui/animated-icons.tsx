'use client'

import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Package, 
  Mail, 
  MessageSquare, 
  TrendingUp, 
  CreditCard, 
  Settings,
  Users,
  BarChart3,
  Send,
  CheckCircle2,
  Sparkles,
  Zap,
  Bell,
  Heart,
  Star,
  Rocket,
  Target,
  Shield,
  Award,
  Trophy,
  Gift,
  Lightbulb,
  type LucideIcon
} from 'lucide-react'
import { ReactNode } from 'react'

interface AnimatedIconProps {
  icon: LucideIcon
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animation?: 'bounce' | 'pulse' | 'shake' | 'float' | 'spin' | 'ping' | 'glow' | 'none'
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'default'
  containerClassName?: string
  showContainer?: boolean
  delay?: number
}

const sizeMap = {
  sm: { icon: 'w-4 h-4', container: 'w-8 h-8' },
  md: { icon: 'w-5 h-5', container: 'w-10 h-10' },
  lg: { icon: 'w-6 h-6', container: 'w-12 h-12' },
  xl: { icon: 'w-8 h-8', container: 'w-16 h-16' },
}

const colorMap = {
  primary: {
    bg: 'bg-accent-surface',
    text: 'text-primary-dark',
    glow: 'hsl(var(--primary) / 0.3)',
  },
  success: {
    bg: 'bg-semantic-success-soft',
    text: 'text-semantic-success',
    glow: 'hsl(var(--semantic-success) / 0.3)',
  },
  warning: {
    bg: 'bg-semantic-warning-soft',
    text: 'text-semantic-warning',
    glow: 'hsl(var(--semantic-warning) / 0.3)',
  },
  error: {
    bg: 'bg-semantic-error-soft',
    text: 'text-semantic-error',
    glow: 'hsl(var(--semantic-error) / 0.3)',
  },
  info: {
    bg: 'bg-semantic-info-soft',
    text: 'text-semantic-info',
    glow: 'hsl(var(--semantic-info) / 0.3)',
  },
  purple: {
    bg: 'bg-semantic-purple-soft',
    text: 'text-semantic-purple',
    glow: 'hsl(var(--semantic-purple) / 0.3)',
  },
  default: {
    bg: 'bg-background-secondary',
    text: 'text-muted-foreground',
    glow: 'hsl(var(--muted-foreground) / 0.2)',
  },
}

const animations: Record<NonNullable<AnimatedIconProps['animation']>, Variants> = {
  bounce: {
    animate: {
      y: [0, -4, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  pulse: {
    animate: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  shake: {
    animate: {
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 2,
        ease: 'easeInOut',
      },
    },
  },
  float: {
    animate: {
      y: [0, -6, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
  ping: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  glow: {
    animate: {
      filter: ['drop-shadow(0 0 0px currentColor)', 'drop-shadow(0 0 8px currentColor)', 'drop-shadow(0 0 0px currentColor)'],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  },
  none: {
    animate: {},
  },
}

/**
 * Animated icon component with dopamine-style effects
 * Perfect for empty states, feature highlights, and micro-interactions
 */
export function AnimatedIcon({
  icon: Icon,
  className,
  size = 'md',
  animation = 'none',
  color = 'primary',
  containerClassName,
  showContainer = true,
  delay = 0,
}: AnimatedIconProps) {
  const { icon: iconSize, container } = sizeMap[size]
  const { bg, text, glow } = colorMap[color]
  const animationVariant = animations[animation]
  
  const iconElement = (
    <motion.div
      variants={animationVariant}
      animate="animate"
      initial={false}
      style={{ transitionDelay: `${delay}s` }}
    >
      <Icon className={cn(iconSize, text, className)} />
    </motion.div>
  )
  
  if (!showContainer) {
    return iconElement
  }
  
  return (
    <motion.div
      className={cn(
        container,
        bg,
        'rounded-xl flex items-center justify-center transition-colors duration-200',
        containerClassName
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={animation === 'none' ? {
        scale: 1.05,
        boxShadow: `0 0 16px ${glow}`,
      } : undefined}
    >
      {iconElement}
    </motion.div>
  )
}

/**
 * Pre-configured animated icons for common use cases
 */
export const DopamineIcons = {
  // Products
  Products: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Package} color="primary" animation="bounce" {...props} />
  ),
  
  // Campaigns
  Campaigns: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Send} color="info" animation="pulse" {...props} />
  ),
  
  // RFQs
  RFQs: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={MessageSquare} color="success" animation="shake" {...props} />
  ),
  
  // Analytics
  Analytics: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={BarChart3} color="purple" animation="float" {...props} />
  ),
  
  // Settings
  Settings: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Settings} color="default" animation="spin" {...props} />
  ),
  
  // Billing
  Billing: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={CreditCard} color="warning" animation="pulse" {...props} />
  ),
  
  // Success
  Success: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={CheckCircle2} color="success" animation="ping" {...props} />
  ),
  
  // AI/Magic
  AI: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Sparkles} color="purple" animation="glow" {...props} />
  ),
  
  // Notification
  Notification: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Bell} color="warning" animation="shake" {...props} />
  ),
  
  // Trophy/Achievement
  Achievement: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Trophy} color="warning" animation="bounce" {...props} />
  ),
  
  // Rocket/Launch
  Launch: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Rocket} color="info" animation="float" {...props} />
  ),
  
  // Target/Goal
  Target: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Target} color="error" animation="pulse" {...props} />
  ),
  
  // Idea/Lightbulb
  Idea: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Lightbulb} color="warning" animation="glow" {...props} />
  ),
  
  // Trending
  Trending: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={TrendingUp} color="success" animation="bounce" {...props} />
  ),
  
  // Email
  Email: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Mail} color="primary" animation="pulse" {...props} />
  ),
  
  // Users
  Users: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Users} color="info" animation="float" {...props} />
  ),
  
  // Shield/Security
  Security: (props: Partial<AnimatedIconProps>) => (
    <AnimatedIcon icon={Shield} color="success" animation="pulse" {...props} />
  ),
}

/**
 * Staggered icon group for empty states
 */
export function IconGroup({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      className={cn('flex items-center justify-center gap-3', className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * Floating decoration icons for backgrounds
 */
export function FloatingIcon({ 
  icon: Icon,
  className,
  duration = 3,
  delay = 0,
}: {
  icon: LucideIcon;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <motion.div
      className={cn('absolute pointer-events-none', className)}
      animate={{
        y: [0, -10, 0],
        rotate: [-5, 5, -5],
        opacity: [0.2, 0.4, 0.2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <Icon className="w-6 h-6 text-primary/20" />
    </motion.div>
  )
}

