'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Loader2, 
  Database, 
  Send, 
  Download, 
  Upload,
  Search,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Zap
} from 'lucide-react'

type LoadingType = 
  | 'default' 
  | 'fetch' 
  | 'send' 
  | 'download' 
  | 'upload' 
  | 'search' 
  | 'refresh' 
  | 'ai' 
  | 'success'
  | 'processing'

interface ApiLoadingProps {
  className?: string
  type?: LoadingType
  message?: string
  progress?: number
  showProgress?: boolean
}

const iconMap: Record<LoadingType, React.ElementType> = {
  default: Loader2,
  fetch: Database,
  send: Send,
  download: Download,
  upload: Upload,
  search: Search,
  refresh: RefreshCw,
  ai: Sparkles,
  success: CheckCircle2,
  processing: Zap,
}

/**
 * Dopamine-style API loading component with contextual animations
 * Use different types for different API operations
 */
export function ApiLoading({ 
  className, 
  type = 'default',
  message,
  progress,
  showProgress = false,
}: ApiLoadingProps) {
  const Icon = iconMap[type]
  const isSuccess = type === 'success'
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4 p-6',
      className
    )}>
      {/* Icon container with animation */}
      <div className="relative">
        {/* Pulse background */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-full',
            isSuccess ? 'bg-semantic-success/20' : 'bg-primary/20'
          )}
          animate={isSuccess ? {} : {
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: isSuccess ? 0 : Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: 64, height: 64, margin: -8 }}
        />
        
        {/* Icon with animation */}
        <motion.div
          className={cn(
            'relative w-12 h-12 rounded-xl flex items-center justify-center',
            isSuccess ? 'bg-semantic-success-soft' : 'bg-accent-surface'
          )}
          animate={isSuccess ? {
            scale: [0.8, 1.1, 1],
          } : type === 'ai' ? {
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{
            duration: isSuccess ? 0.5 : 2,
            repeat: isSuccess ? 0 : Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            animate={isSuccess ? {} : type === 'default' || type === 'refresh' || type === 'processing' ? {
              rotate: 360,
            } : type === 'send' ? {
              x: [0, 4, 0],
            } : type === 'search' ? {
              scale: [1, 1.1, 1],
            } : {}}
            transition={{
              duration: type === 'default' || type === 'refresh' || type === 'processing' ? 1 : 0.8,
              repeat: isSuccess ? 0 : Infinity,
              ease: type === 'default' || type === 'refresh' || type === 'processing' ? 'linear' : 'easeInOut',
            }}
          >
            <Icon className={cn(
              'w-6 h-6',
              isSuccess ? 'text-semantic-success' : 'text-primary-dark'
            )} />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Message */}
      {message && (
        <motion.p
          className="text-sm text-muted-foreground font-medium text-center"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {message}
        </motion.p>
      )}
      
      {/* Progress bar */}
      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 100,
              }}
              style={{
                boxShadow: '0 0 8px hsl(var(--primary) / 0.4)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Inline API loading indicator
 */
export function ApiLoadingInline({ 
  className, 
  type = 'default',
  size = 'sm',
}: { 
  className?: string; 
  type?: LoadingType;
  size?: 'xs' | 'sm' | 'md';
}) {
  const Icon = iconMap[type]
  const sizeMap = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  }
  
  return (
    <motion.div
      className={cn('inline-flex', className)}
      animate={type === 'default' || type === 'refresh' || type === 'processing' ? {
        rotate: 360,
      } : {
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: type === 'default' || type === 'refresh' || type === 'processing' ? 'linear' : 'easeInOut',
      }}
    >
      <Icon className={cn(sizeMap[size], 'text-primary-dark')} />
    </motion.div>
  )
}

/**
 * Button loading state with dopamine animation
 */
export function ButtonLoading({ 
  className,
  children,
}: { 
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <Loader2 className="w-4 h-4" />
      </motion.div>
      {children}
    </span>
  )
}

/**
 * Toast-style loading notification
 */
export function LoadingToast({ 
  message,
  type = 'default',
}: { 
  message: string;
  type?: LoadingType;
}) {
  const Icon = iconMap[type]
  
  return (
    <div className="flex items-center gap-3 py-2">
      <motion.div
        className="w-8 h-8 rounded-lg bg-accent-surface flex items-center justify-center"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={type === 'default' || type === 'refresh' || type === 'processing' ? {
            rotate: 360,
          } : {}}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <Icon className="w-4 h-4 text-primary-dark" />
        </motion.div>
      </motion.div>
      <span className="text-sm font-medium text-foreground">{message}</span>
    </div>
  )
}

