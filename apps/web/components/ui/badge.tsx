import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-primary-dark text-white",
        secondary:
          "bg-background-secondary text-foreground",
        destructive:
          "bg-semantic-error-soft text-semantic-error",
        outline: 
          "border border-border bg-background text-foreground",
        premium:
          "bg-accent-surface text-primary-dark",
        success:
          "bg-semantic-success-soft text-semantic-success",
        warning:
          "bg-semantic-warning-soft text-semantic-warning",
        info:
          "bg-semantic-info-soft text-semantic-info",
        error:
          "bg-semantic-error-soft text-semantic-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
