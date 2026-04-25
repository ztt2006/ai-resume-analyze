import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-[0.01em] transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/12 bg-primary/8 text-primary",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-border bg-background text-muted-foreground",
        success: "border-primary/10 bg-[#edf4ff] text-primary",
        warning: "border-[#cfd8e8] bg-[#f5f7fb] text-[#4e5969]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
