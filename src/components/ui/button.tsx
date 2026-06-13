"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-gold-light to-gold text-midnight-900 hover:shadow-[0_10px_40px_-10px_rgba(212,175,55,0.6)] hover:brightness-105",
        cyan: "bg-gradient-to-r from-cyan-accent to-[#0094ff] text-midnight-950 hover:shadow-[0_10px_40px_-10px_rgba(0,212,255,0.6)]",
        secondary:
          "glass text-foreground hover:border-white/20 hover:bg-white/5",
        ghost: "text-foreground/80 hover:text-foreground hover:bg-white/5",
        outline:
          "border border-gold/40 text-gold hover:bg-gold/10 hover:border-gold",
        danger: "bg-danger text-white hover:brightness-110",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6",
        lg: "h-13 px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
