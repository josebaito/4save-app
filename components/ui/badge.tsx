import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        /* Estados de tickets */
        pendente:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/25",
        em_curso:
          "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-500/15 dark:border-blue-500/25",
        finalizado:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15 dark:border-emerald-500/25",
        cancelado:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/25",
        /* Prioridades */
        urgente:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 dark:bg-red-500/15 dark:border-red-500/25",
        alta:
          "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 dark:bg-orange-500/15 dark:border-orange-500/25",
        media:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-500/15 dark:border-amber-500/25",
        baixa:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/15 dark:border-emerald-500/25",
        /* Geral */
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        info:
          "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
        muted:
          "border-border bg-muted text-muted-foreground",
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
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
