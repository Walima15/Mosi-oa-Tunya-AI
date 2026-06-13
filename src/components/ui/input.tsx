import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-2xl border border-border bg-white/[0.03] px-4 text-sm text-foreground placeholder:text-muted/70 transition-all duration-200 focus-visible:outline-none focus-visible:border-gold/50 focus-visible:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-gold/20 disabled:opacity-50",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("mb-2 block text-xs font-medium text-muted", className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Input, Label };
