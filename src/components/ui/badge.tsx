import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/**
 * Durum etiketleri. Renk tek başına anlam taşımaz; metin her zaman görünür.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "border-border-subtle bg-surface-subtle text-text-secondary",
        demo: "border-status-warning/40 bg-status-warning/10 text-status-warning",
        success: "border-status-success/40 bg-status-success/10 text-status-success",
        warning: "border-status-warning/40 bg-status-warning/10 text-status-warning",
        danger: "border-status-danger/40 bg-status-danger/10 text-status-danger",
        info: "border-status-info/40 bg-status-info/10 text-status-info",
        accent: "border-accent/50 bg-accent/15 text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
