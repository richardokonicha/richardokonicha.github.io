import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * shadcn Button, rebuilt on this project's tokens.
 *
 * The site is square-cornered with 1px rules, so there is no radius here and
 * the "outline" look is a rule rather than a ring. `asChild` is omitted: the
 * component is only ever used as a real <button>, and dropping it avoids
 * pulling in Radix Slot.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-[0.66rem] uppercase tracking-[0.1em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-ink bg-ink text-paper hover:bg-ink-soft",
        outline:
          "border border-rule bg-transparent text-ink hover:border-ink hover:bg-paper-2",
        ghost: "border border-transparent bg-transparent text-muted hover:text-ink",
        ember: "border border-accent bg-accent text-paper hover:opacity-90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-2.5 py-1",
        lg: "h-11 px-6 py-2.5",
        icon: "size-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };