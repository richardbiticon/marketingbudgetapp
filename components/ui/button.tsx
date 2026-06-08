"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-red text-white hover:bg-[#e21f33] shadow-[0_10px_30px_rgba(215,23,42,.35)] active:translate-y-px",
        ghost:
          "bg-transparent text-cream-base/80 hover:text-white hover:bg-white/5 border border-line",
        outline:
          "border border-line2 bg-white/[0.02] text-cream-base hover:bg-white/[0.06]",
        danger:
          "bg-transparent text-red border border-red/40 hover:bg-red/10",
        subtle:
          "bg-white/[0.04] text-cream-base hover:bg-white/[0.08] border border-line",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        icon: "h-9 w-9",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  }
);
Button.displayName = "Button";
export { buttonVariants };
