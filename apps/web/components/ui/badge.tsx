import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        premium:
          "border-primary/20 bg-primary/10 text-primary shadow-sm hover:bg-primary/20",
        // Semantic variants using theme colors with light backgrounds for readability
        success:
          "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
        warning:
          "border-accent/30 bg-accent/10 text-accent hover:bg-accent/15",
        info:
          "border-secondary/30 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30",
        error:
          "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15",
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
