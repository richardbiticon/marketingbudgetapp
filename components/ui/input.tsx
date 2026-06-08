"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-md border border-line2 bg-ink-deep px-3 text-sm text-cream-light",
        "placeholder:text-dim/70 transition-colors",
        "focus:outline-none focus:border-red focus:ring-2 focus:ring-red/25",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("block text-sm text-cream-base mb-1.5", className)} {...props} />
  )
);
Label.displayName = "Label";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-md border border-line2 bg-ink-deep px-3 py-2 text-sm text-cream-light min-h-[72px]",
      "placeholder:text-dim/70 focus:outline-none focus:border-red focus:ring-2 focus:ring-red/25",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
