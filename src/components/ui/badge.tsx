import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30",
        secondary: "bg-[var(--muted)] text-[var(--muted-foreground)]",
        destructive: "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30",
        outline: "border border-[var(--border)] text-[var(--foreground)]",
        success: "bg-green-500/20 text-green-400 border border-green-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
