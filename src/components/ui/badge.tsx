import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-white/10 text-foreground",
        gold: "bg-gold/15 text-gold border border-gold/25",
        cyan: "bg-cyan-accent/15 text-cyan-accent border border-cyan-accent/25",
        success: "bg-success/15 text-success border border-success/25",
        danger: "bg-danger/15 text-danger border border-danger/25",
        warning: "bg-warning/15 text-warning border border-warning/25",
        muted: "bg-white/5 text-muted",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
